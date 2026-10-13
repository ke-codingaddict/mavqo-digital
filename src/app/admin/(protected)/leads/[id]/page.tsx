import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { enquiryTypeLabels, leadStatusLabels } from "@/lib/leads/labels";
import { leadOptions } from "@/content/industries";
import { interestLabel } from "@/content/form-options";
import { formatDate } from "@/lib/utils";
import { LeadStatusBadge } from "@/components/admin/badges";
import { buttonClasses } from "@/components/ui/button";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { deleteLead } from "../../../actions";
import { LeadUpdateForm } from "./lead-update-form";

export const metadata: Metadata = { title: "Lead" };

function optionLabel(list: readonly { value: string; label: string }[], value: string | null) {
  return value ? (list.find((o) => o.value === value)?.label ?? value) : null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-[0.9375rem] text-heading">{children}</dd>
    </div>
  );
}

/**
 * The session check and data reads happen inside a Suspense boundary owned by
 * this page, so client navigations between admin pages stream instead of
 * blocking (the layout's boundary only covers full page loads).
 */
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <LeadDetail params={params} />
    </Suspense>
  );
}

async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("leads:view");
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  const lead = await db().lead.findUnique({ where: { id: id.data } });
  if (!lead) notFound();

  const history = await db().auditLog.findMany({
    where: { entityType: "lead", entityId: lead.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { name: true } } },
  });

  const wa = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/leads/" className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-ink">
        <ArrowLeft aria-hidden="true" className="size-4" /> All leads
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-heading">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {enquiryTypeLabels[lead.enquiryType]} · <span className="font-mono">{lead.reference}</span> · received{" "}
            {formatDate(lead.createdAt, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className={buttonClasses("secondary", "sm")}>
              <Phone aria-hidden="true" className="size-4" /> Call
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "sm")}>
              <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your enquiry ${lead.reference}`)}`} className={buttonClasses("primary", "sm")}>
              <Mail aria-hidden="true" className="size-4" /> Email
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="details-heading" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-md">
            <h2 id="details-heading" className="text-lg font-bold text-heading">Enquiry details</h2>
            <dl className="mt-2 divide-y divide-line">
              <Row label="Email">{lead.email}</Row>
              <Row label="Phone">{lead.phone}</Row>
              <Row label="Organization">{lead.organization}</Row>
              <Row label="Preferred contact">{optionLabel(leadOptions.preferredContact, lead.preferredContact)}</Row>
              <Row label="Product">{interestLabel(lead.productInterest)}</Row>
              <Row label="Service">{interestLabel(lead.serviceInterest)}</Row>
              <Row label="Organization size">{optionLabel(leadOptions.organizationSize, lead.organizationSize)}</Row>
              <Row label="Website">
                {lead.websiteUrl && (
                  <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-teal-ink underline">
                    {lead.websiteUrl}
                  </a>
                )}
              </Row>
              <Row label="Main objective">{lead.objective}</Row>
              <Row label="Budget">{optionLabel(leadOptions.budgetRange, lead.budgetRange)}</Row>
              <Row label="Timeline">{optionLabel(leadOptions.timeline, lead.timeline)}</Row>
              <Row label="Message">{lead.message && <span className="whitespace-pre-wrap">{lead.message}</span>}</Row>
            </dl>
          </section>

          <section aria-labelledby="source-heading" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-md">
            <h2 id="source-heading" className="text-lg font-bold text-heading">Source & attribution</h2>
            <dl className="mt-2 divide-y divide-line">
              <Row label="Submitted from">{lead.sourcePage}</Row>
              <Row label="Referrer">{lead.referrer}</Row>
              <Row label="UTM source / medium">{lead.utmSource || lead.utmMedium ? `${lead.utmSource ?? "—"} / ${lead.utmMedium ?? "—"}` : null}</Row>
              <Row label="Campaign">{lead.utmCampaign}</Row>
              <Row label="Term / content">{lead.utmTerm || lead.utmContent ? `${lead.utmTerm ?? "—"} / ${lead.utmContent ?? "—"}` : null}</Row>
              <Row label="Google Ads click">{lead.gclid ? "Yes (gclid captured)" : null}</Row>
              <Row label="Consent given">{lead.consentGiven ? "Yes" : "No"}</Row>
              <Row label="Team notified">{lead.notifiedAt ? formatDate(lead.notifiedAt, { dateStyle: "medium", timeStyle: "short" }) : "Not sent (check email settings)"}</Row>
              <Row label="First contacted">{lead.firstContactedAt && formatDate(lead.firstContactedAt, { dateStyle: "medium", timeStyle: "short" })}</Row>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="manage-heading" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-md">
            <h2 id="manage-heading" className="text-lg font-bold text-heading">Manage</h2>
            {can(user.role, "leads:update") ? (
              <LeadUpdateForm leadId={lead.id} status={lead.status} notes={lead.internalNotes ?? ""} />
            ) : (
              <p className="mt-3 text-sm text-ink-soft">You have view-only access.</p>
            )}
          </section>

          <section aria-labelledby="history-heading" className="rounded-[var(--radius-lg)] bg-surface p-6 shadow-md">
            <h2 id="history-heading" className="text-lg font-bold text-heading">History</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {history.map((h) => {
                const meta = h.metadata as { from?: keyof typeof leadStatusLabels; to?: keyof typeof leadStatusLabels } | null;
                return (
                  <li key={h.id} className="border-l-2 border-line-strong pl-3">
                    <span className="text-heading">
                      {h.action === "lead_status_changed" && meta?.from && meta?.to
                        ? `${leadStatusLabels[meta.from]} → ${leadStatusLabels[meta.to]}`
                        : h.action.replace(/_/g, " ")}
                    </span>
                    <span className="block text-ink-soft">
                      {h.actor?.name ?? "System"} · {formatDate(h.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </li>
                );
              })}
              <li className="border-l-2 border-line-strong pl-3">
                <span className="text-heading">Enquiry received</span>
                <span className="block text-ink-soft">{formatDate(lead.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            </ol>
          </section>

          {can(user.role, "leads:delete") && (
            <section aria-labelledby="delete-heading" className="rounded-[var(--radius-lg)] border border-danger/20 bg-surface p-6">
              <h2 id="delete-heading" className="text-base font-bold text-danger">Delete lead</h2>
              <p className="mt-1 text-sm text-ink-soft">Use for data-deletion requests. This can&apos;t be undone.</p>
              <form action={deleteLead} className="mt-4 space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="confirm" value="yes" required className="accent-danger" /> I understand this is permanent
                </label>
                <button type="submit" className="rounded-[var(--radius-md)] bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                  Delete permanently
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
