/** Google Ads customer IDs. Dependency-free, so client components can use it too. */

/** Accepts 123-456-7890, 123 456 7890 or 1234567890; returns the 10 digits or null. */
export function normalizeCustomerId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/[\s-]/g, "");
  return /^\d{10}$/.test(digits) ? digits : null;
}

export function formatCustomerId(id: string): string {
  return id.length === 10 ? `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}` : id;
}
