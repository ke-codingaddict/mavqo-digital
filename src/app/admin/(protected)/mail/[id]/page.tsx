import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, ArrowLeft, CircleAlert, MailOpen, Paperclip, UserRound } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getMailConfig } from "@/lib/settings";
import { isSignatureEmpty, parseSignature } from "@/lib/mail/signature";
import { formatAddress, snippet } from "@/lib/mail/format";
import { formatDate } from "@/lib/utils";
import { MailThreadSkeleton, MailSidebarSkeleton } from "@/components/admin/skeletons";
import { Avatar } from "@/components/admin/mail/avatar";
import { MailSidebar } from "@/components/admin/mail/sidebar";
import { MessageBody } from "@/components/admin/mail/message-body";
import { MarkRead } from "@/components/admin/mail/mark-read";
import { ReplyForm } from "@/components/admin/mail/reply-form";
import { setThreadState } from "../actions";

export const metadata: Metadata = { title: "Conversation" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ThreadPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<MailThreadSkeleton />}>
      <Thread params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const categoryLabel: Partial<Record<string, string>> = { auto_reply: "Automatic confirmation", test: "Test email" };

async function Thread({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const user = await requireUser("mail:use");
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const sp = await searchParams;

  const [thread, me, config] = await Promise.all([
    db().mailThread.findUnique({
      where: { id: id.data },
      include: {
        lead: { select: { id: true, reference: true, name: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { sentBy: { select: { name: true } } } },
      },
    }),
    db().user.findUnique({ where: { id: user.id }, select: { signature: true } }),
    getMailConfig(),
  ]);
  if (!thread) notFound();

  const hasUnread = thread.messages.some((m) => m.direction === "inbound" && !m.readAt);
  const count = thread.messages.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <Suspense fallback={<MailSidebarSkeleton />}>
        <MailSidebar active={null} canManageSettings={can(user.role, "settings:manage")} />
      </Suspense>

      <div className="min-w-0 space-y-4">
        {hasUnread && <MarkRead threadId={thread.id} />}
        {sp.sent && <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">Message sent.</p>}

        <div className="rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-4 shadow-sm">
          <Link href={thread.archivedAt ? "/admin/mail/?folder=archived" : "/admin/mail/"} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-heading">
            <ArrowLeft aria-hidden="true" className="size-3.5" /> Back to {thread.archivedAt ? "Archived" : "Inbox"}
          </Link>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-heading">{thread.subject}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                <span>{formatAddress(thread.contactName, thread.contactEmail)}</span>
                <span aria-hidden="true">·</span>
                <span>{count} message{count === 1 ? "" : "s"}</span>
                {thread.lead && (
                  <Link href={`/admin/leads/${thread.lead.id}/`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-heading ring-1 ring-line hover:ring-line-strong">
                    <UserRound aria-hidden="true" className="size-3" /> Lead {thread.lead.reference}
                  </Link>
                )}
              </p>
            </div>
            <form action={setThreadState} className="flex shrink-0 gap-2">
              <input type="hidden" name="threadId" value={thread.id} />
              <button name="intent" value="unread" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-soft ring-1 ring-inset ring-line hover:text-heading" title="Mark as unread">
                <MailOpen aria-hidden="true" className="size-4" /> <span className="hidden sm:inline">Unread</span>
              </button>
              {thread.archivedAt ? (
                <button name="intent" value="unarchive" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
                  <ArchiveRestore aria-hidden="true" className="size-4" /> Move to inbox
                </button>
              ) : (
                <button name="intent" value="archive" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
                  <Archive aria-hidden="true" className="size-4" /> Archive
                </button>
              )}
            </form>
          </div>
        </div>

        <ol className="space-y-3">
          {thread.messages.map((m, i) => {
            const outbound = m.direction === "outbound";
            const expanded = i >= count - 2 || m.status === "failed";
            const attachments = (m.attachments as { filename: string; size: number | null }[] | null) ?? [];
            return (
              <li key={m.id}>
                <details open={expanded} className="group rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                    <Avatar name={outbound ? (m.sentBy?.name ?? m.fromName) : m.fromName} email={m.fromAddress} className={outbound ? "!bg-primary !text-on-primary" : undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="text-sm font-bold text-heading">
                          {outbound ? (m.sentBy?.name ? `${m.sentBy.name} (you${m.sentBy.name ? "r team" : ""})` : (m.fromName ?? "Your team")) : (m.fromName ?? m.fromAddress)}
                          {!outbound && m.fromName && <span className="ml-1.5 font-normal text-ink-soft">{m.fromAddress}</span>}
                        </p>
                        <time dateTime={m.createdAt.toISOString()} className="text-xs text-ink-soft">
                          {formatDate(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                        </time>
                      </div>
                      <p className="hidden truncate text-sm text-ink-soft group-open:block">
                        to {m.to.join(", ")}
                        {m.cc.length > 0 && `, cc ${m.cc.join(", ")}`}
                      </p>
                      <p className="truncate text-sm text-ink-soft group-open:hidden">{snippet(m.text, 160)}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {categoryLabel[m.category] && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-soft">{categoryLabel[m.category]}</span>}
                        {m.status === "failed" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-wash px-2 py-0.5 text-xs font-bold text-danger">
                            <CircleAlert aria-hidden="true" className="size-3" /> Not delivered{m.error ? `: ${m.error}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-line px-5 py-5">
                    <MessageBody html={m.html} text={m.text} />
                    {attachments.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {attachments.map((a, j) => (
                          <li key={j} className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-line px-2.5 py-1.5 text-xs text-ink">
                            <Paperclip aria-hidden="true" className="size-3.5 text-ink-soft" /> {a.filename}
                            {a.size ? <span className="text-ink-soft">· {Math.max(1, Math.round(a.size / 1024))} KB</span> : null}
                          </li>
                        ))}
                        <li className="self-center text-xs text-ink-soft">Attachments are available in your Resend dashboard.</li>
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>

        {config.from ? (
          <ReplyForm threadId={thread.id} to={formatAddress(thread.contactName, thread.contactEmail)} hasSignature={!isSignatureEmpty(parseSignature(me?.signature))} />
        ) : (
          <p className="rounded-[var(--radius-md)] bg-warning-wash p-4 text-sm font-medium text-warning">Email sending isn&apos;t set up yet, so replies are disabled.</p>
        )}
        <p className="text-center text-xs text-ink-soft">Remote images in received emails are blocked to protect your privacy.</p>
      </div>
    </div>
  );
}
