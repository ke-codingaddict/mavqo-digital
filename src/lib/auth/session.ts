import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { can, type Permission, type Role } from "./permissions";
import {
  IDLE_TIMEOUT_SECONDS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  isSessionLive,
  signSession,
  verifySession,
} from "./session-token";

export type AdminUser = { id: string; name: string; email: string; role: Role; sessionId: string };

/**
 * The cookie lives only as long as the idle window and is re-issued on each
 * keep-alive, so a browser left closed past the timeout no longer holds it.
 */
async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: IDLE_TIMEOUT_SECONDS,
  });
}

export async function startSession(user: { id: string; role: Role }, ipHash: string | null) {
  const now = Date.now();
  const client = db();
  // Housekeeping: drop sessions that ended over a month ago.
  await client.adminSession.deleteMany({ where: { expiresAt: { lt: new Date(now - 30 * 86_400_000) } } });
  const session = await client.adminSession.create({
    data: { userId: user.id, ipHash, expiresAt: new Date(now + SESSION_TTL_SECONDS * 1000) },
    select: { id: true },
  });
  await setSessionCookie(await signSession({ sub: user.id, role: user.role, sid: session.id }, getServerEnv().AUTH_SECRET));
}

/** Revokes the current session server-side and clears the cookie. */
export async function endSession() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value, getServerEnv().AUTH_SECRET);
  if (session) {
    await db().adminSession.updateMany({ where: { id: session.sid, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Records user activity: extends the idle window if the session is still live.
 * Returns false when the session has already ended (idle, revoked or expired).
 */
export async function touchSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, getServerEnv().AUTH_SECRET);
  if (!session || !token) return false;
  const now = new Date();
  // One conditional write, so a session that just went idle can't be revived.
  const { count } = await db().adminSession.updateMany({
    where: {
      id: session.sid,
      userId: session.sub,
      revokedAt: null,
      expiresAt: { gt: now },
      lastSeenAt: { gt: new Date(now.getTime() - IDLE_TIMEOUT_SECONDS * 1000) },
      user: { active: true },
    },
    data: { lastSeenAt: now },
  });
  if (count === 0) return false;
  await setSessionCookie(token);
  return true;
}

/**
 * Data access layer: verifies the signed cookie AND the stored session (not
 * revoked, not idle past the timeout, not expired) AND that the account is
 * still active. Every admin page, action and route calls this.
 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, getServerEnv().AUTH_SECRET);
  if (!session) return null;
  const stored = await db().adminSession.findUnique({
    where: { id: session.sid },
    select: {
      userId: true,
      lastSeenAt: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
    },
  });
  if (!stored || stored.userId !== session.sub || !isSessionLive(stored) || !stored.user.active) return null;
  const { user } = stored;
  return { id: user.id, name: user.name, email: user.email, role: user.role, sessionId: session.sid };
});

/** Redirects to login when signed out, and back to the inbox when the role lacks permission. */
export async function requireUser(permission?: Permission): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login/");
  if (permission && !can(user.role, permission)) redirect("/admin/leads/?denied=1");
  return user;
}
