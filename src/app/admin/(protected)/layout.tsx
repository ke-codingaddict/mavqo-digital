import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { IDLE_TIMEOUT_SECONDS } from "@/lib/auth/session-token";
import { LogoMark } from "@/components/layout/logo";
import { SessionGuard, SignOutButton } from "@/components/admin/session-guard";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Mavqo Admin" },
  robots: { index: false, follow: false },
};

async function AdminShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-surface-2">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/leads/" className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="hidden font-black text-heading sm:inline">Mavqo Admin</span>
            </Link>
            <nav aria-label="Admin">
              <Link href="/admin/leads/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-heading hover:bg-surface-2">
                <Inbox aria-hidden="true" className="size-4" /> Leads
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-ink-soft hover:text-heading md:inline-flex">
              View site <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
            <span className="hidden text-ink-soft sm:inline">
              {user.name} · <span className="capitalize">{user.role}</span>
            </span>
            <SignOutButton action={logout} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <SessionGuard timeoutSeconds={IDLE_TIMEOUT_SECONDS} />
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-ink-soft">Loading…</div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
