"use client";

import { useActionState, useState } from "react";
import { Reply } from "lucide-react";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { sendReply, type ComposeState } from "@/app/admin/(protected)/mail/actions";
import { BodyField, CheckOption, ComposerRow, bareInput, useIdempotencyKey } from "./composer-fields";

export function ReplyForm({ threadId, to, hasSignature }: { threadId: string; to: string; hasSignature: boolean }) {
  const [state, action] = useActionState<ComposeState, FormData>(sendReply, { status: "idle" });
  const [showCc, setShowCc] = useState(false);
  const key = useIdempotencyKey();
  return (
    <form action={action} className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm focus-within:border-teal/60 focus-within:ring-4 focus-within:ring-teal/10">
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Reply aria-hidden="true" className="size-4" /> Reply to <strong className="text-heading">{to}</strong>
        </p>
        {!showCc && (
          <button type="button" onClick={() => setShowCc(true)} className="text-xs font-bold text-ink-soft hover:text-heading">
            Add Cc
          </button>
        )}
      </div>
      {showCc && (
        <ComposerRow id="r-cc" label="Cc" error={state.errors?.cc}>
          <input id="r-cc" name="cc" placeholder="colleague@company.co.ke" className={bareInput} autoComplete="email" />
        </ComposerRow>
      )}
      <BodyField name="body" placeholder="Write your reply…" error={state.errors?.body} rows={7} />
      <div className="flex flex-col gap-3 border-t border-line bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <CheckOption name="includeSignature" label={hasSignature ? "Include my signature" : "Include signature (not set up yet)"} defaultChecked={hasSignature} />
          <CheckOption name="includeQuote" label="Quote previous message" />
        </div>
        <SubmitButton pendingLabel="Sending…">Send reply</SubmitButton>
      </div>
      {state.status === "error" && (
        <div className="px-4 pb-3">
          <FormMessage state={state} />
        </div>
      )}
    </form>
  );
}
