"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Mail, Megaphone, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/leads/", label: "Leads", icon: Inbox, key: "leads" },
  { href: "/admin/mail/", label: "Mail", icon: Mail, key: "mail" },
  { href: "/admin/ads/", label: "Google Ads", icon: Megaphone, key: "ads" },
  { href: "/admin/settings/", label: "Settings", icon: Settings, key: "settings" },
] as const;

/** Primary admin navigation with the current section highlighted. */
export function AdminNav({ show, unread }: { show: { mail: boolean; ads: boolean; settings: boolean }; unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex items-center gap-1">
      {items
        .filter((i) => i.key === "leads" || show[i.key])
        .map(({ href, label, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition-colors",
                active ? "bg-surface-2 text-heading" : "text-ink-soft hover:bg-surface-2 hover:text-heading",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">{label}</span>
              {key === "mail" && unread > 0 && (
                <span className="min-w-5 rounded-full bg-teal px-1.5 text-center text-[0.6875rem] font-black leading-5 text-[#08131f]">
                  {unread > 99 ? "99+" : unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}
