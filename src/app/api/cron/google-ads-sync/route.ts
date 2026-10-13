import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { syncAllAccounts } from "@/lib/google-ads/sync";

/**
 * Daily Google Ads sync, called by Vercel Cron (see vercel.json) or any
 * scheduler that sends `Authorization: Bearer <CRON_SECRET>`.
 */
export const maxDuration = 300;

function authorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: NextRequest) {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncAllAccounts();
  if (result.failed.length) console.error(`[google-ads] cron: ${result.failed.length} account(s) failed to sync`);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
