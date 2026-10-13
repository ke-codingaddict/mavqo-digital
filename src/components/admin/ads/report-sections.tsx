import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleCheck, Eye, Lightbulb, Minus, TrendingUp, Wrench } from "lucide-react";
import type { AdsReport } from "@/lib/google-ads/report";
import { change, channelLabel, formatMoney, formatNumber, formatPercent, statusLabel } from "@/lib/google-ads/metrics";
import type { Recommendation } from "@/lib/google-ads/recommendations";
import { formatDay } from "@/lib/google-ads/range";
import { cn } from "@/lib/utils";
import { TrendChart } from "./trend-chart";

/** Building blocks shared by the Google Ads dashboard and its printable report. */

type Props = { report: AdsReport; currency: string };

/* ----------------------------------- KPIs ----------------------------------- */

function Delta({ current, previous, upIsGood }: { current: number | null; previous: number | null; upIsGood: boolean | null }) {
  const d = change(current, previous);
  if (d === null) return <span className="text-xs text-ink-soft">No earlier data</span>;
  const flat = Math.abs(d) < 0.005;
  const good = upIsGood === null || flat ? null : d > 0 === upIsGood;
  const Icon = flat ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", good === null ? "text-ink-soft" : good ? "text-success" : "text-danger")}>
      <Icon aria-hidden="true" className="size-3.5" />
      {flat ? "No change" : `${d > 0 ? "+" : ""}${formatPercent(d, Math.abs(d) < 0.1 ? 1 : 0)}`}
      <span className="font-normal text-ink-soft">&nbsp;vs previous</span>
    </span>
  );
}

export function KpiGrid({ report, currency }: Props) {
  const { current: c, previous: p } = report;
  const tiles: { label: string; value: string; cur: number | null; prev: number | null; upIsGood: boolean | null; hero?: boolean }[] = [
    { label: "Money spent", value: formatMoney(c.cost, currency), cur: c.cost, prev: p.cost, upIsGood: null, hero: true },
    { label: "Conversions", value: formatNumber(c.conversions), cur: c.conversions, prev: p.conversions, upIsGood: true, hero: true },
    { label: "Cost per conversion", value: formatMoney(c.costPerConversion, currency), cur: c.costPerConversion, prev: p.costPerConversion, upIsGood: false, hero: true },
    { label: "Conversion rate", value: formatPercent(c.conversionRate), cur: c.conversionRate, prev: p.conversionRate, upIsGood: true },
    { label: "Clicks", value: formatNumber(c.clicks), cur: c.clicks, prev: p.clicks, upIsGood: true },
    { label: "Impressions", value: formatNumber(c.impressions, { compact: true }), cur: c.impressions, prev: p.impressions, upIsGood: true },
    { label: "Click-through rate", value: formatPercent(c.ctr, 2), cur: c.ctr, prev: p.ctr, upIsGood: true },
    { label: "Average cost per click", value: formatMoney(c.cpc, currency), cur: c.cpc, prev: p.cpc, upIsGood: false },
  ];
  if (c.conversionsValue > 0) {
    tiles.push({ label: "Conversion value", value: formatMoney(c.conversionsValue, currency), cur: c.conversionsValue, prev: p.conversionsValue, upIsGood: true });
    tiles.push({ label: "Return on ad spend", value: c.roas === null ? "—" : `${c.roas.toFixed(2)}×`, cur: c.roas, prev: p.roas, upIsGood: true });
  }
  const hero = tiles.filter((t) => t.hero);
  const rest = tiles.filter((t) => !t.hero);
  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-3">
        {hero.map((t) => (
          <div key={t.label} className="print-avoid-break rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm">
            <dt className="text-sm text-ink-soft">{t.label}</dt>
            <dd className="mt-1 text-3xl font-black tracking-tight text-heading">{t.value}</dd>
            <dd className="mt-1">
              <Delta current={t.cur} previous={t.prev} upIsGood={t.upIsGood} />
            </dd>
          </div>
        ))}
      </dl>
      <dl className={cn("grid grid-cols-2 gap-4", rest.length > 5 ? "lg:grid-cols-6 print:grid-cols-6" : "lg:grid-cols-5 print:grid-cols-5")}>
        {rest.map((t) => (
          <div key={t.label} className="print-avoid-break rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3">
            <dt className="text-[0.8125rem] text-ink-soft">{t.label}</dt>
            <dd className="mt-0.5 text-lg font-black text-heading">{t.value}</dd>
            <dd>
              <Delta current={t.cur} previous={t.prev} upIsGood={t.upIsGood} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
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
  return (
    <section aria-labelledby="pacing-title" className="print-avoid-break rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pacing-title" className="text-base font-bold text-heading">This month&apos;s budget</h2>
        <p className="text-sm text-ink-soft">
          Day {dayOfMonth} of {daysInMonth}
        </p>
      </div>
      <p className="mt-2 text-sm text-ink">
        <strong className="text-heading">{formatMoney(monthSpend, currency)}</strong> spent of {formatMoney(budget, currency)} ({formatPercent(used, 0)}) · projected month-end{" "}
        <strong className={cn(tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success")}>{formatMoney(projectedMonthSpend, currency)}</strong> (
        {formatPercent(projected, 0)} of budget)
      </p>
      <div className="relative mt-3 h-2.5 rounded-full bg-surface-2" role="img" aria-label={`${formatPercent(used, 0)} of the monthly budget spent, ${formatPercent(timeElapsed, 0)} of the month gone`}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, used * 100)}%`, background: "var(--chart-spend)" }} />
        <div aria-hidden="true" className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-heading" style={{ left: `${Math.min(100, timeElapsed * 100)}%` }} title="Today" />
      </div>
      <p className="mt-2 text-xs text-ink-soft">The marker shows how much of the month has passed — spend close to it is on pace.</p>
    </section>
  );
}

/* --------------------------------- Charts --------------------------------- */

export function TrendCharts({ report, currency, showTable = true }: Props & { showTable?: boolean }) {
  const { series } = report;
  const charts = [
    { key: "spend" as const, title: "Money spent per day", total: formatMoney(report.current.cost, currency), points: series.map((p) => ({ date: p.date, value: p.cost })), format: "money" as const },
    { key: "conversions" as const, title: "Conversions per day", total: formatNumber(report.current.conversions), points: series.map((p) => ({ date: p.date, value: p.conversions })), format: "number" as const },
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        {charts.map((c) => (
          <section key={c.key} aria-label={c.title} className="print-avoid-break min-w-0 rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold text-heading">{c.title}</h2>
              <p className="text-sm text-ink-soft">
                Total <strong className="text-heading">{c.total}</strong>
              </p>
            </div>
            <TrendChart points={c.points} title={c.title} series={c.key} formatValue={c.format} unit={c.format === "money" ? currency : undefined} />
          </section>
        ))}
      </div>
      {showTable && (
        <details className="rounded-[var(--radius-md)] border border-line bg-surface print:hidden">
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
                {series.map((p) => (
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
      )}
    </div>
  );
}

/* --------------------------------- Tables --------------------------------- */

function TableCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-base font-bold text-heading">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const th = "px-4 py-2.5 font-bold whitespace-nowrap";
const td = "px-4 py-2.5 whitespace-nowrap";

export function CampaignTable({ report, currency }: Props) {
  if (!report.campaigns.length) return null;
  return (
    <TableCard title="Campaigns" description="Sorted by money spent. Impression share is for Search campaigns.">
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="bg-surface-2 text-xs text-ink-soft">
          <tr>
            <th scope="col" className={th}>Campaign</th>
            <th scope="col" className={cn(th, "text-right")}>Spent</th>
            <th scope="col" className={cn(th, "text-right")}>Conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Cost / conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Conv. rate</th>
            <th scope="col" className={cn(th, "text-right")}>Clicks</th>
            <th scope="col" className={cn(th, "text-right")}>CTR</th>
            <th scope="col" className={cn(th, "text-right")}>Impr. share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {report.campaigns.map((c) => (
            <tr key={c.campaignId} className="print-avoid-break align-top">
              <td className="min-w-[14rem] px-4 py-2.5">
                <span className="block font-bold text-heading">{c.name}</span>
                <span className="text-xs text-ink-soft">
                  {channelLabel(c.channelType)} · {statusLabel(c.status)}
                </span>
                <span className="mt-1.5 flex items-center gap-2" title={`${formatPercent(c.shareOfSpend, 0)} of spend`}>
                  <span className="h-1.5 w-24 rounded-full bg-surface-2">
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(2, c.shareOfSpend * 100)}%`, background: "var(--chart-spend)" }} />
                  </span>
                  <span className="text-xs text-ink-soft">{formatPercent(c.shareOfSpend, 0)} of spend</span>
                </span>
              </td>
              <td className={cn(td, "text-right font-bold text-heading")}>{formatMoney(c.cost, currency)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(c.conversions)}</td>
              <td className={cn(td, "text-right")}>{formatMoney(c.costPerConversion, currency)}</td>
              <td className={cn(td, "text-right")}>{formatPercent(c.conversionRate)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(c.clicks)}</td>
              <td className={cn(td, "text-right")}>{formatPercent(c.ctr, 2)}</td>
              <td className={cn(td, "text-right")}>
                {c.impressionShare === null ? "—" : formatPercent(c.impressionShare, 0)}
                {(c.budgetLostShare ?? 0) >= 0.1 && <span className="block text-xs text-warning">{formatPercent(c.budgetLostShare, 0)} lost to budget</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

const categoryLabel = (c: string) => c.charAt(0) + c.slice(1).toLowerCase().replace(/_/g, " ");

export function ConversionsTable({ report, currency }: Props) {
  const total = report.conversionActions.reduce((s, a) => s + a.conversions, 0);
  return (
    <TableCard title="Conversions by action" description="What customers did after clicking an ad.">
      {report.conversionActions.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-soft">No conversions recorded in this period.</p>
      ) : (
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="bg-surface-2 text-xs text-ink-soft">
            <tr>
              <th scope="col" className={th}>Action</th>
              <th scope="col" className={cn(th, "text-right")}>Conversions</th>
              <th scope="col" className={cn(th, "text-right")}>Share</th>
              <th scope="col" className={cn(th, "text-right")}>Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {report.conversionActions.map((a) => (
              <tr key={`${a.name}-${a.category}`} className="print-avoid-break">
                <td className="px-4 py-2.5">
                  <span className="block font-bold text-heading">{a.name}</span>
                  <span className="text-xs text-ink-soft">{categoryLabel(a.category)}</span>
                </td>
                <td className={cn(td, "text-right font-bold text-heading")}>{formatNumber(a.conversions)}</td>
                <td className={cn(td, "text-right")}>{formatPercent(total ? a.conversions / total : null, 0)}</td>
                <td className={cn(td, "text-right")}>{a.value > 0 ? formatMoney(a.value, currency) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

const matchLabel = (m: string) => ({ EXACT: "Exact", PHRASE: "Phrase", BROAD: "Broad" })[m] ?? m;

export function KeywordsTable({ report, currency }: Props) {
  if (!report.topKeywords.length) return null;
  return (
    <TableCard title="Top keywords" description="Last 30 days, by conversions.">
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="bg-surface-2 text-xs text-ink-soft">
          <tr>
            <th scope="col" className={th}>Keyword</th>
            <th scope="col" className={cn(th, "text-right")}>Conv.</th>
            <th scope="col" className={cn(th, "text-right")}>Clicks</th>
            <th scope="col" className={cn(th, "text-right")}>Spent</th>
            <th scope="col" className={cn(th, "text-right")}>Quality</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {report.topKeywords.map((k) => (
            <tr key={`${k.campaignName}-${k.adGroupName}-${k.text}-${k.matchType}`} className="print-avoid-break">
              <td className="px-4 py-2.5">
                <span className="block font-bold text-heading">{k.text}</span>
                <span className="text-xs text-ink-soft">
                  {matchLabel(k.matchType)} · {k.campaignName}
                </span>
              </td>
              <td className={cn(td, "text-right font-bold text-heading")}>{formatNumber(k.conversions)}</td>
              <td className={cn(td, "text-right")}>{formatNumber(k.clicks)}</td>
              <td className={cn(td, "text-right")}>{formatMoney(k.cost, currency)}</td>
              <td className={cn(td, "text-right")}>{k.qualityScore === null ? "—" : `${k.qualityScore}/10`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
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
    <section aria-labelledby="recs-title" className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-teal-wash text-teal-ink print:hidden">
          <Lightbulb aria-hidden="true" className="size-4.5" />
        </span>
        <div>
          <h2 id="recs-title" className="text-base font-bold text-heading">Recommendations to get more conversions</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Worked out from this account&apos;s numbers — most important first.</p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-ink">
          <CircleCheck aria-hidden="true" className="size-4 text-success" />
          Nothing urgent — the account is performing in line with its targets. Keep testing new ads and keywords.
        </p>
      ) : (
        <ol className="divide-y divide-line">
          {items.map((r, i) => {
            const Kind = kindMeta[r.kind].icon;
            return (
              <li key={r.id} className="print-avoid-break px-5 py-4">
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
