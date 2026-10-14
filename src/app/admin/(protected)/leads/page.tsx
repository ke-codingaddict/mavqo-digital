import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { ENQUIRY_TYPES } from "@/lib/validation/lead";
import { enquiryTypeLabels, LEAD_STATUSES, leadStatusLabels, type LeadStatusValue } from "@/lib/leads/labels";
import { interestLabel } from "@/content/form-options";
import { cn, formatDate } from "@/lib/utils";
import { LeadStatusBadge } from "@/components/admin/badges";
import { buttonClasses } from "@/components/ui/button";
import { LeadsSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "Leads" };

const PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

function leadSource(l: { utmSource: string | null; referrer: string | null }) {
  if (l.utmSource) return l.utmSource;
  if (!l.referrer) return "Direct";
  try {
    return new URL(l.referrer).hostname;
  } catch {
    return "Referral";
  }
}

function formatDuration(ms: number) {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.round(ms / 60_000)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

/**
 * The session check and data reads happen inside a Suspense boundary owned by
 * this page, so client navigations between admin pages stream instead of
 * blocking (the layout's boundary only covers full page loads).
 */
export default function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LeadsContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("leads:view");
  const params = await searchParams;

  const status = LEAD_STATUSES.find((s) => s === one(params.status));
  const type = ENQUIRY_TYPES.find((t) => t === one(params.type));
  const q = one(params.q)?.trim().slice(0, 100) || undefined;
  const page = Math.max(1, Number(one(params.page)) || 1);

  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { enquiryType: type } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { organization: { contains: q, mode: "insensitive" } },
            { reference: { contains: q.toUpperCase() } },
          ],
        }
      : {}),
  };

  const client = db();
  const since30 = daysAgo(30);
  const [leads, total, byStatus, last30, responded] = await Promise.all([
    client.lead.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    client.lead.count({ where }),
    client.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    client.lead.count({ where: { createdAt: { gte: since30 } } }),
    client.lead.findMany({
      where: { createdAt: { gte: since30 }, firstContactedAt: { not: null } },
      select: { createdAt: true, firstContactedAt: true },
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])) as Partial<Record<LeadStatusValue, number>>;
  const durations = responded.map((r) => r.firstContactedAt!.getTime() - r.createdAt.getTime()).sort((a, b) => a - b);
  const medianResponse = durations.length ? durations[Math.floor(durations.length / 2)] : null;
  const won = counts.won ?? 0;
  const closed = won + (counts.lost ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const query = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status, type, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return `/admin/leads/${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-8">
      {one(params.deleted) && <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">Lead deleted.</p>}
      {one(params.denied) && <p role="alert" className="rounded-[var(--radius-md)] bg-warning-wash p-3 text-sm font-medium text-warning">You don&apos;t have permission to do that.</p>}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black text-heading">Leads</h1>
          <p className="mt-1 text-sm text-ink-soft">Enquiries submitted through the website.</p>
        </div>
        {can(user.role, "leads:export") && (
          <a href={`/admin/leads/export/${query({}).replace("/admin/leads/", "")}`} className={buttonClasses("secondary", "sm")}>
            <Download aria-hidden="true" className="size-4" /> Export CSV
          </a>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "New (awaiting contact)", value: counts.new ?? 0, highlight: (counts.new ?? 0) > 0 },
          { label: "Leads in last 30 days", value: last30 },
          { label: "Median first response (30d)", value: medianResponse === null ? "—" : formatDuration(medianResponse) },
          { label: "Win rate (closed leads)", value: closed ? `${Math.round((won / closed) * 100)}%` : "—" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-[var(--radius-lg)] bg-surface p-5 shadow-md", s.highlight && "ring-2 ring-teal")}>
            <dt className="text-[0.8125rem] text-ink-soft">{s.label}</dt>
            <dd className="mt-1 text-2xl font-black text-heading">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-[var(--radius-lg)] bg-surface shadow-md">
        <div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            <Link href={query({ status: undefined, page: undefined })} aria-current={!status ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 text-sm font-medium", !status ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2")}>
              All
            </Link>
            {LEAD_STATUSES.map((s) => (
              <Link key={s} href={query({ status: s, page: undefined })} aria-current={status === s ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 text-sm font-medium", status === s ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2")}>
                {leadStatusLabels[s]} <span className="opacity-60">{counts[s] ?? 0}</span>
              </Link>
            ))}
          </nav>
          <form className="flex gap-2" action="/admin/leads/">
            {status && <input type="hidden" name="status" value={status} />}
            <label htmlFor="type-filter" className="sr-only">Enquiry type</label>
            <select id="type-filter" name="type" defaultValue={type ?? ""} className="rounded-full border border-line bg-surface px-3 py-2 text-sm text-heading">
              <option value="">All types</option>
              {ENQUIRY_TYPES.map((t) => (
                <option key={t} value={t}>{enquiryTypeLabels[t]}</option>
              ))}
            </select>
            <label htmlFor="q" className="sr-only">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Name, email, phone, ref…" className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm text-heading lg:w-64" />
            <button type="submit" className={buttonClasses("primary", "sm", "h-auto")} aria-label="Search">
              <Search aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>

        {leads.length === 0 ? (
          <p className="p-10 text-center text-ink-soft">No leads match these filters yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[0.8125rem] text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Received</th>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Interest</th>
                  <th scope="col" className="px-4 py-3 font-medium">Source</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((l) => (
                  <tr key={l.id} className="group relative hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(l.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${l.id}/`} className="font-bold text-heading after:absolute after:inset-0">
                        {l.name}
                      </Link>
                      <span className="block text-[0.8125rem] text-ink-soft">{l.organization ?? l.email ?? l.phone}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{enquiryTypeLabels[l.enquiryType]}</td>
                    <td className="px-4 py-3">{interestLabel(l.productInterest ?? l.serviceInterest) ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{leadSource(l)}</td>
                    <td className="px-4 py-3"><LeadStatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line p-4 text-sm">
            <span className="text-ink-soft">Page {page} of {pages} · {total} leads</span>
            <div className="flex gap-2">
              {page > 1 && <Link className={buttonClasses("secondary", "sm")} href={query({ page: String(page - 1) })}>Previous</Link>}
              {page < pages && <Link className={buttonClasses("secondary", "sm")} href={query({ page: String(page + 1) })}>Next</Link>}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
