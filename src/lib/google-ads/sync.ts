import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getGoogleAdsConfig } from "./config";
import { GoogleAdsError, search } from "./client";
import { addDays, MAX_HISTORY_DAYS, todayIn } from "./range";

/**
 * Copies Google Ads metrics into our database. The first sync backfills a
 * year of history; later syncs refresh the last 30 days, because Google keeps
 * attributing conversions to the day of the click for weeks afterwards.
 */

const REFRESH_DAYS = 30;
const CHUNK = 1000;

type CampaignRow = {
  campaign?: { id?: string; name?: string; status?: string; advertisingChannelType?: string };
  segments?: { date?: string };
  metrics?: {
    impressions?: string;
    clicks?: string;
    costMicros?: string;
    conversions?: number;
    conversionsValue?: number;
    searchImpressionShare?: number;
    searchBudgetLostImpressionShare?: number;
    searchRankLostImpressionShare?: number;
  };
};

type ConversionRow = {
  campaign?: { id?: string };
  segments?: { date?: string; conversionActionName?: string; conversionActionCategory?: string };
  metrics?: { conversions?: number; conversionsValue?: number };
};

type KeywordRow = {
  campaign?: { name?: string };
  adGroup?: { id?: string; name?: string };
  adGroupCriterion?: { criterionId?: string; keyword?: { text?: string; matchType?: string }; qualityInfo?: { qualityScore?: number } };
  metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: number };
};

type CustomerRow = { customer?: { currencyCode?: string; timeZone?: string } };

const int = (v: unknown) => Math.max(0, Math.round(Number(v ?? 0)) || 0);
const num = (v: unknown) => Number(v ?? 0) || 0;
const share = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const text = (v: unknown, max = 255) => String(v ?? "").slice(0, max);

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type SyncResult = { ok: true; from: string; to: string; campaignDays: number } | { ok: false; error: string; needsReconnect: boolean };

export async function syncAccount(accountId: string, opts: { full?: boolean } = {}): Promise<SyncResult> {
  const client = db();
  const account = await client.adsAccount.findUnique({ where: { id: accountId } });
  if (!account) return { ok: false, error: "Account not found.", needsReconnect: false };

  const config = await getGoogleAdsConfig();
  if (!config.ready) return { ok: false, error: "Connect Google Ads in Settings first.", needsReconnect: true };

  const cid = account.customerId;
  try {
    const [customer] = await search<CustomerRow>(config, cid, "SELECT customer.currency_code, customer.time_zone FROM customer LIMIT 1");
    const timeZone = customer?.customer?.timeZone ?? account.timeZone ?? "Africa/Nairobi";
    const to = todayIn(timeZone);
    const from = addDays(to, -(opts.full || !account.lastSyncedAt ? MAX_HISTORY_DAYS : REFRESH_DAYS));
    const kwFrom = addDays(to, -29);
    const during = (a: string, b: string) => `segments.date BETWEEN '${a}' AND '${b}'`;

    const [campaignRows, conversionRows, keywordRows] = await Promise.all([
      search<CampaignRow>(
        config,
        cid,
        `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, segments.date,
                metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value,
                metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share
         FROM campaign WHERE ${during(from, to)}`,
      ),
      search<ConversionRow>(
        config,
        cid,
        `SELECT campaign.id, segments.date, segments.conversion_action_name, segments.conversion_action_category,
                metrics.conversions, metrics.conversions_value
         FROM campaign WHERE ${during(from, to)} AND metrics.conversions > 0`,
      ),
      search<KeywordRow>(
        config,
        cid,
        `SELECT campaign.name, ad_group.id, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text,
                ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score,
                metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
         FROM keyword_view WHERE ${during(kwFrom, to)} AND metrics.impressions > 0`,
      ),
    ]);

    const campaignDays: Prisma.AdsCampaignDayCreateManyInput[] = [];
    for (const r of campaignRows) {
      const m = r.metrics ?? {};
      if (!r.campaign?.id || !r.segments?.date) continue;
      const row = {
        impressions: int(m.impressions),
        clicks: int(m.clicks),
        costMicros: BigInt(int(m.costMicros)),
        conversions: num(m.conversions),
        conversionsValue: num(m.conversionsValue),
      };
      if (!row.impressions && !row.clicks && !row.costMicros && !row.conversions) continue;
      campaignDays.push({
        accountId,
        date: day(r.segments.date),
        campaignId: text(r.campaign.id, 20),
        campaignName: text(r.campaign.name) || "Unnamed campaign",
        campaignStatus: text(r.campaign.status, 20) || "UNKNOWN",
        channelType: text(r.campaign.advertisingChannelType, 40) || "UNKNOWN",
        ...row,
        searchImpressionShare: share(m.searchImpressionShare),
        budgetLostShare: share(m.searchBudgetLostImpressionShare),
        rankLostShare: share(m.searchRankLostImpressionShare),
      });
    }

    // Two conversion actions can share a name; merge them so the primary key holds.
    const conversionMap = new Map<string, Prisma.AdsConversionDayCreateManyInput>();
    for (const r of conversionRows) {
      if (!r.campaign?.id || !r.segments?.date) continue;
      const actionName = text(r.segments.conversionActionName) || "Unnamed action";
      const key = `${r.segments.date}|${r.campaign.id}|${actionName}`;
      const existing = conversionMap.get(key);
      if (existing) {
        existing.conversions = (existing.conversions ?? 0) + num(r.metrics?.conversions);
        existing.value = (existing.value ?? 0) + num(r.metrics?.conversionsValue);
        continue;
      }
      conversionMap.set(key, {
        accountId,
        date: day(r.segments.date),
        campaignId: text(r.campaign.id, 20),
        actionName,
        category: text(r.segments.conversionActionCategory, 60) || "DEFAULT",
        conversions: num(r.metrics?.conversions),
        value: num(r.metrics?.conversionsValue),
      });
    }

    const keywords: Prisma.AdsKeywordCreateManyInput[] = keywordRows
      .filter((r) => r.adGroup?.id && r.adGroupCriterion?.criterionId)
      .map((r) => ({
        accountId,
        adGroupId: text(r.adGroup!.id, 20),
        criterionId: text(r.adGroupCriterion!.criterionId, 20),
        campaignName: text(r.campaign?.name),
        adGroupName: text(r.adGroup?.name),
        text: text(r.adGroupCriterion?.keyword?.text) || "(no text)",
        matchType: text(r.adGroupCriterion?.keyword?.matchType, 20) || "UNKNOWN",
        qualityScore: typeof r.adGroupCriterion?.qualityInfo?.qualityScore === "number" ? r.adGroupCriterion.qualityInfo.qualityScore : null,
        impressions: int(r.metrics?.impressions),
        clicks: int(r.metrics?.clicks),
        costMicros: BigInt(int(r.metrics?.costMicros)),
        conversions: num(r.metrics?.conversions),
      }));

    const window = { accountId, date: { gte: day(from), lte: day(to) } };
    await client.$transaction([
      client.adsCampaignDay.deleteMany({ where: window }),
      ...chunks(campaignDays).map((data) => client.adsCampaignDay.createMany({ data })),
      client.adsConversionDay.deleteMany({ where: window }),
      ...chunks([...conversionMap.values()]).map((data) => client.adsConversionDay.createMany({ data })),
      client.adsKeyword.deleteMany({ where: { accountId } }),
      ...chunks(keywords).map((data) => client.adsKeyword.createMany({ data, skipDuplicates: true })),
      client.adsAccount.update({
        where: { id: accountId },
        data: {
          currencyCode: customer?.customer?.currencyCode ?? account.currencyCode,
          timeZone,
          lastSyncedAt: new Date(),
          lastSyncError: null,
        },
      }),
    ]);
    return { ok: true, from, to, campaignDays: campaignDays.length };
  } catch (err) {
    const message = err instanceof GoogleAdsError ? err.message : "Sync failed unexpectedly. Try again shortly.";
    if (!(err instanceof GoogleAdsError)) console.error("[google-ads] sync failed:", err instanceof Error ? err.message : "unknown");
    await client.adsAccount.update({ where: { id: accountId }, data: { lastSyncError: message.slice(0, 500) } }).catch(() => undefined);
    return { ok: false, error: message, needsReconnect: err instanceof GoogleAdsError && err.needsReconnect };
  }
}

/** Syncs every active account, one at a time to stay within API rate limits. */
export async function syncAllAccounts(): Promise<{ synced: number; failed: { name: string; error: string }[] }> {
  const accounts = await db().adsAccount.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } } });
  const failed: { name: string; error: string }[] = [];
  let synced = 0;
  for (const a of accounts) {
    const result = await syncAccount(a.id);
    if (result.ok) synced++;
    else {
      failed.push({ name: a.name, error: result.error });
      // A broken connection fails every account the same way; stop early.
      if (result.needsReconnect) break;
    }
  }
  return { synced, failed };
}
