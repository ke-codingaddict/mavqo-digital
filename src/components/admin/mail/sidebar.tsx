import Link from "next/link";
import { Archive, Inbox, Send, Settings, SquarePen } from "lucide-react";
import { db } from "@/lib/db";
import { unreadThreadWhere } from "@/lib/mail/queries";
import { getMailConfig } from "@/lib/settings";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Folder = "inbox" | "sent" | "archived";

const folders = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "archived", label: "Archived", icon: Archive },
] as const;

export async function MailSidebar({ active, canManageSettings }: { active: Folder | "compose" | null; canManageSettings: boolean }) {
  const [unread, config] = await Promise.all([db().mailThread.count({ where: unreadThreadWhere }), getMailConfig()]);
  const ready = Boolean(config.from);
  const receiving = Boolean(config.saved?.webhookId && config.webhookSecret);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <Link href="/admin/mail/compose/" className={buttonClasses("primary", "md", "w-full")} aria-current={active === "compose" ? "page" : undefined}>
        <SquarePen aria-hidden="true" className="size-4" /> Compose
      </Link>
      <nav aria-label="Mail folders">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {folders.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <Link
                href={key === "inbox" ? "/admin/mail/" : `/admin/mail/?folder=${key}`}
                aria-current={active === key ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-bold transition-colors",
                  active === key ? "bg-surface text-heading shadow-sm ring-1 ring-line" : "text-ink-soft hover:bg-surface hover:text-heading",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="flex-1">{label}</span>
                {key === "inbox" && unread > 0 && <span className="rounded-full bg-teal px-2 text-xs font-black leading-5 text-[#08131f]">{unread}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hidden rounded-[var(--radius-md)] border border-line bg-surface p-3 text-xs lg:block">
        <p className="flex items-center gap-2 font-bold text-heading">
          <span aria-hidden="true" className={cn("size-2 rounded-full", ready && receiving ? "bg-success" : ready ? "bg-sun" : "bg-danger")} />
          {ready && receiving ? "Sending & receiving" : ready ? "Sending only" : "Email not set up"}
        </p>
        {config.replyTo && <p className="mt-1 break-all text-ink-soft">{config.replyTo}</p>}
        {canManageSettings && (!ready || !receiving) && (
          <Link href="/admin/settings/?tab=email" className="mt-2 inline-flex items-center gap-1 font-bold text-teal-ink hover:underline">
            <Settings aria-hidden="true" className="size-3.5" /> Finish setup
          </Link>
        )}
      </div>
    </aside>
  );
}
