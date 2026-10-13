"use client";

import { useState, type ReactNode } from "react";
import { inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/** A labelled row in the composer header (To, Cc, Subject). */
export function ComposerRow({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="border-b border-line">
      <div className="flex items-center gap-3 px-4">
        <label htmlFor={id} className="w-16 shrink-0 text-sm font-bold text-ink-soft">{label}</label>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error && <p id={`${id}-error`} className="px-4 pb-2 pl-23 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}

export const bareInput = "block w-full bg-transparent py-3 text-sm text-heading placeholder:text-ink-soft/70 focus:outline-none";

export function BodyField({ name, placeholder, error, defaultValue, rows = 10 }: { name: string; placeholder: string; error?: string; defaultValue?: string; rows?: number }) {
  return (
    <div>
      <label htmlFor={`c-${name}`} className="sr-only">Message</label>
      <textarea
        id={`c-${name}`}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, "resize-y rounded-none border-0 px-4 py-4 text-[0.9375rem] leading-relaxed focus:ring-0")}
        maxLength={50_000}
        required
      />
      {error && <p className="px-4 pb-2 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}

/** Stable per-mount key so a double-click or retry never sends the same message twice. */
export function useIdempotencyKey() {
  const [key] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())));
  return key;
}

export function CheckOption({ name, label, defaultChecked = true, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink" title={hint}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[var(--teal)]" />
      {label}
    </label>
  );
}
