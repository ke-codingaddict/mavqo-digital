import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-[var(--radius-md)] border border-line-strong bg-surface px-4 py-3 text-base text-heading transition-[border-color,box-shadow] placeholder:text-ink-soft/70 hover:border-ink-soft/50 focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/20 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FieldShell({ id, label, required, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-heading">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true"> *</span>
        ) : (
          <span className="font-normal text-ink-soft"> · optional</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-danger">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type Common = { name: string; label: string; required?: boolean; hint?: string; error?: string; className?: string };

export function TextField({ name, label, required, hint, error, className, ...props }: Common & ComponentProps<"input">) {
  const id = `f-${name}`;
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <input
        id={id}
        name={name}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={control}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({ name, label, required, hint, error, className, ...props }: Common & ComponentProps<"textarea">) {
  const id = `f-${name}`;
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        name={name}
        rows={4}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "min-h-28 resize-y")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  required,
  hint,
  error,
  className,
  options,
  placeholder = "Select…",
  ...props
}: Common & { options: readonly { value: string; label: string }[]; placeholder?: string } & ComponentProps<"select">) {
  const id = `f-${name}`;
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div className="relative">
      <select
        id={id}
        name={name}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "appearance-none pr-10")}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
      </div>
    </FieldShell>
  );
}

export function RadioGroupField({
  name,
  label,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  error?: string;
}) {
  const id = `f-${name}`;
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1.5 block text-sm font-bold text-heading">
        {label} <span className="font-normal text-ink-soft">· optional</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="relative inline-flex cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-bold text-ink transition-colors hover:border-ink-soft/60 has-[:checked]:border-teal has-[:checked]:bg-teal-wash has-[:checked]:text-teal-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-teal/25"
          >
            <input type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-bold text-danger">
          ⚠ {error}
        </p>
      )}
    </fieldset>
  );
}
