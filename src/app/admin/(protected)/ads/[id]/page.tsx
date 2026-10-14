import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, Download, FileText, Settings2 } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getAccount, loadReport } from "@/lib/google-ads/report";
import { RANGE_PRESETS, rangeQuery, resolveRange, todayIn, type DateRange } from "@/lib/google-ads/range";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { logoUrl } from "@/lib/google-ads/logo";
import { cn, formatInboxDate } from "@/lib/utils";
import { AdsAccountSkeleton } from "@/components/admin/skeletons";
import { Card } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
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
import { ClientLogo } from "@/components/admin/ads/client-logo";
import { AccountSettingsForm, LogoForm, SyncButton } from "../forms";

export const metadata: Metadata = { title: "Google Ads report" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function AccountPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdsAccountSkeleton />}>
      <AccountDashboard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Date-range filter: presets as links, plus a custom range. Scopes everything on the page. */
function RangeFilter({ base, range, today }: { base: string; range: DateRange; today: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-surface p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Reporting period" className="flex flex-wrap gap-1.5">
        {RANGE_PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`${base}?range=${p.key}`}
            aria-current={range.key === p.key ? "page" : undefined}
            className={cn("rounded-full px-3 py-1.5 text-sm font-medium", range.key === p.key ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2")}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <form action={base} className="flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="range" value="custom" />
        <label htmlFor="from" className="sr-only">From</label>
        <input id="from" name="from" type="date" max={today} defaultValue={range.from} required className="rounded-full border border-line bg-surface px-3 py-1.5 text-heading" />
        <span aria-hidden="true" className="text-ink-soft">–</span>
        <label htmlFor="to" className="sr-only">To</label>
        <input id="to" name="to" type="date" max={today} defaultValue={range.to} required className="rounded-full border border-line bg-surface px-3 py-1.5 text-heading" />
        <button type="submit" className={buttonClasses(range.key === "custom" ? "primary" : "secondary", "sm")}>
          Apply
        </button>
      </form>
    </div>
  );
}

async function AccountDashboard({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const user = await requireUser("ads:view");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const account = await getAccount(id);
  if (!account) notFound();

  const sp = await searchParams;
  const today = todayIn(account.timeZone ?? undefined);
  const range = resolveRange({ range: one(sp.range), from: one(sp.from), to: one(sp.to) }, today);
  const report = await loadReport(account, range, today);
  const canManage = can(user.role, "ads:manage");
  const base = `/admin/ads/${account.id}/`;
  const q = rangeQuery(range);
  const currency = account.currencyCode;
  const logo = logoUrl(account);

  return (
    <div className="space-y-6">
      <Link href="/admin/ads/" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
        <ArrowLeft aria-hidden="true" className="size-4" /> All accounts
      </Link>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <ClientLogo name={account.name} src={logo} className="h-14 w-14 text-lg sm:w-24" />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-widest text-teal-ink uppercase">Google Ads</p>
            <h1 className="truncate text-2xl font-black tracking-tight text-heading">{account.name}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              <span className="font-mono">{formatCustomerId(account.customerId)}</span> · {currency}
              {account.lastSyncedAt && <> · synced {formatInboxDate(account.lastSyncedAt)}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {canManage && <SyncButton accountId={account.id} />}
          <a href={`${base}export/?${q}`} className={buttonClasses("secondary", "sm")}>
            <Download aria-hidden="true" className="size-4" /> CSV
          </a>
          <Link href={`${base}report/?${q}`} className={buttonClasses("primary", "sm")}>
            <FileText aria-hidden="true" className="size-4" /> Client report
          </Link>
        </div>
      </div>

      {account.lastSyncError && (
        <p role="alert" className="flex gap-2 rounded-[var(--radius-md)] bg-danger-wash p-4 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
          Last sync failed: {account.lastSyncError}
        </p>
      )}

      <RangeFilter base={base} range={range} today={today} />

      {!report.hasData ? (
        <div className="rounded-[var(--radius-lg)] bg-surface p-10 text-center shadow-sm">
          <p className="font-bold text-heading">No ad activity in this period</p>
          <p className="mt-1 text-sm text-ink-soft">
            {account.lastSyncedAt ? "Try a longer period, or sync to fetch the latest numbers." : "This account hasn't been synced yet."}
          </p>
        </div>
      ) : (
        <>
          <KpiGrid report={report} currency={currency} />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <TrendSection report={report} currency={currency} />
            </div>
            <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
              <Funnel report={report} currency={currency} />
              <BudgetPacing report={report} currency={currency} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <CampaignSplitChart report={report} currency={currency} />
            <div className="grid content-start gap-6">
              <ConversionsBreakdown report={report} currency={currency} />
              <WeekdayChart report={report} currency={currency} />
            </div>
          </div>

          <Recommendations items={report.recommendations} />
          <CampaignTable report={report} currency={currency} />
          <KeywordsTable report={report} currency={currency} />
        </>
      )}

      {canManage && (
        <Card
          id="account-settings"
          title="Account settings"
          icon={<Settings2 />}
          aside={<SyncButton accountId={account.id} full label="Re-sync full history" />}
        >
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-bold text-heading">Client logo</h3>
              <LogoForm account={{ id: account.id, name: account.name, logoSrc: logo }} />
            </div>
            <div className="border-t border-line pt-6">
              <AccountSettingsForm account={{ id: account.id, name: account.name, monthlyBudget: account.monthlyBudget, active: account.active }} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
