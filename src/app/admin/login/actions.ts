"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { startSession } from "@/lib/auth/session";
import { DUMMY_HASH, verifyPassword } from "@/lib/security/password";
import { getClientIpHash } from "@/lib/security/request";

export type LoginState = { error?: string };

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const IP_LIMIT = { attempts: 20, windowMinutes: 15 };
const GENERIC_ERROR = "Incorrect email or password.";

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

async function lockAccount(userId: string) {
  await db().user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) },
  });
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const { email, password } = parsed.data;
  const ipHash = await getClientIpHash();
  const client = db();

  // Per-network throttle, independent of which account is targeted.
  if (ipHash) {
    const since = new Date(Date.now() - IP_LIMIT.windowMinutes * 60_000);
    const recent = await client.auditLog.count({ where: { action: "login_failed", ipHash, createdAt: { gte: since } } });
    if (recent >= IP_LIMIT.attempts) return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const user = await client.user.findUnique({ where: { email } });
  const locked = { error: "This account is temporarily locked after several failed attempts. Please try again later." };

  // Count the attempt before checking the password, in one conditional write,
  // so parallel requests can't each get a guess in before the lock lands.
  let attempt: number | null = null;
  if (user) {
    const now = new Date();
    attempt = await client.user
      .update({
        where: { id: user.id, OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] },
        data: { failedLogins: { increment: 1 } },
        select: { failedLogins: true },
      })
      .then((u) => u.failedLogins)
      .catch((err) => {
        // P2025 = no row matched the lock condition: the account is locked.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return null;
        throw err;
      });
    if (attempt === null || attempt > MAX_FAILED) {
      if (attempt !== null) await lockAccount(user.id);
      await audit({ action: "login_blocked_locked", actorId: user.id, ipHash });
      return locked;
    }
  }

  // Always run the hash, so timing doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active || !valid) {
    if (user && attempt !== null && attempt >= MAX_FAILED) await lockAccount(user.id);
    await audit({ action: "login_failed", actorId: user?.id ?? null, ipHash, metadata: { reason: !user ? "unknown_email" : !user.active ? "inactive" : "bad_password" } });
    return { error: GENERIC_ERROR };
  }

  await client.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await audit({ action: "login_succeeded", actorId: user.id, ipHash });
  await startSession(user, ipHash);
  redirect("/admin/leads/");
}
