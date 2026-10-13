import "server-only";
import { db } from "@/lib/db";
import { byCampaign, dailySeries, projectMonthSpend, summarize, type CampaignDayRow } from "./metrics";
import { buildRecommendations, type ConversionActionSummary, type KeywordPerformance } from "./recommendations";
import { addDays, daysBetween, type DateRange } from "./range";

/** Everything the dashboard and the printable report show for one account and period. */

const MICROS = 1_000_000;
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export type AdsAccountSummary = Awaited<ReturnType<typeof getAccount>>;

export async function getAccount(id: string) {
  const account = await db().adsAccount.findUnique({ where: { id } });
  if (!account) return null;
  return { ...account, monthlyBudget: account.monthlyBudget === null ? null : Number(account.monthlyBudget) };
}

async function campaignDays(accountId: string, from: string, to: string): Promise<CampaignDayRow[]> {
  const rows = await db().adsCampaignDay.findMany({ where: { accountId, date: { gte: day(from), lte: day(to) } }, orderBy: { date: "asc" } });
  return rows.map((r) => ({ ...r, date: iso(r.date), cost: Number(r.costMicros) / MICROS }));
}

export async function loadReport(account: NonNullable<AdsAccountSummary>, range: DateRange, today: string) {
  const client = db();
  const monthStart = `${today.slice(0, 8)}01`;
  const [rows, prevRows, monthRows, conversionGroups, keywordRows] = await Promise.all([
    campaignDays(account.id, range.from, range.to),
    campaignDays(account.id, range.prevFrom, range.prevTo),
    client.adsCampaignDay.aggregate({ where: { accountId: account.id, date: { gte: day(monthStart), lte: day(today) } }, _sum: { costMicros: true } }),
    client.adsConversionDay.groupBy({
      by: ["actionName", "category"],
      where: { accountId: account.id, date: { gte: day(range.from), lte: day(range.to) } },
      _sum: { conversions: true, value: true },
    }),
    client.adsKeyword.findMany({ where: { accountId: account.id } }),
  ]);

  const current = summarize(rows);
  const previous = summarize(prevRows);
  const campaigns = byCampaign(rows);
  const series = dailySeries(rows, range.from, range.to);

  const conversionActions: ConversionActionSummary[] = conversionGroups
    .map((g) => ({ name: g.actionName, category: g.category, conversions: g._sum.conversions ?? 0, value: g._sum.value ?? 0 }))
    .filter((a) => a.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions);

  const keywords: KeywordPerformance[] = keywordRows.map((k) => ({
    text: k.text,
    matchType: k.matchType,
    campaignName: k.campaignName,
    adGroupName: k.adGroupName,
    qualityScore: k.qualityScore,
    impressions: k.impressions,
    clicks: k.clicks,
    cost: Number(k.costMicros) / MICROS,
    conversions: k.conversions,
  }));

  // Month pacing (always the current calendar month, whatever range is shown).
  const monthSpend = Number(monthRows._sum.costMicros ?? 0) / MICROS;
  const daysInMonth = daysBetween(monthStart, addDays(`${addDays(monthStart, 31).slice(0, 8)}01`, -1));
  const dayOfMonth = Number(today.slice(8, 10));
  const projectedMonthSpend = projectMonthSpend(monthSpend, dayOfMonth, daysInMonth);

  const recommendations = buildRecommendations({
    currency: account.currencyCode,
    current,
    previous,
    campaigns,
    keywords,
    conversionActions,
    monthlyBudget: account.monthlyBudget,
    projectedMonthSpend: account.monthlyBudget ? projectedMonthSpend : null,
  });

  const topKeywords = [...keywords].sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks).slice(0, 10);

  return {
    current,
    previous,
    campaigns,
    series,
    conversionActions,
    topKeywords,
    recommendations,
    pacing: { monthSpend, projectedMonthSpend, dayOfMonth, daysInMonth, budget: account.monthlyBudget },
    hasData: rows.length > 0,
  };
}

export type AdsReport = Awaited<ReturnType<typeof loadReport>>;

/** Spend and conversions per account over a period, for the accounts overview. */
export async function accountTotals(from: string, to: string) {
  const groups = await db().adsCampaignDay.groupBy({
    by: ["accountId"],
    where: { date: { gte: day(from), lte: day(to) } },
    _sum: { costMicros: true, conversions: true, clicks: true, impressions: true, conversionsValue: true },
  });
  return new Map(
    groups.map((g) => [
      g.accountId,
      summarize([
        {
          cost: Number(g._sum.costMicros ?? 0) / MICROS,
          conversions: g._sum.conversions ?? 0,
          clicks: g._sum.clicks ?? 0,
          impressions: g._sum.impressions ?? 0,
          conversionsValue: g._sum.conversionsValue ?? 0,
        },
      ]),
    ]),
  );
}
