/** Client logos: stored in the database, served by /admin/ads/[id]/logo. */

export const LOGO_MAX_BYTES = 512 * 1024;
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * Identifies an image by its first bytes rather than trusting the browser's
 * MIME type. SVG is deliberately not accepted — it can carry script.
 */
export function sniffLogoType(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, j) => bytes[i + j] === b);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

/** Logo URL for an account, versioned so a new upload isn't hidden by the browser cache. */
export function logoUrl(account: { id: string; logoType: string | null; logoUpdatedAt: Date | null }): string | null {
  if (!account.logoType) return null;
  return `/admin/ads/${account.id}/logo/?v=${account.logoUpdatedAt?.getTime() ?? 0}`;
}
