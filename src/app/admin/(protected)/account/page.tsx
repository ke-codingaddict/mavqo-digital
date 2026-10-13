import { Suspense } from "react";
import type { Metadata } from "next";
import { KeyRound, PenLine, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { parseSignature } from "@/lib/mail/signature";
import { formatDate } from "@/lib/utils";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { Card, PageHeader } from "@/components/admin/ui";
import { PasswordForm } from "./password-form";
import { SignatureForm } from "./signature-form";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireUser();
  const [record, sessions] = await Promise.all([
    db().user.findUniqueOrThrow({ where: { id: user.id }, select: { signature: true, lastLoginAt: true, createdAt: true } }),
    db().adminSession.count({ where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Your account" description="Manage your password and the signature added to emails you send from Mail." />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Signed in as", value: user.email },
          { label: "Role", value: <span className="capitalize">{user.role}</span> },
          { label: "Last sign-in", value: record.lastLoginAt ? formatDate(record.lastLoginAt, { dateStyle: "medium", timeStyle: "short" }) : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{s.label}</p>
            <p className="mt-1 truncate font-bold text-heading">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Card id="password" title="Change password" description="You'll stay signed in here; every other device is signed out." icon={<KeyRound />}>
          <PasswordForm />
        </Card>
        <Card title="Security" icon={<ShieldCheck />}>
          <ul className="space-y-3 text-sm text-ink">
            <li>Automatic sign-out after <strong className="text-heading">5 minutes</strong> of inactivity.</li>
            <li>
              <strong className="text-heading">{sessions}</strong> active session{sessions === 1 ? "" : "s"} on your account.
            </li>
            <li>After 5 wrong password attempts, the account locks for 15 minutes.</li>
            <li>You&apos;ll get an email whenever your password changes.</li>
          </ul>
        </Card>
      </div>

      <Card id="signature" title="Email signature" description="Added to emails and replies you send from Mail. You can leave it off per message." icon={<PenLine />}>
        <SignatureForm initial={parseSignature(record.signature)} />
      </Card>
    </div>
  );
}
