"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { sendCompose, type ComposeState } from "@/app/admin/(protected)/mail/actions";
import { BodyField, CheckOption, ComposerRow, bareInput, useIdempotencyKey } from "./composer-fields";

export function ComposeForm({ to, subject, leadId, hasSignature }: { to?: string; subject?: string; leadId?: string; hasSignature: boolean }) {
  const [state, action] = useActionState<ComposeState, FormData>(sendCompose, { status: "idle" });
  const [showCc, setShowCc] = useState(false);
  const key = useIdempotencyKey();
  const e = state.errors ?? {};
  return (
    <form action={action} className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm">
      <input type="hidden" name="idempotencyKey" value={key} />
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h1 className="text-lg font-black text-heading">New message</h1>
        {!showCc && (
          <button type="button" onClick={() => setShowCc(true)} className="text-xs font-bold text-ink-soft hover:text-heading">
            Add Cc
          </button>
        )}
      </div>
      <ComposerRow id="c-to" label="To" error={e.to}>
        <input id="c-to" name="to" defaultValue={to} required placeholder="name@company.co.ke" className={bareInput} autoComplete="email" aria-invalid={e.to ? true : undefined} />
      </ComposerRow>
      {showCc && (
        <ComposerRow id="c-cc" label="Cc" error={e.cc}>
          <input id="c-cc" name="cc" placeholder="Separate addresses with commas" className={bareInput} />
        </ComposerRow>
      )}
      <ComposerRow id="c-subject" label="Subject" error={e.subject}>
        <input id="c-subject" name="subject" defaultValue={subject} required maxLength={250} className={bareInput} aria-invalid={e.subject ? true : undefined} />
      </ComposerRow>
      <BodyField name="body" placeholder="Write your message…" error={e.body} rows={14} />
      <div className="flex flex-col gap-3 border-t border-line bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <CheckOption name="includeSignature" label="Include my signature" defaultChecked={hasSignature} />
          {!hasSignature && (
            <Link href="/admin/account/#signature" className="font-bold text-teal-ink hover:underline">
              Set up signature
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/mail/" className="h-9 px-3 text-sm font-bold leading-9 text-ink-soft hover:text-heading">Discard</Link>
          <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
        </div>
      </div>
      {state.status === "error" && (
        <div className="px-4 pb-3">
          <FormMessage state={state} />
        </div>
      )}
    </form>
  );
}
