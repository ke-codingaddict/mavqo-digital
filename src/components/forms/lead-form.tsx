"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { submitLead, type LeadFormState } from "@/app/actions/submit-lead";
import { leadOptions } from "@/content/industries";
import { readAttribution, track } from "@/lib/analytics/events";
import { conversionEvents } from "@/lib/leads/labels";
import { validateLead, type EnquiryTypeValue, type FieldErrors } from "@/lib/validation/lead";
import { ArrowIcon, Button } from "@/components/ui/button";
import { RadioGroupField, SelectField, TextAreaField, TextField } from "./fields";

type Option = { value: string; label: string };

export type LeadFormProps = {
  type: EnquiryTypeValue;
  /** Products a demo (or waitlist) can be requested for. */
  productOptions?: Option[];
  /** Services a quote can be requested for. */
  serviceOptions?: Option[];
  defaultProduct?: string;
  defaultService?: string;
  /** Hide the product picker when the page is already about one product. */
  lockProduct?: boolean;
  submitLabel?: string;
  compact?: boolean;
};

const defaultLabels: Record<EnquiryTypeValue, string> = {
  demo: "Request my demo",
  quote: "Request my quote",
  marketing: "Book my free consultation",
  contact: "Send message",
  waitlist: "Join the early-access list",
};

const initialState: LeadFormState = { status: "idle" };

export function LeadForm({
  type,
  productOptions = [],
  serviceOptions = [],
  defaultProduct,
  defaultService,
  lockProduct,
  submitLabel,
  compact,
}: LeadFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitLead, initialState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const mountedAt = useRef(0);
  const fillMsRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      if (state.reference) track(conversionEvents[type], { enquiry_type: type, page: window.location.pathname });
      const params = new URLSearchParams({ type });
      if (state.reference) params.set("ref", state.reference);
      router.push(`/thank-you/?${params}`);
    }
    if (state.status === "error") errorSummaryRef.current?.focus();
  }, [state, type, router]);

  const serverErrors = state.status === "error" ? (state.errors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const errorCount = Object.keys(errors).length;

  // Before hydration the form still posts natively via `action`. Once hydrated we
  // validate first, then dispatch manually — this also avoids React's automatic
  // form reset, so nothing the visitor typed is lost if the server reports an error.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fillMsRef.current) fillMsRef.current.value = String(Date.now() - mountedAt.current);
    const formData = new FormData(e.currentTarget);
    formData.set("sourcePage", window.location.pathname);
    for (const [key, value] of Object.entries(readAttribution())) if (value) formData.set(key, value);
    const result = validateLead(Object.fromEntries(formData.entries()));
    if (!result.success) {
      setClientErrors(result.errors);
      requestAnimationFrame(() => {
        const first = Object.keys(result.errors)[0];
        formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      });
      return;
    }
    setClientErrors({});
    startTransition(() => formAction(formData));
  }

  const clearError = (name: keyof FieldErrors) => () => {
    if (!clientErrors[name]) return;
    setClientErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const showProduct = (type === "demo" || type === "waitlist") && !lockProduct;
  const showService = type === "quote" || type === "marketing";
  const isMarketing = type === "marketing" || (type === "quote" && defaultService !== undefined);
  const grid = compact ? "grid gap-4" : "grid gap-5 sm:grid-cols-2";

  // Optional fields live in a disclosure to keep the form short; it opens itself if one of them has an error.
  const optionalFields = ["organizationSize", "budgetRange", "websiteUrl", "timeline", "objective", "preferredContact"] as const;
  const optionalHasError = optionalFields.some((f) => errors[f]);
  const hasOptional = type !== "contact" && type !== "waitlist";

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="space-y-6">
      {state.status === "error" && (
        <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-md)] bg-danger-wash p-4 text-sm text-danger">
          <p className="font-bold">{state.message}</p>
        </div>
      )}
      {state.status !== "error" && errorCount > 0 && (
        <p role="alert" className="rounded-[var(--radius-md)] bg-danger-wash px-4 py-3 text-sm font-bold text-danger">
          Almost there — please fix {errorCount === 1 ? "1 field" : `${errorCount} fields`} below.
        </p>
      )}

      <input type="hidden" name="enquiryType" value={type} />
      <input ref={fillMsRef} type="hidden" name="fill_ms" defaultValue="" />
      {lockProduct && defaultProduct && <input type="hidden" name="productInterest" value={defaultProduct} />}
      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="company_website">Leave this field empty</label>
        <input id="company_website" type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={grid}>
        <TextField name="name" label="Your name" required autoComplete="name" error={errors.name} onChange={clearError("name")} />
        <TextField
          name="organization"
          label={type === "demo" ? "School / business name" : "Business name"}
          required={type === "demo"}
          autoComplete="organization"
          error={errors.organization}
          onChange={clearError("organization")}
        />
        <TextField
          name="phone"
          type="tel"
          label="Phone / WhatsApp"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0712 345 678"
          error={errors.phone}
          onChange={clearError("phone")}
        />
        <TextField
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@business.co.ke"
          error={errors.email}
          onChange={clearError("email")}
        />
        <p className={compact ? "-mt-2 text-sm text-ink-soft" : "-mt-2 text-sm text-ink-soft sm:col-span-2"}>
          Phone or email — whichever you prefer. You don&apos;t need both.
        </p>

        {showProduct && (
          <SelectField
            name="productInterest"
            label="Which system?"
            required
            options={productOptions}
            defaultValue={defaultProduct}
            error={errors.productInterest}
            onChange={clearError("productInterest")}
            className={compact ? undefined : "sm:col-span-2"}
          />
        )}

        {showService && (
          <SelectField
            name="serviceInterest"
            label="What do you need help with?"
            required
            options={serviceOptions}
            defaultValue={defaultService}
            error={errors.serviceInterest}
            onChange={clearError("serviceInterest")}
            className={compact ? undefined : "sm:col-span-2"}
          />
        )}
      </div>

      {type !== "waitlist" && (
        <TextAreaField
          name="message"
          label={type === "contact" ? "How can we help?" : "Anything we should know?"}
          required={type === "contact"}
          rows={compact ? 3 : 4}
          placeholder={type === "contact" ? "Tell us a little about what you need…" : "e.g. number of students, branches, or what you'd like to achieve"}
          error={errors.message}
          onChange={clearError("message")}
        />
      )}

      {hasOptional && (
        <details open={optionalHasError || undefined} className="group rounded-[var(--radius-md)] bg-surface-2 px-4 ring-1 ring-inset ring-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[0.9375rem] font-bold text-heading [&::-webkit-details-marker]:hidden">
            <span>
              Add more details <span className="font-normal text-ink-soft">— optional, helps us prepare</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-5 pb-5 pt-1">
            <div className={grid}>
              {type === "demo" && (
                <SelectField name="organizationSize" label="Organization size" options={leadOptions.organizationSize} error={errors.organizationSize} />
              )}
              {showService && <SelectField name="budgetRange" label="Budget range" options={leadOptions.budgetRange} error={errors.budgetRange} />}
              {(isMarketing || type === "quote") && (
                <TextField name="websiteUrl" label="Current website" placeholder="yourbusiness.co.ke" inputMode="url" autoComplete="url" error={errors.websiteUrl} onChange={clearError("websiteUrl")} />
              )}
              <SelectField name="timeline" label="When do you want to start?" options={leadOptions.timeline} error={errors.timeline} />
              {isMarketing && (
                <TextField name="objective" label="Main goal" placeholder="e.g. more enquiries from Google" error={errors.objective} className={compact ? undefined : "sm:col-span-2"} />
              )}
            </div>
            {!compact && <RadioGroupField name="preferredContact" label="How should we contact you?" options={leadOptions.preferredContact} error={errors.preferredContact} />}
          </div>
        </details>
      )}

      <div>
        <label className="flex items-start gap-3 text-[0.9375rem] text-ink">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-4.5 shrink-0 rounded accent-[var(--teal)]"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            onChange={clearError("consent")}
          />
          <span>
            Mavqo Digital may contact me about this enquiry. See our{" "}
            <Link href="/privacy-policy/" className="font-bold text-teal-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1.5 text-sm font-bold text-danger">
            ⚠ {errors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              {submitLabel ?? defaultLabels[type]} <ArrowIcon />
            </>
          )}
        </Button>
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Lock aria-hidden="true" className="size-3.5" /> Private &amp; secure. No spam, ever.
        </p>
      </div>
    </form>
  );
}
