import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Download, Megaphone, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getGoogleAdsConfig } from "@/lib/google-ads/config";
import { accountTotals } from "@/lib/google-ads/report";
import { formatMoney, formatNumber } from "@/lib/google-ads/metrics";
import { addDays, todayIn } from "@/lib/google-ads/range";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { formatInboxDate } from "@/lib/utils";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { AddAccountForm, ImportAccounts, SyncAllButton } from "./forms";

export const metadata: Metadata = { title: "Google Ads" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AdsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <AdsOverview searchParams={searchParams} />
    </Suspense>
  );
}

async function AdsOverview({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("ads:view");
  const params = await searchParams;
  const canManage = can(user.role, "ads:manage");
  const today = todayIn();
  const from = addDays(today, -30);
  const to = addDays(today, -1);

  const [config, accounts, totals] = await Promise.all([
    getGoogleAdsConfig(),
    db().adsAccount.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    accountTotals(from, to),
  ]);

  const all = [...totals.values()];
  const spendAll = all.reduce((s, t) => s + t.cost, 0);
  const convAll = all.reduce((s, t) => s + t.conversions, 0);
  const currencies = new Set(accounts.map((a) => a.currencyCode));
  const singleCurrency = currencies.size === 1 ? [...currencies][0] : null;

  return (
    <div className="space-y-8">
      {params.removed && <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">Account removed.</p>}

      <PageHeader
        title="Google Ads"
        description="Spend, conversions and recommendations for every client account — synced daily from Google Ads, so nobody has to sign in there."
        actions={canManage && accounts.length > 0 && config.ready ? <SyncAllButton /> : undefined}
      />

      {!config.ready && (
        <div role="status" className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-bold text-heading">Google Ads isn&apos;t connected yet</p>
              <p className="text-sm text-ink-soft">
                {can(user.role, "settings:manage")
                  ? "Add your API details and connect your Google account once — then reports update by themselves."
                  : "Ask an admin to connect Google Ads in Settings."}
              </p>
            </div>
          </div>
          {can(user.role, "settings:manage") && (
            <Link href="/admin/settings/?tab=google-ads" className={buttonClasses("primary", "sm")}>
              Connect Google Ads
            </Link>
          )}
        </div>
      )}

      {accounts.length > 0 && (
        <>
          {singleCurrency && (
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Accounts", value: formatNumber(accounts.filter((a) => a.active).length) },
                { label: "Spent, last 30 days", value: formatMoney(spendAll, singleCurrency) },
                { label: "Conversions, last 30 days", value: formatNumber(convAll) },
                { label: "Cost per conversion", value: formatMoney(convAll ? spendAll / convAll : null, singleCurrency) },
              ].map((s) => (
                <div key={s.label} className="rounded-[var(--radius-lg)] bg-surface p-5 shadow-md">
                  <dt className="text-[0.8125rem] text-ink-soft">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-black text-heading">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm tabular-nums">
                <thead className="border-b border-line text-[0.8125rem] text-ink-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Client</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Spent (30d)</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Conversions</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Cost / conv.</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Clicks</th>
                    <th scope="col" className="px-4 py-3 font-medium">Last sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {accounts.map((a) => {
                    const t = totals.get(a.id);
                    return (
                      <tr key={a.id} className="group relative hover:bg-surface-2/60">
                        <td className="px-4 py-3">
                          <Link href={`/admin/ads/${a.id}/`} className="font-bold text-heading after:absolute after:inset-0">
                            {a.name}
                          </Link>
                          <span className="block font-mono text-xs text-ink-soft">
                            {formatCustomerId(a.customerId)} · {a.currencyCode}
                            {!a.active && " · paused"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-heading">{formatMoney(t?.cost ?? 0, a.currencyCode)}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(t?.conversions ?? 0)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(t?.costPerConversion ?? null, a.currencyCode)}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(t?.clicks ?? 0)}</td>
                        <td className="px-4 py-3">
                          {a.lastSyncError ? (
                            <StatusPill tone="danger">Sync failed</StatusPill>
                          ) : a.lastSyncedAt ? (
                            <span className="text-ink-soft">{formatInboxDate(a.lastSyncedAt)}</span>
                          ) : (
                            <StatusPill tone="neutral">Not synced</StatusPill>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Add a client account" description="Enter the account's customer ID. The connected Google account (or your manager account) must have access to it." icon={<Plus />}>
            <AddAccountForm />
          </Card>
          <Card title="Import from Google Ads" description="Lists the client accounts your connection can see, so you can add several at once." icon={<Download />}>
            {config.ready ? <ImportAccounts /> : <p className="text-sm text-ink-soft">Connect Google Ads first.</p>}
          </Card>
        </div>
      )}

      {accounts.length === 0 && !canManage && (
        <div className="rounded-[var(--radius-lg)] bg-surface p-10 text-center shadow-md">
          <Megaphone aria-hidden="true" className="mx-auto size-8 text-ink-soft" />
          <p className="mt-3 text-ink-soft">No Google Ads accounts have been added yet.</p>
        </div>
      )}
    </div>
  );
}
