import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";
import { getAccount, loadReport, type AdsReport } from "@/lib/google-ads/report";
import { change, formatMoney, formatNumber, formatPercent } from "@/lib/google-ads/metrics";
import { formatRange, rangeQuery, resolveRange, todayIn } from "@/lib/google-ads/range";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/layout/logo";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { BudgetPacing, CampaignTable, ConversionsTable, KeywordsTable, KpiGrid, Recommendations, TrendCharts } from "@/components/admin/ads/report-sections";
import { PrintButton } from "../../forms";

export const metadata: Metadata = { title: "Google Ads report" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ReportPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <PrintableReport params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** One plain-language summary a client can read without knowing Google Ads. */
function headline(name: string, period: string, r: AdsReport, currency: string): string {
  const { current: c, previous: p } = r;
  if (c.cost <= 0) return `${name}'s ads didn't run during ${period}.`;
  let s = `During ${period}, ${name} invested ${formatMoney(c.cost, currency)} in Google Ads. The ads were shown ${formatNumber(c.impressions, { compact: true })} times and brought ${formatNumber(c.clicks)} visits`;
  s += c.conversions > 0 ? `, producing ${formatNumber(c.conversions)} conversions at ${formatMoney(c.costPerConversion, currency)} each.` : ".";
  const d = change(c.conversions, p.conversions);
  if (d !== null && Math.abs(d) >= 0.05) s += ` Conversions are ${d > 0 ? "up" : "down"} ${formatPercent(Math.abs(d), 0)} on the previous period.`;
  return s;
}

async function PrintableReport({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const user = await requireUser("ads:view");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const account = await getAccount(id);
  if (!account) notFound();

  const sp = await searchParams;
  const today = todayIn(account.timeZone ?? undefined);
  const range = resolveRange({ range: one(sp.range), from: one(sp.from), to: one(sp.to) }, today);
  const report = await loadReport(account, range, today);
  const currency = account.currencyCode;

  return (
    <div className="mx-auto max-w-[60rem] space-y-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/ads/${account.id}/?${rangeQuery(range)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-ink-soft sm:block">Tip: choose “Save as PDF” to email it.</p>
          <PrintButton />
        </div>
      </div>

      <article className="space-y-6 rounded-[var(--radius-lg)] bg-canvas p-6 shadow-md sm:p-10 print:rounded-none print:bg-white print:p-0 print:shadow-none">
        <header className="flex flex-col justify-between gap-4 border-b-2 border-heading pb-5 sm:flex-row sm:items-end print:flex-row print:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="font-black text-heading">{siteConfig.name}</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-teal-ink">Google Ads performance report</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-heading">{account.name}</h1>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-sm sm:text-right print:text-right">
            <dt className="text-ink-soft">Period</dt>
            <dd className="font-bold text-heading">{formatRange(range.from, range.to)}</dd>
            <dt className="text-ink-soft">Compared with</dt>
            <dd className="text-heading">{formatRange(range.prevFrom, range.prevTo)}</dd>
            <dt className="text-ink-soft">Account</dt>
            <dd className="font-mono text-heading">{formatCustomerId(account.customerId)}</dd>
            <dt className="text-ink-soft">Prepared</dt>
            <dd className="text-heading">
              {formatDate(new Date())} · {user.name}
            </dd>
          </dl>
        </header>

        <p className="text-[1.0625rem] leading-relaxed text-heading">{headline(account.name, formatRange(range.from, range.to), report, currency)}</p>

        <KpiGrid report={report} currency={currency} />
        <BudgetPacing report={report} currency={currency} />
        <TrendCharts report={report} currency={currency} showTable={false} />
        <div className="break-before-page" />
        <Recommendations items={report.recommendations} />
        <CampaignTable report={report} currency={currency} />
        <ConversionsTable report={report} currency={currency} />
        <KeywordsTable report={report} currency={currency} />

        <footer className="border-t border-line pt-4 text-xs text-ink-soft">
          Figures come from Google Ads{account.lastSyncedAt ? `, last updated ${formatDate(account.lastSyncedAt, { dateStyle: "medium", timeStyle: "short" })}` : ""}. Amounts are in{" "}
          {currency}. Google keeps crediting conversions to the day of the click for up to 30 days, so recent figures can still rise.
        </footer>
      </article>
    </div>
  );
}
