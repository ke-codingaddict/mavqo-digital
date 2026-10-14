import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";
import { getAccount, loadReport, type AdsReport } from "@/lib/google-ads/report";
import { change, formatMoney, formatNumber, formatPercent, weekdayProfile } from "@/lib/google-ads/metrics";
import { formatRange, rangeQuery, resolveRange, todayIn } from "@/lib/google-ads/range";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { logoUrl } from "@/lib/google-ads/logo";
import { formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/layout/logo";
import { AdsReportSkeleton } from "@/components/admin/skeletons";
import { ClientLogo } from "@/components/admin/ads/client-logo";
import {
  BudgetPacing,
  CampaignSplitChart,
  CampaignTable,
  ConversionsBreakdown,
  Funnel,
  KeywordsTable,
  KpiGrid,
  Recommendations,
  TrendSection,
  WeekdayChart,
} from "@/components/admin/ads/report-sections";
import { PrintButton } from "../../forms";

export const metadata: Metadata = { title: "Google Ads report" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ReportPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdsReportSkeleton />}>
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

/** Up to three specific, numbers-first observations for the summary page. */
function highlights(r: AdsReport, currency: string): string[] {
  const out: string[] = [];
  const { current: c, previous: p } = r;

  const cpa = change(c.costPerConversion, p.costPerConversion);
  if (cpa !== null && Math.abs(cpa) >= 0.05) {
    out.push(
      `Cost per conversion ${cpa < 0 ? "fell" : "rose"} ${formatPercent(Math.abs(cpa), 0)}, from ${formatMoney(p.costPerConversion, currency)} to ${formatMoney(c.costPerConversion, currency)}.`,
    );
  }

  if (r.campaigns.length > 1 && c.conversions > 0) {
    const best = r.campaigns.reduce((a, b) => (b.conversions > a.conversions ? b : a));
    if (best.conversions > 0) {
      out.push(`${best.name} delivered ${formatPercent(best.conversions / c.conversions, 0)} of all conversions on ${formatPercent(best.shareOfSpend, 0)} of the budget.`);
    }
  }

  const top = r.conversionActions[0];
  if (top && c.conversions > 0) {
    out.push(`The most common action was “${top.name}” — ${formatNumber(top.conversions)} in total, ${formatPercent(top.conversions / c.conversions, 0)} of conversions.`);
  }

  if (out.length < 3 && r.series.length >= 14 && c.conversions > 0) {
    const days = weekdayProfile(r.series);
    const best = days.reduce((a, b) => (b.conversions > a.conversions ? b : a));
    out.push(`${best.name}s brought the most conversions, averaging ${formatNumber(best.conversions, { decimals: 1 })} a day.`);
  }

  return out.slice(0, 3);
}

/** CSS string literal, safe inside a <style> element. */
const cssString = (s: string) => `"${s.replace(/["\\]/g, "\\$&").replace(/</g, "\\3C ").replace(/\n/g, " ")}"`;

function Section({ n, title, intro, children, pageBreak }: { n: number; title: string; intro?: string; children: ReactNode; pageBreak?: boolean }) {
  return (
    <section className={pageBreak ? "break-before-page" : undefined}>
      <header className="mb-5 flex items-baseline gap-4 border-b border-line pb-3">
        <span className="font-mono text-sm font-bold text-teal-ink">{String(n).padStart(2, "0")}</span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-heading">{title}</h2>
          {intro && <p className="mt-0.5 text-sm text-ink-soft">{intro}</p>}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
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
  const period = formatRange(range.from, range.to);
  const points = highlights(report, currency);
  let n = 0;

  return (
    <div className="mx-auto max-w-[56rem] space-y-6 print:max-w-none">
      {/* Running footer with page numbers on every printed page (Chromium; ignored elsewhere). */}
      <style>{`@page { @bottom-left { content: ${cssString(`${siteConfig.name} · ${account.name} · Google Ads report, ${period}`)}; font: 8pt system-ui, sans-serif; color: #667085; } @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #667085; } }`}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/ads/${account.id}/?${rangeQuery(range)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-ink-soft sm:block">Tip: choose “Save as PDF” to email it.</p>
          <PrintButton />
        </div>
      </div>

      <article className="paper overflow-hidden rounded-[var(--radius-md)] bg-white text-ink shadow-lg print:overflow-visible print:rounded-none print:shadow-none">
        {/* Letterhead */}
        <div className="flex items-center justify-between gap-6 bg-navy px-8 py-5 text-white sm:px-12 print:px-6 print:py-4">
          <div className="flex items-center gap-3">
            <LogoMark className="size-9 rounded-[10px] ring-1 ring-white/20" />
            <span className="text-lg font-black tracking-tight">
              mavqo<span className="font-normal text-white/70">digital</span>
            </span>
          </div>
          <p className="text-right text-xs leading-relaxed text-white/70">
            Digital marketing
            {siteConfig.contact.email && (
              <>
                <br />
                {siteConfig.contact.email}
              </>
            )}
          </p>
        </div>
        <div aria-hidden="true" className="h-1 bg-teal" />

        <div className="space-y-12 px-8 py-10 sm:px-12 print:px-0 print:py-8">
          {/* Title block */}
          <header className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start print:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-teal-ink uppercase">Google Ads performance report</p>
              <h1 className="mt-3 text-4xl leading-tight font-black tracking-tight text-heading">{account.name}</h1>
              <p className="mt-2 text-lg text-ink">{period}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end print:items-end">
              <span className="text-[0.6875rem] font-bold tracking-[0.14em] text-ink-soft uppercase">Prepared for</span>
              <ClientLogo name={account.name} src={logoUrl(account)} className="h-20 w-40 border-line text-2xl" />
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 text-sm sm:grid-cols-4 print:grid-cols-4">
            <div>
              <dt className="text-xs text-ink-soft">Reporting period</dt>
              <dd className="mt-0.5 font-bold text-heading">{period}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Compared with</dt>
              <dd className="mt-0.5 text-heading">{formatRange(range.prevFrom, range.prevTo)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Google Ads account</dt>
              <dd className="mt-0.5 font-mono text-heading">{formatCustomerId(account.customerId)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Prepared</dt>
              <dd className="mt-0.5 text-heading">
                {formatDate(new Date())} by {user.name}
              </dd>
            </div>
          </dl>

          <Section n={++n} title="Summary">
            <p className="max-w-[44rem] text-[1.0625rem] leading-relaxed text-heading">{headline(account.name, period, report, currency)}</p>
            {points.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
                {points.map((p) => (
                  <li key={p} className="border-l-2 border-teal pl-3 text-sm leading-relaxed text-ink">
                    {p}
                  </li>
                ))}
              </ul>
            )}
            <KpiGrid report={report} currency={currency} />
            <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2">
              <Funnel report={report} currency={currency} />
              <BudgetPacing report={report} currency={currency} />
            </div>
          </Section>

          {report.hasData && (
            <Section n={++n} title="Performance over time" intro="Coloured lines are this period; grey lines are the previous period, lined up day by day." pageBreak>
              <TrendSection report={report} currency={currency} print />
              <WeekdayChart report={report} currency={currency} />
            </Section>
          )}

          {report.hasData && (
            <Section n={++n} title="Where the budget went and what it bought">
              <div className="grid gap-5 sm:grid-cols-2 print:grid-cols-2">
                <CampaignSplitChart report={report} currency={currency} />
                <ConversionsBreakdown report={report} currency={currency} />
              </div>
            </Section>
          )}

          <Section n={++n} title="Our recommendations" intro="What we suggest changing next, based on this period's numbers." pageBreak>
            <Recommendations items={report.recommendations} />
          </Section>

          {report.campaigns.length > 0 && (
            <Section n={++n} title="Campaign detail">
              <CampaignTable report={report} currency={currency} />
              <KeywordsTable report={report} currency={currency} />
            </Section>
          )}

          <div className="print-avoid-break grid gap-4 text-sm sm:grid-cols-[1fr_1.4fr] print:grid-cols-[1fr_1.4fr]">
            <div className="flex gap-4 rounded-[var(--radius-md)] bg-teal-wash p-5">
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-base font-black text-white">
                {user.name.trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-teal-ink uppercase">Questions about this report?</p>
                <p className="mt-1.5 font-bold text-heading">{user.name}</p>
                <p className="text-ink">{siteConfig.name}</p>
                <p className="mt-1 text-ink-soft">{user.email}</p>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-line p-5 text-xs leading-relaxed text-ink-soft">
              <p className="text-xs font-bold tracking-[0.14em] text-ink uppercase">About these figures</p>
              <p className="mt-1.5">
                Figures come from Google Ads{account.lastSyncedAt ? `, last updated ${formatDate(account.lastSyncedAt, { dateStyle: "medium", timeStyle: "short" })}` : ""}. Amounts are in {currency}.
                Google keeps crediting conversions to the day of the click for up to 30 days, so the most recent days can still rise. Keyword figures cover the last 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Closing band — mirrors the letterhead. */}
        <footer className="print-avoid-break">
          <div aria-hidden="true" className="flex h-1">
            <span className="flex-[5] bg-teal" />
            <span className="flex-1 bg-sun" />
          </div>
          <div className="bg-navy px-8 py-7 text-white sm:px-12 print:px-6 print:py-5">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <LogoMark className="size-10 rounded-[11px] ring-1 ring-white/20" />
                <div>
                  <p className="text-lg leading-none font-black tracking-tight">
                    mavqo<span className="font-normal text-white/70">digital</span>
                  </p>
                  <p className="mt-1.5 text-xs text-white/60">{siteConfig.tagline}</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-white/75 sm:justify-end">
                <li>{new URL(siteConfig.url).host}</li>
                {siteConfig.contact.email && <li>{siteConfig.contact.email}</li>}
                {siteConfig.contact.phone && <li>{siteConfig.contact.phoneDisplay}</li>}
                {siteConfig.contact.location && <li>{siteConfig.contact.location}</li>}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-white/10 pt-4 text-[0.6875rem] text-white/50">
              <p>
                © {new Date().getFullYear()} {siteConfig.legalName}. Prepared exclusively for {account.name}.
              </p>
              <p>Confidential — please don&apos;t share outside your organisation.</p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
