import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { ENQUIRY_TYPES } from "@/lib/validation/lead";
import { LEAD_STATUSES } from "@/lib/leads/labels";
import { getClientIpHash } from "@/lib/security/request";
import { csvCell } from "@/lib/leads/csv";

const COLUMNS = [
  "reference", "createdAt", "enquiryType", "status", "name", "email", "phone", "organization",
  "preferredContact", "productInterest", "serviceInterest", "organizationSize", "websiteUrl",
  "objective", "budgetRange", "timeline", "message", "sourcePage", "referrer",
  "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "firstContactedAt",
] as const;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(user.role, "leads:export")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const status = LEAD_STATUSES.find((s) => s === sp.get("status"));
  const type = ENQUIRY_TYPES.find((t) => t === sp.get("type"));

  const leads = await db().lead.findMany({
    where: { ...(status ? { status } : {}), ...(type ? { enquiryType: type } : {}) },
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });

  await audit({
    action: "leads_exported",
    actorId: user.id,
    entityType: "lead",
    metadata: { count: leads.length, status: status ?? null, type: type ?? null },
    ipHash: await getClientIpHash(),
  });

  const lines = [COLUMNS.join(","), ...leads.map((l) => COLUMNS.map((c) => csvCell(l[c])).join(","))];
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mavqo-leads-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
