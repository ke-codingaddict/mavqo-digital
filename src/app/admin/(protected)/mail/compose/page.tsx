import { Suspense } from "react";
import type { Metadata } from "next";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getMailConfig } from "@/lib/settings";
import { isSignatureEmpty, parseSignature } from "@/lib/mail/signature";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { MailSidebar } from "@/components/admin/mail/sidebar";
import { ComposeForm } from "@/components/admin/mail/compose-form";

export const metadata: Metadata = { title: "New message" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ComposePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <Compose searchParams={searchParams} />
    </Suspense>
  );
}

async function Compose({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("mail:use");
  const sp = await searchParams;
  const to = z.email().safeParse(one(sp.to) ?? "");
  const leadId = z.uuid().safeParse(one(sp.lead) ?? "");
  const [me, config] = await Promise.all([db().user.findUnique({ where: { id: user.id }, select: { signature: true } }), getMailConfig()]);

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <Suspense fallback={<div className="h-40" />}>
        <MailSidebar active="compose" canManageSettings={can(user.role, "settings:manage")} />
      </Suspense>
      <div className="min-w-0 space-y-4">
        {!config.from && (
          <p className="rounded-[var(--radius-md)] bg-warning-wash p-4 text-sm font-medium text-warning">
            Email sending isn&apos;t set up yet{can(user.role, "settings:manage") ? " — connect it in Settings → Email" : " — ask an admin to connect it"}.
          </p>
        )}
        <ComposeForm
          to={to.success ? to.data : undefined}
          subject={one(sp.subject)?.slice(0, 250)}
          leadId={leadId.success ? leadId.data : undefined}
          hasSignature={!isSignatureEmpty(parseSignature(me?.signature))}
        />
      </div>
    </div>
  );
}
