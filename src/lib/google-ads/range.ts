/**
 * Reporting periods for Google Ads dashboards. Pure and string-based
 * (YYYY-MM-DD, the account's own calendar days, as Google Ads reports them),
 * so there are no time-zone surprises.
 */

export type RangeKey = "7d" | "30d" | "90d" | "mtd" | "last_month" | "custom";

export type DateRange = {
  key: RangeKey;
  from: string;
  to: string;
  /** The equally long period immediately before, for comparisons. */
  prevFrom: string;
  prevTo: string;
  label: string;
  days: number;
};

export const RANGE_PRESETS: { key: Exclude<RangeKey, "custom">; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "mtd", label: "This month" },
  { key: "last_month", label: "Last month" },
];

/** How far back synced data goes; custom ranges are clamped to it. */
export const MAX_HISTORY_DAYS = 400;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Inclusive number of days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000) + 1;
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && ISO_DATE.test(v) && toIso(toDate(v)) === v;
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Today's calendar date in a time zone (Nairobi by default, like the rest of the admin). */
export function todayIn(timeZone = "Africa/Nairobi", now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-KE", { timeZone: "UTC", ...opts }).format(toDate(iso));

export function formatRange(from: string, to: string): string {
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = fmt(from, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return `${start} – ${fmt(to, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return fmt(iso, opts);
}

function withPrevious(key: RangeKey, from: string, to: string, label: string): DateRange {
  const days = daysBetween(from, to);
  return { key, from, to, prevTo: addDays(from, -1), prevFrom: addDays(from, -days), label, days };
}

/**
 * Resolves a range from URL parameters. Presets end yesterday (today's data is
 * still coming in), except "This month", which includes today.
 */
export function resolveRange(params: { range?: string; from?: string; to?: string }, today: string): DateRange {
  const yesterday = addDays(today, -1);
  const earliest = addDays(today, -MAX_HISTORY_DAYS);

  if (params.range === "custom" && isIsoDate(params.from) && isIsoDate(params.to)) {
    let from = params.from < earliest ? earliest : params.from;
    let to = params.to > today ? today : params.to;
    if (from > to) [from, to] = [to, from];
    return withPrevious("custom", from, to, formatRange(from, to));
  }

  switch (params.range) {
    case "7d":
      return withPrevious("7d", addDays(yesterday, -6), yesterday, "Last 7 days");
    case "90d":
      return withPrevious("90d", addDays(yesterday, -89), yesterday, "Last 90 days");
    case "mtd": {
      const from = `${today.slice(0, 8)}01`;
      return withPrevious("mtd", from, today, "This month");
    }
    case "last_month": {
      const to = addDays(`${today.slice(0, 8)}01`, -1);
      const from = `${to.slice(0, 8)}01`;
      // Compare with the whole month before, not an equal number of days.
      const prevTo = addDays(from, -1);
      return { key: "last_month", from, to, prevFrom: `${prevTo.slice(0, 8)}01`, prevTo, label: fmt(from, { month: "long", year: "numeric" }), days: daysBetween(from, to) };
    }
    default:
      return withPrevious("30d", addDays(yesterday, -29), yesterday, "Last 30 days");
  }
}

/** Query string for a range, for links that keep the current period. */
export function rangeQuery(range: Pick<DateRange, "key" | "from" | "to">): string {
  return range.key === "custom" ? `range=custom&from=${range.from}&to=${range.to}` : `range=${range.key}`;
}
