"use client";

import { useState } from "react";
import { Field } from "@/components/admin/ui";
import { signatureHtml, type Signature } from "@/lib/mail/signature";

const fields: { key: keyof Signature; label: string; placeholder: string; type?: string; autoComplete?: string }[] = [
  { key: "closing", label: "Sign-off", placeholder: "Kind regards," },
  { key: "name", label: "Name", placeholder: "Jane Wanjiku", autoComplete: "name" },
  { key: "title", label: "Job title", placeholder: "Head of Sales", autoComplete: "organization-title" },
  { key: "company", label: "Company", placeholder: "Mavqo Digital", autoComplete: "organization" },
  { key: "phone", label: "Phone", placeholder: "+254 712 345 678", type: "tel", autoComplete: "tel" },
  { key: "email", label: "Email", placeholder: "jane@company.co.ke", type: "email", autoComplete: "email" },
  { key: "website", label: "Website", placeholder: "https://mavqodigital.co.ke", type: "url", autoComplete: "url" },
];

/**
 * Structured signature fields with a live preview of exactly what recipients
 * see. `prefix` namespaces the inputs when embedded in a larger form.
 */
export function SignatureEditor({ initial, prefix = "", errors }: { initial: Signature; prefix?: string; errors?: Record<string, string> }) {
  const [sig, setSig] = useState<Signature>(initial);
  const html = signatureHtml(sig);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field
            key={f.key}
            name={`${prefix}${f.key}`}
            label={f.label}
            optional
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            autoComplete={f.autoComplete}
            defaultValue={initial[f.key]}
            maxLength={f.key === "website" ? 200 : 120}
            error={errors?.[f.key]}
            className={f.key === "closing" ? "sm:col-span-2" : undefined}
            onChange={(e) => setSig((s) => ({ ...s, [f.key]: e.target.value }))}
          />
        ))}
      </div>
      <div>
        <p className="mb-1.5 text-sm font-bold text-heading">Preview</p>
        <div className="rounded-[var(--radius-md)] border border-line bg-white p-5">
          <p className="text-sm text-[#3a4659]">Hi Peter,</p>
          <p className="mt-2 text-sm text-[#3a4659]">Thanks for getting in touch — I&apos;ve attached the proposal we discussed.</p>
          {html ? (
            // Every value in the signature HTML is escaped (see signatureHtml).
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="mt-6 text-sm italic text-[#667085]">Fill in the fields to build your signature.</p>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-soft">This is how it looks in your recipient&apos;s inbox.</p>
      </div>
    </div>
  );
}
