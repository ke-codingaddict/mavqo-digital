"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LeadForm, type LeadFormProps } from "./lead-form";

function WithQuery({ param, ...props }: LeadFormProps & { param: "product" | "service" }) {
  const value = useSearchParams().get(param) ?? undefined;
  const options = param === "product" ? props.productOptions : props.serviceOptions;
  // Only pre-select values that exist in the option list.
  const preset = options?.some((o) => o.value === value) ? value : undefined;
  return (
    <LeadForm
      key={preset ?? "none"}
      {...props}
      {...(param === "product" ? { defaultProduct: preset } : { defaultService: preset })}
    />
  );
}

/**
 * Lead form that pre-selects a product/service from the URL
 * (e.g. /request-demo/?product=pos-system-kenya), so ads and internal links
 * can land visitors on a ready-to-submit form. The page itself stays static.
 */
export function QueryLeadForm(props: LeadFormProps & { param: "product" | "service" }) {
  const fallbackProps: LeadFormProps = { ...props };
  delete (fallbackProps as { param?: string }).param;
  return (
    <Suspense fallback={<LeadForm {...fallbackProps} />}>
      <WithQuery {...props} />
    </Suspense>
  );
}
