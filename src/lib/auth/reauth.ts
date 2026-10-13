import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyPassword } from "@/lib/security/password";
import { getClientIpHash } from "@/lib/security/request";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

export type ReauthResult = { ok: true } | { ok: false; error: string };

/**
 * Step-up check before sensitive changes (password, API keys, inbox
 * connection): the signed-in user re-enters their password. Failures are
 * throttled per user, so a hijacked session can't be used to guess it.
 */
export async function confirmPassword(userId: string, password: unknown): Promise<ReauthResult> {
  if (typeof password !== "string" || !password || password.length > 200) {
    return { ok: false, error: "Enter your current password to confirm." };
  }
  const client = db();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const failures = await client.auditLog.count({ where: { action: "reauth_failed", actorId: userId, createdAt: { gte: since } } });
  if (failures >= MAX_FAILURES) {
    return { ok: false, error: "Too many incorrect attempts. Please wait 15 minutes and try again." };
  }
  const user = await client.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (user && (await verifyPassword(password, user.passwordHash))) return { ok: true };
  await audit({ action: "reauth_failed", actorId: userId, ipHash: await getClientIpHash() });
  return { ok: false, error: "That password isn't correct." };
}
