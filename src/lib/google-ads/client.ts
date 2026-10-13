import "server-only";
import { createHash } from "node:crypto";
import type { GoogleAdsConfig } from "./config";

/**
 * Minimal client for the Google Ads API over REST
 * (https://developers.google.com/google-ads/api/rest/overview). Reports use
 * GAQL through googleAds:searchStream. Never logs tokens or report payloads.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const OAUTH_SCOPES = ["https://www.googleapis.com/auth/adwords", "openid", "email"];

export class GoogleAdsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The saved authorisation no longer works; an admin must reconnect. */
    readonly needsReconnect = false,
  ) {
    super(message);
    this.name = "GoogleAdsError";
  }
}

type Credentials = Pick<GoogleAdsConfig, "developerToken" | "clientId" | "clientSecret" | "refreshToken" | "loginCustomerId" | "apiVersion">;

/* --------------------------------- OAuth --------------------------------- */

type TokenResponse = { access_token?: string; expires_in?: number; refresh_token?: string; id_token?: string; error?: string; error_description?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse & { httpStatus: number }> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const json = ((await res.json().catch(() => ({}))) ?? {}) as TokenResponse;
    return { ...json, httpStatus: res.status };
  } catch {
    throw new GoogleAdsError("Couldn't reach Google. Check the connection and try again.", 0);
  }
}

// Access tokens last an hour; reuse them across requests in the same server instance.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function accessToken(c: Credentials): Promise<string> {
  if (!c.clientId || !c.clientSecret || !c.refreshToken) throw new GoogleAdsError("Google Ads isn't connected yet.", 0, true);
  const cacheKey = createHash("sha256").update(`${c.clientId}:${c.refreshToken}`).digest("hex");
  const hit = tokenCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now() + 60_000) return hit.token;

  const res = await tokenRequest({ client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refreshToken, grant_type: "refresh_token" });
  if (!res.access_token) {
    console.error(`[google-ads] token refresh failed → ${res.httpStatus} ${res.error ?? ""}`);
    if (res.error === "invalid_grant") {
      throw new GoogleAdsError(
        "Google no longer accepts the saved authorisation (it was revoked, the password changed, or the OAuth app is in Testing mode, where access expires after 7 days). Reconnect in Settings → Google Ads.",
        401,
        true,
      );
    }
    if (res.error === "invalid_client" || res.error === "unauthorized_client") {
      throw new GoogleAdsError("Google rejected the OAuth client ID or secret. Check them in Settings → Google Ads.", 401, true);
    }
    throw new GoogleAdsError("Couldn't get access from Google. Try again shortly.", res.httpStatus);
  }
  tokenCache.set(cacheKey, { token: res.access_token, expiresAt: Date.now() + (res.expires_in ?? 3600) * 1000 });
  return res.access_token;
}

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const sp = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPES.join(" "),
    // Offline + consent so Google always returns a refresh token.
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${sp}`;
}

/** Exchanges the authorisation code for a refresh token and the Google account's email. */
export async function exchangeCode(clientId: string, clientSecret: string, code: string, redirectUri: string) {
  const res = await tokenRequest({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  if (!res.refresh_token) {
    console.error(`[google-ads] code exchange failed → ${res.httpStatus} ${res.error ?? ""}`);
    throw new GoogleAdsError(
      res.error === "redirect_uri_mismatch"
        ? "The redirect URI isn't listed in your OAuth client. Add the exact URI shown in Settings."
        : res.access_token
          ? "Google didn't return a long-lived token. Remove Mavqo's access at myaccount.google.com/permissions and connect again."
          : "Google didn't accept the sign-in. Please try connecting again.",
      res.httpStatus,
    );
  }
  // The ID token came straight from Google over TLS, so its claims can be read without re-verifying.
  let email: string | undefined;
  try {
    const claims = JSON.parse(Buffer.from(res.id_token?.split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: unknown };
    if (typeof claims.email === "string") email = claims.email;
  } catch {
    // Email is only for display.
  }
  return { refreshToken: res.refresh_token, email };
}

/** Revokes a refresh token at Google (best effort, used when disconnecting). */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    // Disconnecting still deletes our copy.
  }
}

/* ------------------------------- Google Ads ------------------------------- */

type AdsErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: { errors?: { errorCode?: Record<string, string>; message?: string }[] }[];
  };
};

/** Turns Google Ads error codes into advice an admin can act on. */
export function describeAdsError(body: unknown, status: number, customerId?: string): GoogleAdsError {
  const err = (Array.isArray(body) ? body[0] : body) as AdsErrorBody | undefined;
  const first = err?.error?.details?.flatMap((d) => d.errors ?? [])[0];
  const code = first?.errorCode ? Object.values(first.errorCode)[0] : undefined;
  const account = customerId ? ` (${customerId.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3")})` : "";

  switch (code) {
    case "DEVELOPER_TOKEN_NOT_APPROVED":
      return new GoogleAdsError("The developer token only has test access, so it can't read real accounts. Apply for Basic access in the manager account's API Center.", status);
    case "DEVELOPER_TOKEN_PROHIBITED":
    case "DEVELOPER_TOKEN_INVALID":
    case "DEVELOPER_TOKEN_PARAMETER_MISSING":
      return new GoogleAdsError("Google rejected the developer token. Copy it again from the manager account's API Center.", status, true);
    case "USER_PERMISSION_DENIED":
      return new GoogleAdsError(
        `The connected Google account can't access this account${account}. Link it to your manager account and set the Manager account ID in Settings, or connect a Google account that has access.`,
        status,
      );
    case "CUSTOMER_NOT_ENABLED":
      return new GoogleAdsError(`This Google Ads account${account} is cancelled or not yet set up.`, status);
    case "CUSTOMER_NOT_FOUND":
    case "INVALID_CUSTOMER_ID":
      return new GoogleAdsError(`No Google Ads account found with ID${account}. Check the customer ID.`, status);
    case "OAUTH_TOKEN_REVOKED":
    case "OAUTH_TOKEN_EXPIRED":
    case "OAUTH_TOKEN_INVALID":
      return new GoogleAdsError("The Google authorisation expired. Reconnect in Settings → Google Ads.", status, true);
    case "RESOURCE_EXHAUSTED":
    case "RESOURCE_TEMPORARILY_EXHAUSTED":
      return new GoogleAdsError("Google Ads API rate limit reached. Try again in a few minutes.", status);
  }
  if (status === 404) return new GoogleAdsError("Google Ads API version not found — set GOOGLE_ADS_API_VERSION to a supported version.", status);
  const message = first?.message ?? err?.error?.message ?? `Google Ads responded ${status}`;
  return new GoogleAdsError(message.slice(0, 300), status);
}

async function adsFetch(c: Credentials, path: string, init: { method: string; body?: unknown }, customerId?: string): Promise<unknown> {
  if (!c.developerToken) throw new GoogleAdsError("Add your developer token in Settings → Google Ads.", 0, true);
  const token = await accessToken(c);
  let res: Response;
  try {
    res = await fetch(`https://googleads.googleapis.com/${c.apiVersion}/${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": c.developerToken,
        ...(c.loginCustomerId ? { "login-customer-id": c.loginCustomerId } : {}),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
  } catch {
    throw new GoogleAdsError("Couldn't reach the Google Ads API. Try again shortly.", 0);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = describeAdsError(json, res.status, customerId);
    console.error(`[google-ads] ${init.method} ${path.split("/")[0]} → ${res.status}`);
    throw error;
  }
  return json;
}

/** Runs a GAQL query and returns every row. */
export async function search<T>(c: Credentials, customerId: string, query: string): Promise<T[]> {
  const batches = (await adsFetch(c, `customers/${customerId}/googleAds:searchStream`, { method: "POST", body: { query } }, customerId)) as { results?: T[] }[] | null;
  return (batches ?? []).flatMap((b) => b.results ?? []);
}

export type AccessibleAccount = { customerId: string; name: string; currencyCode: string; manager: boolean };

/**
 * Accounts the connection can report on: the client accounts under the
 * manager account when one is set, otherwise the accounts the Google user can
 * open directly.
 */
export async function listAccessibleAccounts(c: Credentials): Promise<AccessibleAccount[]> {
  type Row = { customerClient?: { id?: string; descriptiveName?: string; currencyCode?: string; manager?: boolean; status?: string } };
  const query = (ids: string[]) =>
    Promise.all(
      ids.map((id) =>
        search<Row>(
          c,
          id,
          "SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code, customer_client.manager, customer_client.status FROM customer_client WHERE customer_client.level <= 1",
        ).catch(() => [] as Row[]),
      ),
    );

  let rows: Row[];
  if (c.loginCustomerId) {
    rows = (await query([c.loginCustomerId])).flat();
  } else {
    const res = (await adsFetch(c, "customers:listAccessibleCustomers", { method: "GET" })) as { resourceNames?: string[] };
    const ids = (res.resourceNames ?? []).map((r) => r.split("/")[1]).filter(Boolean).slice(0, 25);
    rows = (await query(ids)).flat();
  }

  const seen = new Map<string, AccessibleAccount>();
  for (const { customerClient: cc } of rows) {
    if (!cc?.id || cc.status === "CANCELED" || cc.status === "CLOSED") continue;
    seen.set(cc.id, { customerId: String(cc.id), name: cc.descriptiveName || "Unnamed account", currencyCode: cc.currencyCode ?? "", manager: Boolean(cc.manager) });
  }
  return [...seen.values()].sort((a, b) => Number(a.manager) - Number(b.manager) || a.name.localeCompare(b.name));
}
