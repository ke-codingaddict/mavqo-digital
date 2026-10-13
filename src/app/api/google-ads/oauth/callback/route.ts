import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getServerEnv } from "@/lib/env";
import { hashIp, pickForwardedIp } from "@/lib/security/request";
import { getGoogleAdsConfig, oauthRedirectUri, saveGoogleAdsSecrets, saveGoogleAdsSettings } from "@/lib/google-ads/config";
import { exchangeCode, GoogleAdsError, revokeToken } from "@/lib/google-ads/client";
import { OAUTH_NONCE_COOKIE, verifyOAuthState } from "@/lib/google-ads/oauth-state";

/**
 * Google sends the browser here after the admin approves access. The admin
 * session cookie is SameSite=strict, so it isn't sent on this cross-site
 * return; instead the signed `state` names the session that started the flow,
 * and a Lax nonce cookie proves it's the same browser.
 *
 * The response is a tiny page that navigates on to Settings, so that next
 * request is same-site and carries the session cookie again.
 */

const SETTINGS = "/admin/settings/?tab=google-ads";

function finish(params: Record<string, string>) {
  const target = `${SETTINGS}&${new URLSearchParams(params)}`;
  const html = `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target.replace(/&/g, "&amp;")}"><title>Google Ads</title><p style="font-family:system-ui;padding:2rem">Returning to Settings… <a href="${target.replace(/&/g, "&amp;")}">Continue</a></p>`;
  const res = new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  res.cookies.delete({ name: OAUTH_NONCE_COOKIE, path: "/api/google-ads/oauth/" });
  return res;
}

function sameNonce(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const sp = request.nextUrl.searchParams;

  const state = await verifyOAuthState(sp.get("state"), env.AUTH_SECRET);
  if (!state || !sameNonce(request.cookies.get(OAUTH_NONCE_COOKIE)?.value, state.nonce)) {
    return finish({ error: "expired" });
  }

  // The session that started the flow must still be valid and belong to an active admin.
  const session = await db().adminSession.findUnique({
    where: { id: state.sid },
    select: { userId: true, revokedAt: true, expiresAt: true, user: { select: { role: true, active: true } } },
  });
  if (!session || session.userId !== state.sub || session.revokedAt || session.expiresAt <= new Date() || !session.user.active || session.user.role !== "admin") {
    return finish({ error: "session" });
  }

  const googleError = sp.get("error");
  if (googleError) {
    return finish({ error: googleError === "access_denied" ? "denied" : "google" });
  }
  const code = sp.get("code");
  if (!code || code.length > 2000) return finish({ error: "google" });

  const config = await getGoogleAdsConfig();
  if (!config.clientId || !config.clientSecret) return finish({ error: "client" });

  try {
    const { refreshToken, email } = await exchangeCode(config.clientId, config.clientSecret, code, oauthRedirectUri());
    if (config.refreshToken && config.refreshToken !== refreshToken) await revokeToken(config.refreshToken);
    await saveGoogleAdsSecrets({ refreshToken }, state.sub);
    await saveGoogleAdsSettings({ connectedEmail: email, connectedAt: new Date().toISOString(), lastConnectError: undefined }, state.sub);
    await audit({
      action: "google_ads_connected",
      actorId: state.sub,
      entityType: "setting",
      entityId: "google_ads",
      metadata: { email: email ?? null },
      ipHash: hashIp(pickForwardedIp(request.headers.get("x-forwarded-for"), env.TRUSTED_PROXY_HOPS)),
    });
    return finish({ connected: "1" });
  } catch (err) {
    // Only fixed codes go in the URL; the detailed message is kept for the Settings page to show.
    const message = err instanceof GoogleAdsError ? err.message : "Couldn't finish connecting. Please try again.";
    await saveGoogleAdsSettings({ lastConnectError: message }, state.sub);
    return finish({ error: "exchange" });
  }
}
