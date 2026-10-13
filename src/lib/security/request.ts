import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServerEnv } from "@/lib/env";

/**
 * Picks the client IP out of an X-Forwarded-For chain. Each proxy appends the
 * address it received the request from, so only the entries added by our own
 * proxies can be trusted; anything to their left may be forged by the client.
 * With `trustedHops` proxies in front of the app, the client is the
 * `trustedHops`-th entry from the right.
 */
export function pickForwardedIp(forwardedFor: string | null, trustedHops: number): string | null {
  if (!forwardedFor || trustedHops < 1) return null;
  const chain = forwardedFor.split(",").map((s) => s.trim()).filter(Boolean);
  return chain[chain.length - trustedHops] ?? chain[0] ?? null;
}

/** Best-effort client IP from proxy headers. Never stored raw. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return pickForwardedIp(h.get("x-forwarded-for"), getServerEnv().TRUSTED_PROXY_HOPS) || h.get("x-real-ip") || null;
}

/** Salted SHA-256 of the IP: enough for rate limiting, useless for tracking. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${getServerEnv().IP_HASH_SALT}:${ip}`).digest("hex");
}

export async function getClientIpHash() {
  return hashIp(await getClientIp());
}
