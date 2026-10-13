import { getDemoableProducts, getPublicProducts, isAvailable } from "./products";
import { getPublishedServices } from "./services";

/** Products a demo can be booked for (available + demoable only). */
export function demoProductOptions() {
  return getDemoableProducts().map((p) => ({ value: p.slug, label: p.name }));
}

/** Everything a quote/consultation can be requested for. */
export function quoteServiceOptions() {
  return [
    ...getPublishedServices().map((s) => ({ value: s.slug, label: s.name })),
    ...getPublicProducts()
      .filter(isAvailable)
      .map((p) => ({ value: p.slug, label: p.name })),
    { value: "not-sure", label: "Not sure yet — I'd like advice" },
  ];
}

/** Human label for any product/service slug stored on a lead. */
export function interestLabel(slug: string | null | undefined) {
  if (!slug) return null;
  if (slug === "not-sure") return "Not sure yet";
  return (
    getPublicProducts().find((p) => p.slug === slug)?.name ??
    getPublishedServices().find((s) => s.slug === slug)?.name ??
    slug
  );
}
