import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleCheck, Eye, Lightbulb, Minus, TrendingUp, Wrench } from "lucide-react";
import type { AdsReport } from "@/lib/google-ads/report";
import {
  campaignSplit,
  change,
  channelLabel,
  formatMoney,
  formatNumber,
  formatPercent,
  statusLabel,
  weekdayProfile,
  weeklySeries,
  type DayPoint,
} from "@/lib/google-ads/metrics";
import type { Recommendation } from "@/lib/google-ads/recommendations";
import { formatDay } from "@/lib/google-ads/range";
import { cn } from "@/lib/utils";
import { PerformanceChart } from "./trend-chart";

/** Building blocks shared by the Google Ads dashboard and its printable report. */

type Props = { report: AdsReport; currency: string };

/** Card with a title row. `flush` drops the body padding (for tables). */
export function Panel({
  title,
  description,
  aside,
  children,
  flush,
  className,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("print-avoid-break min-w-0 rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm print:shadow-none", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5 pt-5 sm:px-6">
        <div>
          <h2 className="text-base font-bold text-heading">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
        </div>
        {aside}
      </header>
      <div className={flush ? "mt-4 overflow-x-auto border-t border-line" : "px-5 pt-4 pb-5 sm:px-6"}>{children}</div>
    </section>
  );
}

/* ----------------------------------- KPIs ----------------------------------- */

function Delta({ current, previous, upIsGood }: { current: number | null; previous: number | null; upIsGood: boolean | null }) {
  const d = change(current, previous);
  if (d === null) return <span className="text-xs text-ink-soft">No earlier data</span>;
  const flat = Math.abs(d) < 0.005;
  const good = upIsGood === null || flat ? null : d > 0 === upIsGood;
  const Icon = flat ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold whitespace-nowrap",
          good === null ? "bg-surface-2 text-ink-soft" : good ? "bg-success-wash text-success" : "bg-danger-wash text-danger",
        )}
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {flat ? "No change" : `${d > 0 ? "+" : ""}${formatPercent(d, Math.abs(d) < 0.1 ? 1 : 0)}`}
      </span>
      <span className="whitespace-nowrap text-ink-soft">vs previous period</span>
    </span>
  );
}

/** Tiny trend line for a KPI tile. Gaps where the value is undefined (e.g. no clicks that day). */
function Sparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const W = 120;
  const H = 36;
  const defined = values.filter((v): v is number => v !== null);
  if (values.length < 2 || !defined.length) return null;
  const max = Math.max(...defined);
  const min = Math.min(...defined);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 2 - ((v - min) / span) * (H - 4);
  let d = "";
  values.forEach((v, i) => {
    if (v === null) return;
    d += `${i && values[i - 1] !== null ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 w-full overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Daily points, or weekly totals for long periods so trend lines stay readable. */
function chartSeries(points: DayPoint[]) {
  return points.length > 92 ? weeklySeries(points) : points;
}

export function KpiGrid({ report, currency }: Props) {
  const { current: c, previous: p } = report;
  const s = chartSeries(report.series);
  const hero = [
    { label: "Money spent", value: formatMoney(c.cost, currency), cur: c.cost, prev: p.cost, upIsGood: null, spark: s.map((d) => d.cost), color: "var(--chart-spend)" },
    { label: "Conversions", value: formatNumber(c.conversions), cur: c.conversions, prev: p.conversions, upIsGood: true, spark: s.map((d) => d.conversions), color: "var(--chart-conversions)" },
    {
      label: "Cost per conversion",
      value: formatMoney(c.costPerConversion, currency),
      cur: c.costPerConversion,
      prev: p.costPerConversion,
      upIsGood: false,
      spark: s.map((d) => (d.conversions > 0 ? d.cost / d.conversions : null)),
      color: "var(--chart-conversions)",
    },
    { label: "Clicks", value: formatNumber(c.clicks), cur: c.clicks, prev: p.clicks, upIsGood: true, spark: s.map((d) => d.clicks), color: "var(--chart-clicks)" },
  ] satisfies { label: string; value: string; cur: number | null; prev: number | null; upIsGood: boolean | null; spark: (number | null)[]; color: string }[];

  const rest: { label: string; value: string; cur: number | null; prev: number | null; upIsGood: boolean | null; hint: string }[] = [
    { label: "Conversion rate", value: formatPercent(c.conversionRate), cur: c.conversionRate, prev: p.conversionRate, upIsGood: true, hint: "Clicks that became conversions" },
    { label: "Impressions", value: formatNumber(c.impressions, { compact: true }), cur: c.impressions, prev: p.impressions, upIsGood: true, hint: "Times the ads were shown" },
    { label: "Click-through rate", value: formatPercent(c.ctr, 2), cur: c.ctr, prev: p.ctr, upIsGood: true, hint: "Views that led to a click" },
    { label: "Average cost per click", value: formatMoney(c.cpc, currency), cur: c.cpc, prev: p.cpc, upIsGood: false, hint: "What each visit cost" },
  ];
  if (c.conversionsValue > 0) {
    rest.push({ label: "Conversion value", value: formatMoney(c.conversionsValue, currency), cur: c.conversionsValue, prev: p.conversionsValue, upIsGood: true, hint: "Value of the conversions" });
    rest.push({ label: "Return on ad spend", value: c.roas === null ? "—" : `${c.roas.toFixed(2)}×`, cur: c.roas, prev: p.roas, upIsGood: true, hint: "Value earned per 1 spent" });
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        {hero.map((t) => (
          <div key={t.label} className="print-avoid-break @container flex min-w-0 flex-col rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm print:p-4 print:shadow-none">
            <dt className="flex items-center gap-2 text-sm font-medium text-ink-soft">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: t.color }} />
              {t.label}
            </dt>
            <dd className="mt-2 text-xl leading-none font-black tracking-tight whitespace-nowrap text-heading tabular-nums @[13rem]:text-2xl @[15rem]:text-[1.75rem]">{t.value}</dd>
            <dd className="mt-2.5">
              <Delta current={t.cur} previous={t.prev} upIsGood={t.upIsGood} />
            </dd>
            <dd className="mt-auto pt-3">
              <Sparkline values={t.spark} color={t.color} />
            </dd>
          </div>
        ))}
      </dl>
      <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line shadow-sm print:shadow-none", rest.length > 4 ? "md:grid-cols-3 xl:grid-cols-6 print:grid-cols-6" : "md:grid-cols-4 print:grid-cols-4")}>
        {rest.map((t) => (
          <div key={t.label} className="print-avoid-break min-w-0 bg-surface px-4 py-3.5">
            <dt className="text-[0.8125rem] font-medium text-ink-soft" title={t.hint}>
              {t.label}
            </dt>
            <dd className="mt-1 text-lg font-black text-heading tabular-nums">{t.value}</dd>
            <dd className="mt-0.5">
              <Delta current={t.cur} previous={t.prev} upIsGood={t.upIsGood} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* --------------------------------- Funnel --------------------------------- */

/** Impressions → clicks → conversions, with the rate at each step in plain words. */
export function Funnel({ report }: Props) {
  const { impressions, clicks, conversions, ctr, conversionRate } = report.current;
  const steps = [
    { label: "Saw an ad", value: impressions, compact: true },
    { label: "Clicked through", value: clicks, rate: ctr, rateLabel: "clicked" },
    { label: "Became a lead or sale", value: conversions, rate: conversionRate, rateLabel: "converted" },
  ];
  return (
    <Panel title="From ad to customer" description="How people moved from seeing an ad to taking action.">
      <ol className="relative">
        {steps.map((s, i) => (
          <li key={s.label}>
            {s.rate !== undefined && (
              <div className="flex items-center gap-3 py-1.5 pl-[0.9375rem]">
                <span aria-hidden="true" className="h-7 w-px bg-line-strong" />
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink">
                  {formatPercent(s.rate, s.rate !== null && s.rate < 0.1 ? 1 : 0)} {s.rateLabel}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  i === steps.length - 1 ? "bg-teal-wash text-teal-ink" : "bg-surface-2 text-ink-soft",
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-ink">{s.label}</span>
              <span className="text-xl font-black text-heading tabular-nums">{formatNumber(s.value, { compact: s.compact })}</span>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* --------------------------------- Pacing --------------------------------- */

export function BudgetPacing({ report, currency }: Props) {
  const { budget, monthSpend, projectedMonthSpend, dayOfMonth, daysInMonth } = report.pacing;
  if (!budget) return null;
  const used = monthSpend / budget;
  const projected = projectedMonthSpend / budget;
  const timeElapsed = dayOfMonth / daysInMonth;
  const tone = projected >= 1.1 ? "danger" : projected <= 0.8 ? "warning" : "success";
  const verdict = tone === "danger" ? "Spending ahead of budget" : tone === "warning" ? "Spending below budget" : "On track";
  return (
    <Panel
      title="This month's budget"
      description={`Day ${dayOfMonth} of ${daysInMonth}`}
      aside={
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", tone === "danger" ? "bg-danger-wash text-danger" : tone === "warning" ? "bg-warning-wash text-warning" : "bg-success-wash text-success")}>
          {verdict}
        </span>
      }
    >
      <p className="flex items-baseline gap-1.5">
        <strong className="text-2xl font-black text-heading tabular-nums">{formatMoney(monthSpend, currency)}</strong>
        <span className="text-sm text-ink-soft">of {formatMoney(budget, currency)}</span>
      </p>
      <div
        className="relative mt-3 h-2.5 rounded-full bg-surface-2"
        role="img"
        aria-label={`${formatPercent(used, 0)} of the monthly budget spent, ${formatPercent(timeElapsed, 0)} of the month gone`}
      >
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, used * 100)}%`, background: "var(--chart-spend)" }} />
        <div aria-hidden="true" className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-heading" style={{ left: `${Math.min(100, timeElapsed * 100)}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-soft">Spent so far</dt>
          <dd className="font-bold text-heading">{formatPercent(used, 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Projected month-end</dt>
          <dd className={cn("font-bold", tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success")}>
            {formatMoney(projectedMonthSpend, currency)} ({formatPercent(projected, 0)})
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink-soft">The dark marker shows how much of the month has passed — spend close to it is on pace.</p>
    </Panel>
  );
}

/* --------------------------------- Charts --------------------------------- */

export function TrendSection({ report, currency, print = false }: Props & { print?: boolean }) {
  const weekly = report.series.length > 92;
  const current = chartSeries(report.series);
  const previous = chartSeries(report.previousSeries);
  if (print) {
    // On paper there are no tabs, so the two metrics that matter most get a chart each.
    return (
      <div className="grid grid-cols-2 gap-4">
        <Panel title={`Conversions per ${weekly ? "week" : "day"}`} description={`Total ${formatNumber(report.current.conversions)}`}>
          <PerformanceChart current={current} previous={previous} currency={currency} metrics={["conversions"]} weekly={weekly} height={190} />
        </Panel>
        <Panel title={`Money spent per ${weekly ? "week" : "day"}`} description={`Total ${formatMoney(report.current.cost, currency)}`}>
          <PerformanceChart current={current} previous={previous} currency={currency} metrics={["cost"]} weekly={weekly} height={190} />
        </Panel>
      </div>
    );
  }
  return (
    <Panel title="Performance over time" description={`Each ${weekly ? "week" : "day"} in this period, against the same point in the previous period.`} className="h-full">
      <PerformanceChart current={current} previous={previous} currency={currency} weekly={weekly} height={report.pacing.budget ? 330 : 260} />
      <details className="mt-4 rounded-[var(--radius-md)] border border-line print:hidden">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-bold text-heading">Show daily numbers as a table</summary>
        <div className="max-h-80 overflow-auto border-t border-line">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="sticky top-0 bg-surface-2 text-xs text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-2 font-bold">Date</th>
                <th scope="col" className="px-4 py-2 text-right font-bold">Spent</th>
                <th scope="col" className="px-4 py-2 text-right font-bold">Clicks</th>
                <th scope="col" className="px-4 py-2 text-right font-bold">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.series.map((p) => (
                <tr key={p.date}>
                  <td className="px-4 py-1.5">{formatDay(p.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-1.5 text-right">{formatMoney(p.cost, currency)}</td>
                  <td className="px-4 py-1.5 text-right">{formatNumber(p.clicks)}</td>
                  <td className="px-4 py-1.5 text-right">{formatNumber(p.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Panel>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Share of spend beside share of conversions, per campaign — shows where the money works hardest. */
export function CampaignSplitChart({ report, currency }: Props) {
  const rows = campaignSplit(report.campaigns);
  if (!rows.length) return null;
  const hasConversions = report.current.conversions > 0;
  return (
    <Panel
      title="Where the budget went"
      description={hasConversions ? "A campaign whose conversion bar is longer than its spend bar is giving more than its share of results." : "Share of spend by campaign."}
      aside={
        <Legend
          items={[
            { label: "Share of spend", color: "var(--chart-spend)" },
            ...(hasConversions ? [{ label: "Share of conversions", color: "var(--chart-conversions)" }] : []),
          ]}
        />
      }
    >
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.name} className="print-avoid-break">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={cn("min-w-0 truncate font-bold", r.other ? "text-ink-soft" : "text-heading")} title={r.name}>
                {r.name}
              </span>
              <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                {formatMoney(r.cost, currency)}
                {hasConversions && ` · ${formatNumber(r.conversions)} conv.`}
              </span>
            </div>
            <div className="mt-1.5 space-y-[3px]">
              <Bar share={r.shareOfSpend} color="var(--chart-spend)" label={`${formatPercent(r.shareOfSpend, 0)} of spend`} />
              {hasConversions && <Bar share={r.shareOfConversions} color="var(--chart-conversions)" label={`${formatPercent(r.shareOfConversions, 0)} of conversions`} />}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Bar({ share, color, label }: { share: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2" title={label}>
      <div className="h-2 flex-1 rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${share > 0 ? Math.max(1.5, share * 100) : 0}%`, background: color }} />
      </div>
      <span className="w-9 text-right text-xs font-bold text-ink tabular-nums">
        {formatPercent(share, 0)}
        <span className="sr-only"> {label}</span>
      </span>
    </div>
  );
}

const categoryLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " ");

export function ConversionsBreakdown({ report, currency }: Props) {
  const actions = report.conversionActions;
  const total = actions.reduce((s, a) => s + a.conversions, 0);
  const shown = actions.slice(0, 6);
  return (
    <Panel title="What customers did" description="Conversions by action, after clicking an ad.">
      {shown.length === 0 ? (
        <p className="text-sm text-ink-soft">No conversions recorded in this period.</p>
      ) : (
        <ul className="space-y-3.5">
          {shown.map((a) => {
            const share = total ? a.conversions / total : 0;
            return (
              <li key={`${a.name}-${a.category}`} className="print-avoid-break">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-bold text-heading">{a.name}</span>
                    <span className="ml-2 text-xs text-ink-soft">{categoryLabel(a.category)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <strong className="text-heading">{formatNumber(a.conversions)}</strong>
                    <span className="text-xs text-ink-soft">
                      {" "}
                      · {formatPercent(share, 0)}
                      {a.value > 0 && ` · ${formatMoney(a.value, currency)}`}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, share * 100)}%`, background: "var(--chart-conversions)" }} />
                </div>
              </li>
            );
          })}
          {actions.length > shown.length && <li className="text-xs text-ink-soft">+ {actions.length - shown.length} smaller actions</li>}
        </ul>
      )}
    </Panel>
  );
}

/** Average results per weekday; the best day is highlighted. Needs two full weeks to mean anything. */
export function WeekdayChart({ report, currency }: Props) {
  if (report.series.length < 14 || report.current.cost <= 0) return null;
  const days = weekdayProfile(report.series);
  const byConversions = report.current.conversions > 0;
  const metric = (d: (typeof days)[number]) => (byConversions ? d.conversions : d.clicks);
  const max = Math.max(...days.map(metric));
  if (max <= 0) return null;
  const best = days.reduce((a, b) => (metric(b) > metric(a) ? b : a));
  const fmt = (v: number) => formatNumber(v, { decimals: v < 10 ? 1 : 0 });
  return (
    <Panel
      title="Best days of the week"
      description={`Average ${byConversions ? "conversions" : "clicks"} on each weekday. ${best.name}s bring the most.`}
    >
      <div className="flex h-40 items-end gap-2" role="img" aria-label={days.map((d) => `${d.label} ${fmt(metric(d))}`).join(", ")}>
        {days.map((d) => {
          const v = metric(d);
          const isBest = d === best;
          return (
            <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label}: ${fmt(v)} ${byConversions ? "conversions" : "clicks"} · ${formatMoney(d.cost, currency)} spent on average`}>
              <span className={cn("text-xs font-bold tabular-nums", isBest ? "text-heading" : "text-transparent group-hover:text-ink-soft")}>{fmt(v)}</span>
              <div
                className="w-full max-w-10 rounded-t-[4px]"
                style={{ height: `${Math.max(2, (v / max) * 100)}%`, background: "var(--chart-conversions)", opacity: isBest ? 1 : 0.4 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-line-strong pt-2" aria-hidden="true">
        {days.map((d) => (
          <span key={d.label} className={cn("flex-1 text-center text-xs", d === best ? "font-bold text-heading" : "text-ink-soft")}>
            {d.label}
          </span>
        ))}
      </div>
    </Panel>
  );
}

/* --------------------------------- Tables --------------------------------- */

const th = "px-4 py-2.5 font-bold whitespace-nowrap";
const td = "px-4 py-2.5 whitespace-nowrap";

export function CampaignTable({ report, currency }: Props) {
  if (!report.campaigns.length) return null;
  return (
    <Panel title="Campaigns" description="Sorted by money spent. Impression share is for Search campaigns." flush>
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="bg-surface-2 text-xs text-ink-soft">
          <tr>
            <th scope="col" className={cn(th, "pl-5 sm:pl-6")}>Campaign</th>
            <th scope="col" className={cn(th, "text-right")}>Spent</th>
            <th scope="col" className={cn(th, "text-right")}>Conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Cost / conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Conv. rate</th>
            <th scope="col" className={cn(th, "text-right")}>Clicks</th>
            <th scope="col" className={cn(th, "text-right")}>CTR</th>
            <th scope="col" className={cn(th, "pr-5 text-right sm:pr-6")}>Impr. share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {report.campaigns.map((c) => (
            <tr key={c.campaignId} className="print-avoid-break align-top">
              <td className="min-w-[14rem] py-2.5 pr-4 pl-5 sm:pl-6">
                <span className="block font-bold text-heading">{c.name}</span>
                <span className="text-xs text-ink-soft">
                  {channelLabel(c.channelType)} · {statusLabel(c.status)}
                </span>
              </td>
              <td className={cn(td, "text-right font-bold text-heading")}>{formatMoney(c.cost, currency)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(c.conversions)}</td>
              <td className={cn(td, "text-right")}>{formatMoney(c.costPerConversion, currency)}</td>
              <td className={cn(td, "text-right")}>{formatPercent(c.conversionRate)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(c.clicks)}</td>
              <td className={cn(td, "text-right")}>{formatPercent(c.ctr, 2)}</td>
              <td className={cn(td, "pr-5 text-right sm:pr-6")}>
                {c.impressionShare === null ? "—" : formatPercent(c.impressionShare, 0)}
                {(c.budgetLostShare ?? 0) >= 0.1 && <span className="block text-xs text-warning">{formatPercent(c.budgetLostShare, 0)} lost to budget</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

const matchLabel = (m: string) => ({ EXACT: "Exact", PHRASE: "Phrase", BROAD: "Broad" })[m] ?? m;

export function KeywordsTable({ report, currency }: Props) {
  if (!report.topKeywords.length) return null;
  return (
    <Panel title="Top keywords" description="Last 30 days, by conversions." flush>
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="bg-surface-2 text-xs text-ink-soft">
          <tr>
            <th scope="col" className={cn(th, "pl-5 sm:pl-6")}>Keyword</th>
            <th scope="col" className={cn(th, "text-right")}>Conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Clicks</th>
            <th scope="col" className={cn(th, "text-right")}>Spent</th>
            <th scope="col" className={cn(th, "pr-5 text-right sm:pr-6")}>Quality</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {report.topKeywords.map((k) => (
            <tr key={`${k.campaignName}-${k.adGroupName}-${k.text}-${k.matchType}`} className="print-avoid-break">
              <td className="py-2.5 pr-4 pl-5 sm:pl-6">
                <span className="block font-bold text-heading">{k.text}</span>
                <span className="text-xs text-ink-soft">
                  {matchLabel(k.matchType)} · {k.campaignName}
                </span>
              </td>
              <td className={cn(td, "text-right font-bold text-heading")}>{formatNumber(k.conversions)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(k.clicks)}</td>
              <td className={cn(td, "text-right")}>{formatMoney(k.cost, currency)}</td>
              <td className={cn(td, "pr-5 text-right sm:pr-6")}>{k.qualityScore === null ? "—" : <QualityScore score={k.qualityScore} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/** Quality score as ten pips plus the number, so it reads without colour. */
function QualityScore({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="flex gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("h-2.5 w-[3px] rounded-full", i < score ? (score >= 7 ? "bg-success" : score >= 5 ? "bg-warning" : "bg-danger") : "bg-surface-2")} />
        ))}
      </span>
      {score}/10
    </span>
  );
}

/* ----------------------------- Recommendations ----------------------------- */

const kindMeta: Record<Recommendation["kind"], { label: string; icon: typeof Wrench }> = {
  fix: { label: "Fix", icon: Wrench },
  opportunity: { label: "Opportunity", icon: TrendingUp },
  watch: { label: "Watch", icon: Eye },
};

const priorityMeta: Record<Recommendation["priority"], { label: string; className: string }> = {
  high: { label: "High priority", className: "bg-danger-wash text-danger" },
  medium: { label: "Medium priority", className: "bg-warning-wash text-warning" },
  low: { label: "Worth doing", className: "bg-teal-wash text-teal-ink" },
};

export function Recommendations({ items }: { items: Recommendation[] }) {
  return (
    <section aria-labelledby="recs-title" className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm print:shadow-none">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-teal-wash text-teal-ink print:hidden">
          <Lightbulb aria-hidden="true" className="size-4.5" />
        </span>
        <div>
          <h2 id="recs-title" className="text-base font-bold text-heading">Recommendations to get more conversions</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Worked out from this account&apos;s numbers — most important first.</p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-ink sm:px-6">
          <CircleCheck aria-hidden="true" className="size-4 text-success" />
          Nothing urgent — the account is performing in line with its targets. Keep testing new ads and keywords.
        </p>
      ) : (
        <ol className="divide-y divide-line">
          {items.map((r, i) => {
            const Kind = kindMeta[r.kind].icon;
            return (
              <li key={r.id} className="print-avoid-break px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-ink-soft">{i + 1}.</span>
                  <h3 className="text-[0.9375rem] font-bold text-heading">{r.title}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", priorityMeta[r.priority].className)}>{priorityMeta[r.priority].label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-soft">
                    <Kind aria-hidden="true" className="size-3" /> {kindMeta[r.kind].label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink">{r.detail}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink marker:text-teal">
                  {r.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
