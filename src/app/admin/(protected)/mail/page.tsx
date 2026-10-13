import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Inbox, Search, Send } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { snippet } from "@/lib/mail/format";
import { cn, formatInboxDate } from "@/lib/utils";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { Avatar } from "@/components/admin/mail/avatar";
import { MailSidebar, type Folder } from "@/components/admin/mail/sidebar";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mail" };

const PAGE_SIZE = 30;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function MailPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <MailList searchParams={searchParams} />
    </Suspense>
  );
}

const folderMeta = {
  inbox: { title: "Inbox", empty: "No messages yet. Customer emails and replies will appear here.", icon: Inbox },
  sent: { title: "Sent", empty: "Nothing sent yet.", icon: Send },
  archived: { title: "Archived", empty: "No archived conversations.", icon: Archive },
} as const;

async function MailList({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("mail:use");
  const params = await searchParams;
  const folder: Folder = (["sent", "archived"] as const).find((f) => f === one(params.folder)) ?? "inbox";
  const q = one(params.q)?.trim().slice(0, 100) || undefined;
  const page = Math.max(1, Number(one(params.page)) || 1);

  const where: Prisma.MailThreadWhereInput = {
    ...(folder === "archived" ? { archivedAt: { not: null } } : { archivedAt: null }),
    ...(folder === "inbox" ? { messages: { some: { direction: "inbound" } } } : {}),
    ...(folder === "sent" ? { messages: { some: { direction: "outbound" } } } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { contactEmail: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [threads, total] = await Promise.all([
    db().mailThread.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        subject: true,
        contactEmail: true,
        contactName: true,
        lastMessageAt: true,
        lead: { select: { reference: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, direction: true, status: true } },
        _count: { select: { messages: true } },
      },
    }),
    db().mailThread.count({ where }),
  ]);
  const unreadIds = new Set(
    (
      await db().mailMessage.findMany({
        where: { threadId: { in: threads.map((t) => t.id) }, direction: "inbound", readAt: null },
        select: { threadId: true },
        distinct: ["threadId"],
      })
    ).map((m) => m.threadId),
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const meta = folderMeta[folder];
  const href = (p: number) => `/admin/mail/?${new URLSearchParams({ ...(folder !== "inbox" ? { folder } : {}), ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <Suspense fallback={<div className="h-40" />}>
        <MailSidebar active={folder} canManageSettings={can(user.role, "settings:manage")} />
      </Suspense>

      <div className="min-w-0 space-y-4">
        {one(params.archived) && <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">Conversation archived.</p>}

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="flex items-center gap-2 text-lg font-black text-heading">
              <meta.icon aria-hidden="true" className="size-5 text-ink-soft" /> {meta.title}
              <span className="text-sm font-bold text-ink-soft">{total}</span>
            </h1>
            <form action="/admin/mail/" className="relative sm:w-72">
              {folder !== "inbox" && <input type="hidden" name="folder" value={folder} />}
              <label htmlFor="mail-q" className="sr-only">Search mail</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <input id="mail-q" name="q" defaultValue={q} placeholder="Search name, email, subject" className="w-full rounded-full border border-line bg-surface-2/60 py-2 pl-9 pr-4 text-sm text-heading focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/20" />
            </form>
          </div>

          {threads.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <meta.icon aria-hidden="true" className="mx-auto size-10 text-line-strong" />
              <p className="mt-3 text-sm text-ink-soft">{q ? `No conversations match “${q}”.` : meta.empty}</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {threads.map((t) => {
                const last = t.messages[0];
                const unread = unreadIds.has(t.id);
                return (
                  <li key={t.id} className={cn("relative transition-colors hover:bg-surface-2/60", unread && "bg-teal-wash/40")}>
                    <Link href={`/admin/mail/${t.id}/`} className="flex gap-3 px-4 py-3.5 after:absolute after:inset-0">
                      <span className="relative">
                        <Avatar name={t.contactName} email={t.contactEmail} />
                        {unread && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-teal ring-2 ring-surface" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={cn("truncate text-sm", unread ? "font-black text-heading" : "font-bold text-heading")}>
                            {t.contactName ?? t.contactEmail}
                            {t._count.messages > 1 && <span className="ml-1.5 font-medium text-ink-soft">{t._count.messages}</span>}
                            {unread && <span className="sr-only"> (unread)</span>}
                          </p>
                          <time dateTime={t.lastMessageAt.toISOString()} className={cn("shrink-0 text-xs", unread ? "font-bold text-heading" : "text-ink-soft")}>
                            {formatInboxDate(t.lastMessageAt)}
                          </time>
                        </div>
                        <p className={cn("truncate text-sm", unread ? "font-bold text-heading" : "text-ink")}>{t.subject}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-[0.8125rem] text-ink-soft">
                          {last?.direction === "outbound" && <span className="shrink-0 font-bold">You:</span>}
                          <span className="truncate">{snippet(last?.text, 120)}</span>
                          {last?.status === "failed" && <span className="shrink-0 rounded-full bg-danger-wash px-2 text-xs font-bold text-danger">Failed</span>}
                          {t.lead && <span className="shrink-0 rounded-full bg-surface-2 px-2 font-mono text-[0.6875rem] font-bold text-ink-soft ring-1 ring-line">{t.lead.reference}</span>}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
              <span className="text-ink-soft">Page {page} of {pages}</span>
              <div className="flex gap-2">
                {page > 1 && <Link className={buttonClasses("secondary", "sm")} href={href(page - 1)}>Newer</Link>}
                {page < pages && <Link className={buttonClasses("secondary", "sm")} href={href(page + 1)}>Older</Link>}
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
