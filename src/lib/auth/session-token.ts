import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./permissions";

/**
 * Signed session token (HS256). Edge-safe: no Node or database imports, so the
 * proxy can use it for optimistic checks. Authoritative checks — including the
 * inactivity timeout and revocation — happen in the data access layer
 * (src/lib/auth/session.ts) against the admin_sessions table.
 */

export const SESSION_COOKIE = "mavqo_admin_session";
/** Hard cap on a sign-in, however active the user is. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
/** Admin sessions end after this long without user activity. */
export const IDLE_TIMEOUT_SECONDS = 5 * 60;

export type SessionPayload = { sub: string; role: Role; sid: string };

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ role: payload.role, sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("mavqo-admin")
    .sign(key(secret));
}

export async function verifySession(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], audience: "mavqo-admin" });
    const { role, sid } = payload;
    if (typeof payload.sub !== "string" || typeof sid !== "string" || (role !== "admin" && role !== "sales")) return null;
    return { sub: payload.sub, role, sid };
  } catch {
    return null;
  }
}

type SessionRecord = { lastSeenAt: Date; expiresAt: Date; revokedAt: Date | null };

/** A stored session is usable while it's unrevoked, unexpired and was active within the idle window. */
export function isSessionLive(s: SessionRecord, now = Date.now()): boolean {
  return !s.revokedAt && s.expiresAt.getTime() > now && now - s.lastSeenAt.getTime() < IDLE_TIMEOUT_SECONDS * 1000;
}
