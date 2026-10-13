"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, CircleAlert, CircleCheck, Copy, LoaderCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shared building blocks for admin pages. */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-heading">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  icon,
  aside,
  children,
  className,
  id,
}: {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby={id && title ? `${id}-title` : undefined} className={cn("rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm", className)}>
      {title && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            {icon && <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-teal-wash text-teal-ink [&_svg]:size-4.5">{icon}</span>}
            <div>
              <h2 id={id ? `${id}-title` : undefined} className="text-base font-bold text-heading">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
            </div>
          </div>
          {aside}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

type PillTone = "success" | "warning" | "danger" | "neutral" | "info";
const pillTones: Record<PillTone, string> = {
  success: "bg-success-wash text-success",
  warning: "bg-warning-wash text-warning",
  danger: "bg-danger-wash text-danger",
  neutral: "bg-surface-2 text-ink-soft ring-1 ring-inset ring-line",
  info: "bg-teal-wash text-teal-ink",
};

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", pillTones[tone])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Submit button that shows progress while its form's action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "sm",
  className,
  ...props
}: { pendingLabel?: string; variant?: Parameters<typeof buttonClasses>[0]; size?: Parameters<typeof buttonClasses>[1] } & ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} aria-busy={pending || undefined} className={buttonClasses(variant, size, className)} {...props}>
      {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Inline result of a form action. */
export function FormMessage({ state }: { state: { status: string; message?: string } }) {
  if (!state.message || state.status === "idle") return null;
  const success = state.status === "success";
  return (
    <p
      role={success ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium",
        success ? "bg-success-wash text-success" : "bg-danger-wash text-danger",
      )}
    >
      {success ? <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
      {state.message}
    </p>
  );
}

/** Accessible on/off switch backed by a checkbox, so it submits with the form. */
export function Switch({ name, defaultChecked, label, description }: { name: string; defaultChecked?: boolean; label: string; description?: string }) {
  const id = `sw-${name}`;
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <label htmlFor={id} className="text-sm font-bold text-heading">{label}</label>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
      <span className="relative inline-flex shrink-0">
        <input id={id} name={name} type="checkbox" role="switch" defaultChecked={defaultChecked} className="peer sr-only" />
        <span
          aria-hidden="true"
          className="h-6 w-11 rounded-full bg-line-strong transition-colors peer-checked:bg-teal peer-focus-visible:ring-4 peer-focus-visible:ring-teal/25"
        />
        <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </div>
  );
}

/** Copies a value (e.g. a DNS record) with feedback. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true), () => undefined)}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-heading"
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check aria-hidden="true" className="size-3.5 text-success" /> : <Copy aria-hidden="true" className="size-3.5" />}
    </button>
  );
}

export const inputClass =
  "block w-full rounded-[var(--radius-md)] border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-heading transition-[border-color,box-shadow] placeholder:text-ink-soft/70 hover:border-ink-soft/50 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/20 aria-[invalid=true]:border-danger";

/** Compact labelled input for dense admin forms. */
export function Field({
  name,
  label,
  hint,
  error,
  className,
  optional,
  ...props
}: { name: string; label: string; hint?: ReactNode; error?: string; optional?: boolean } & ComponentProps<"input">) {
  const id = props.id ?? `fld-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-heading">
        {label}
        {optional && <span className="font-normal text-ink-soft"> · optional</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}

/**
 * Runs `onChange` during render when an action's result changes — React's
 * recommended alternative to setting state in an effect.
 */
export function useOnStateChange<T>(state: T, onChange: (state: T) => void) {
  const [prev, setPrev] = useState(state);
  if (state !== prev) {
    setPrev(state);
    onChange(state);
  }
}
