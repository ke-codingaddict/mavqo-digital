"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/ui";
import { SignatureEditor } from "@/components/admin/signature-editor";
import type { Signature } from "@/lib/mail/signature";
import { saveSignature, type FormState } from "./actions";

export function SignatureForm({ initial }: { initial: Signature }) {
  const [state, action] = useActionState<FormState, FormData>(saveSignature, { status: "idle" });
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <SignatureEditor initial={initial} errors={state.errors} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save signature</SubmitButton>
      </div>
    </form>
  );
}
