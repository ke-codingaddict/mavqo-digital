import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { csvCell } from "@/lib/leads/csv";
import { getAccount, loadReport } from "@/lib/google-ads/report";
import { channelLabel, statusLabel } from "@/lib/google-ads/metrics";
import { resolveRange, todayIn } from "@/lib/google-ads/range";

/** The report's numbers as CSV: one row per campaign, then one row per day. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(user.role, "ads:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const account = await getAccount(id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp = request.nextUrl.searchParams;
  const today = todayIn(account.timeZone ?? undefined);
  const range = resolveRange({ range: sp.get("range") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined }, today);
  const report = await loadReport(account, range, today);

  const round = (n: number | null, d = 2) => (n === null ? "" : Number(n.toFixed(d)));
  const row = (cells: unknown[]) => cells.map(csvCell).join(",");
  const lines = [
    row([`${account.name} — Google Ads`, `${range.from} to ${range.to}`, `Currency: ${account.currencyCode}`]),
    "",
    row(["Campaign", "Type", "Status", "Spent", "Impressions", "Clicks", "CTR %", "Avg CPC", "Conversions", "Cost per conversion", "Conversion rate %", "Conversion value", "Search impression share %"]),
    ...report.campaigns.map((c) =>
      row([
        c.name,
        channelLabel(c.channelType),
        statusLabel(c.status),
        round(c.cost),
        c.impressions,
        c.clicks,
        round(c.ctr === null ? null : c.ctr * 100),
        round(c.cpc),
        round(c.conversions),
        round(c.costPerConversion),
        round(c.conversionRate === null ? null : c.conversionRate * 100),
        round(c.conversionsValue),
        round(c.impressionShare === null ? null : c.impressionShare * 100, 1),
      ]),
    ),
    row(["Total", "", "", round(report.current.cost), report.current.impressions, report.current.clicks, round(report.current.ctr === null ? null : report.current.ctr * 100), round(report.current.cpc), round(report.current.conversions), round(report.current.costPerConversion), round(report.current.conversionRate === null ? null : report.current.conversionRate * 100), round(report.current.conversionsValue), ""]),
    "",
    row(["Date", "Spent", "Impressions", "Clicks", "Conversions"]),
    ...report.series.map((d) => row([d.date, round(d.cost), d.impressions, d.clicks, round(d.conversions)])),
  ];

  await audit({ action: "ads_report_exported", actorId: user.id, entityType: "ads_account", entityId: account.id, metadata: { from: range.from, to: range.to } });

  const slug = account.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "account";
  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="google-ads-${slug}-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
