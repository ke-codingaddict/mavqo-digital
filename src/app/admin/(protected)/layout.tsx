import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { countUnreadThreads } from "@/lib/mail/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminShellSkeleton } from "@/components/admin/skeletons";
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
  const show = { mail: can(user.role, "mail:use"), ads: can(user.role, "ads:view"), blog: can(user.role, "blog:manage"), settings: can(user.role, "settings:manage") };
  const unread = show.mail ? await countUnreadThreads() : 0;
  return (
    <div className="min-h-dvh bg-surface-2 print:bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/admin/leads/" className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="hidden font-black text-heading sm:inline">Mavqo Admin</span>
            </Link>
            <AdminNav show={show} unread={unread} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-ink-soft hover:text-heading md:inline-flex">
              View site <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
            <Link
              href="/admin/account/"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-ink-soft hover:bg-surface-2 hover:text-heading"
              title="Account, password & signature"
            >
              <UserRound aria-hidden="true" className="size-4" />
              <span className="hidden lg:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <span className="sr-only lg:hidden">Account</span>
            </Link>
            <SignOutButton action={logout} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
      <SessionGuard timeoutSeconds={IDLE_TIMEOUT_SECONDS} />
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
