import { eachDay } from "./range";

/** Aggregations behind the Google Ads dashboard and report. Pure, so they're easy to test. */

export type CampaignDayRow = {
  date: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  channelType: string;
  impressions: number;
  clicks: number;
  /** Money spent, in the account currency. */
  cost: number;
  conversions: number;
  conversionsValue: number;
  searchImpressionShare: number | null;
  budgetLostShare: number | null;
  rankLostShare: number | null;
};

export type Totals = { impressions: number; clicks: number; cost: number; conversions: number; conversionsValue: number };

export type Performance = Totals & {
  /** Click-through rate (clicks ÷ impressions). */
  ctr: number | null;
  /** Average cost per click. */
  cpc: number | null;
  /** Conversions ÷ clicks. */
  conversionRate: number | null;
  /** Cost per conversion (CPA). */
  costPerConversion: number | null;
  /** Conversion value ÷ cost. */
  roas: number | null;
};

export type ImpressionShare = { impressionShare: number | null; budgetLostShare: number | null; rankLostShare: number | null };

export type CampaignPerformance = Performance &
  ImpressionShare & { campaignId: string; name: string; status: string; channelType: string; shareOfSpend: number };

export type DayPoint = { date: string; cost: number; conversions: number; clicks: number; impressions: number };

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

export function emptyTotals(): Totals {
  return { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionsValue: 0 };
}

export function addTotals(into: Totals, row: Totals): Totals {
  into.impressions += row.impressions;
  into.clicks += row.clicks;
  into.cost += row.cost;
  into.conversions += row.conversions;
  into.conversionsValue += row.conversionsValue;
  return into;
}

export function derive(t: Totals): Performance {
  return {
    ...t,
    ctr: ratio(t.clicks, t.impressions),
    cpc: ratio(t.cost, t.clicks),
    conversionRate: ratio(t.conversions, t.clicks),
    costPerConversion: ratio(t.cost, t.conversions),
    roas: t.conversionsValue > 0 ? ratio(t.conversionsValue, t.cost) : null,
  };
}

export function summarize(rows: Totals[]): Performance {
  return derive(rows.reduce(addTotals, emptyTotals()));
}

/**
 * Impression share is a ratio, so days can't simply be averaged: each day is
 * weighted by its eligible impressions (impressions ÷ share).
 */
export function impressionShare(rows: Pick<CampaignDayRow, "impressions" | "searchImpressionShare" | "budgetLostShare" | "rankLostShare">[]): ImpressionShare {
  let won = 0;
  let eligible = 0;
  let budgetLost = 0;
  let rankLost = 0;
  for (const r of rows) {
    if (!r.searchImpressionShare || r.searchImpressionShare <= 0 || r.impressions <= 0) continue;
    const e = r.impressions / r.searchImpressionShare;
    won += r.impressions;
    eligible += e;
    budgetLost += e * (r.budgetLostShare ?? 0);
    rankLost += e * (r.rankLostShare ?? 0);
  }
  if (eligible <= 0) return { impressionShare: null, budgetLostShare: null, rankLostShare: null };
  return { impressionShare: won / eligible, budgetLostShare: budgetLost / eligible, rankLostShare: rankLost / eligible };
}

/** Per-campaign performance, biggest spend first. Name and status come from the latest day. */
export function byCampaign(rows: CampaignDayRow[]): CampaignPerformance[] {
  const groups = new Map<string, CampaignDayRow[]>();
  for (const r of rows) {
    const g = groups.get(r.campaignId);
    if (g) g.push(r);
    else groups.set(r.campaignId, [r]);
  }
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  return [...groups.entries()]
    .map(([campaignId, g]) => {
      const latest = g.reduce((a, b) => (b.date > a.date ? b : a));
      const perf = summarize(g);
      return {
        ...perf,
        ...impressionShare(g),
        campaignId,
        name: latest.campaignName,
        status: latest.campaignStatus,
        channelType: latest.channelType,
        shareOfSpend: totalCost > 0 ? perf.cost / totalCost : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost || b.clicks - a.clicks);
}

/** One point per calendar day in the range, with zeros for days without data. */
export function dailySeries(rows: CampaignDayRow[], from: string, to: string): DayPoint[] {
  const byDate = new Map<string, DayPoint>();
  for (const d of eachDay(from, to)) byDate.set(d, { date: d, cost: 0, conversions: 0, clicks: 0, impressions: 0 });
  for (const r of rows) {
    const p = byDate.get(r.date);
    if (!p) continue;
    p.cost += r.cost;
    p.conversions += r.conversions;
    p.clicks += r.clicks;
    p.impressions += r.impressions;
  }
  return [...byDate.values()];
}

/** Sums consecutive 7-day blocks (dated by their first day), for charts over long periods. */
export function weeklySeries(points: DayPoint[]): DayPoint[] {
  const out: DayPoint[] = [];
  points.forEach((p, i) => {
    if (i % 7 === 0) out.push({ ...p });
    else {
      const w = out[out.length - 1];
      w.cost += p.cost;
      w.conversions += p.conversions;
      w.clicks += p.clicks;
      w.impressions += p.impressions;
    }
  });
  return out;
}

export type WeekdayAverage = { weekday: number; label: string; name: string; days: number; conversions: number; cost: number; clicks: number };

/** Average per weekday (Monday first) — which days of the week bring results. */
export function weekdayProfile(points: DayPoint[]): WeekdayAverage[] {
  const names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const acc = names.map((name, weekday) => ({ weekday, label: name.slice(0, 3), name, days: 0, conversions: 0, cost: 0, clicks: 0 }));
  for (const p of points) {
    const a = acc[(new Date(`${p.date}T00:00:00Z`).getUTCDay() + 6) % 7];
    a.days += 1;
    a.conversions += p.conversions;
    a.cost += p.cost;
    a.clicks += p.clicks;
  }
  return acc.map((a) => (a.days ? { ...a, conversions: a.conversions / a.days, cost: a.cost / a.days, clicks: a.clicks / a.days } : a));
}

export type CampaignSplit = { name: string; cost: number; conversions: number; shareOfSpend: number; shareOfConversions: number; other?: boolean };

/** Each campaign's share of spend next to its share of conversions; the tail folds into "Other". */
export function campaignSplit(campaigns: CampaignPerformance[], max = 5): CampaignSplit[] {
  const cost = campaigns.reduce((s, c) => s + c.cost, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const row = (name: string, c: number, v: number, other?: boolean): CampaignSplit => ({
    name,
    cost: c,
    conversions: v,
    shareOfSpend: cost > 0 ? c / cost : 0,
    shareOfConversions: conversions > 0 ? v / conversions : 0,
    ...(other && { other }),
  });
  const active = campaigns.filter((c) => c.cost > 0 || c.conversions > 0);
  const head = active.length > max ? active.slice(0, max - 1) : active;
  const tail = active.slice(head.length);
  const rows = head.map((c) => row(c.name, c.cost, c.conversions));
  if (tail.length) {
    rows.push(row(`${tail.length} other campaign${tail.length === 1 ? "" : "s"}`, tail.reduce((s, c) => s + c.cost, 0), tail.reduce((s, c) => s + c.conversions, 0), true));
  }
  return rows;
}

/** Relative change from `previous` to `current`, or null when there's nothing to compare with. */
export function change(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

/** Linear projection of month-end spend from spend so far. */
export function projectMonthSpend(spentSoFar: number, dayOfMonth: number, daysInMonth: number): number {
  return dayOfMonth > 0 ? (spentSoFar / dayOfMonth) * daysInMonth : 0;
}

/* --------------------------------- Formatting --------------------------------- */

export function formatMoney(amount: number | null, currency: string, opts: { compact?: boolean } = {}): string {
  if (amount === null || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      notation: opts.compact && Math.abs(amount) >= 10_000 ? "compact" : "standard",
      maximumFractionDigits: opts.compact || Math.abs(amount) >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en-KE")}`;
  }
}

export function formatNumber(n: number | null, opts: { compact?: boolean; decimals?: number } = {}): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-KE", {
    notation: opts.compact && Math.abs(n) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: opts.decimals ?? (Number.isInteger(n) ? 0 : 1),
  }).format(n);
}

export function formatPercent(n: number | null, decimals = 1): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}

const CHANNEL_LABELS: Record<string, string> = {
  SEARCH: "Search",
  DISPLAY: "Display",
  SHOPPING: "Shopping",
  VIDEO: "Video",
  PERFORMANCE_MAX: "Performance Max",
  DEMAND_GEN: "Demand Gen",
  MULTI_CHANNEL: "App",
  LOCAL: "Local",
  SMART: "Smart",
  HOTEL: "Hotel",
  LOCAL_SERVICES: "Local Services",
  TRAVEL: "Travel",
};

export function channelLabel(type: string): string {
  return CHANNEL_LABELS[type] ?? type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");
}

export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}
