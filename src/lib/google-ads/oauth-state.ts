import { SignJWT, jwtVerify } from "jose";

/**
 * The OAuth `state` for connecting Google Ads: signed, short-lived, and tied
 * to both the admin session that started it and a nonce held in a cookie, so
 * a callback can't be forged or replayed into someone else's browser.
 */

export const OAUTH_NONCE_COOKIE = "mavqo_ads_oauth";
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const AUDIENCE = "mavqo-google-ads-oauth";

export type OAuthState = { sub: string; sid: string; nonce: string };

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signOAuthState(state: OAuthState, secret: string): Promise<string> {
  return new SignJWT({ sid: state.sid, nonce: state.nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(state.sub)
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_STATE_TTL_SECONDS}s`)
    .setAudience(AUDIENCE)
    .sign(key(secret));
}

export async function verifyOAuthState(token: string | null | undefined, secret: string): Promise<OAuthState | null> {
  if (!token || token.length > 2000) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], audience: AUDIENCE });
    const { sid, nonce, sub } = payload;
    if (typeof sub !== "string" || typeof sid !== "string" || typeof nonce !== "string") return null;
    return { sub, sid, nonce };
  } catch {
    return null;
  }
}
