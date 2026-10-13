"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { LEAD_STATUSES, leadStatusLabels } from "@/lib/leads/labels";
import { Button } from "@/components/ui/button";
import { updateLead, type SaveState } from "../../../actions";

export function LeadUpdateForm({ leadId, status, notes }: { leadId: string; status: string; notes: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(updateLead, { status: "idle" });

  useEffect(() => {
    if (state.status === "saved") router.refresh();
  }, [state, router]);

  // Dispatch manually so React doesn't reset the fields after saving.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <div>
        <label htmlFor="status" className="mb-1.5 block text-sm font-bold text-heading">Status</label>
        <select id="status" name="status" defaultValue={status} className="w-full rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2.5 text-sm text-heading">
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{leadStatusLabels[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="internalNotes" className="mb-1.5 block text-sm font-bold text-heading">Internal notes</label>
        <textarea
          id="internalNotes"
          name="internalNotes"
          defaultValue={notes}
          rows={6}
          placeholder="Call notes, next steps, proposal details…"
          className="w-full rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2.5 text-sm text-heading"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Save changes
        </Button>
        <p role="status" className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
