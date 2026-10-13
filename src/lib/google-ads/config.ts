import "server-only";
import { cache } from "react";
import { getServerEnv } from "@/lib/env";
import { readSetting, writeSetting } from "@/lib/settings";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import type { GoogleAdsSettings } from "@/lib/settings/schema";

/**
 * Google Ads API connection, saved from Admin → Settings → Google Ads.
 * The developer token, OAuth client secret and refresh token are encrypted at
 * rest like the mail secrets.
 */

type GoogleAdsSecrets = { developerToken?: string; clientSecret?: string; refreshToken?: string };

export type GoogleAdsConfig = {
  saved: GoogleAdsSettings | null;
  developerToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  refreshToken: string | null;
  loginCustomerId: string | null;
  apiVersion: string;
  /** Everything needed to call the API is present. */
  ready: boolean;
  /** Stored secrets can't be decrypted (SETTINGS_ENCRYPTION_KEY changed). */
  secretsUnreadable: boolean;
};

export const getGoogleAdsConfig = cache(async (): Promise<GoogleAdsConfig> => {
  const env = getServerEnv();
  const [saved, secrets] = await Promise.all([readSetting<GoogleAdsSettings>("google_ads"), readSetting<GoogleAdsSecrets>("google_ads_secrets")]);
  const unseal = (v?: string) => (v ? decryptSecret(v, env.SETTINGS_ENCRYPTION_KEY) : null);
  const developerToken = unseal(secrets?.developerToken);
  const clientSecret = unseal(secrets?.clientSecret);
  const refreshToken = unseal(secrets?.refreshToken);
  const secretsUnreadable = Boolean(
    (secrets?.developerToken && !developerToken) || (secrets?.clientSecret && !clientSecret) || (secrets?.refreshToken && !refreshToken),
  );
  const clientId = saved?.clientId ?? null;
  return {
    saved,
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    loginCustomerId: saved?.loginCustomerId ?? null,
    apiVersion: env.GOOGLE_ADS_API_VERSION,
    ready: Boolean(developerToken && clientId && clientSecret && refreshToken),
    secretsUnreadable,
  };
});

export async function saveGoogleAdsSecrets(update: Partial<Record<keyof GoogleAdsSecrets, string | null>>, userId: string) {
  const key = getServerEnv().SETTINGS_ENCRYPTION_KEY;
  const next: GoogleAdsSecrets = { ...((await readSetting<GoogleAdsSecrets>("google_ads_secrets")) ?? {}) };
  for (const [k, v] of Object.entries(update) as [keyof GoogleAdsSecrets, string | null | undefined][]) {
    if (v === undefined) continue;
    if (v === null) delete next[k];
    else next[k] = encryptSecret(v, key);
  }
  await writeSetting("google_ads_secrets", next, userId);
}

export async function saveGoogleAdsSettings(update: Partial<GoogleAdsSettings>, userId: string) {
  const current = (await readSetting<GoogleAdsSettings>("google_ads")) ?? {};
  await writeSetting("google_ads", { ...current, ...update }, userId);
}

/** Where Google sends the browser back after consent. Must be listed in the OAuth client exactly. */
export function oauthRedirectUri(): string {
  return `${getServerEnv().APP_BASE_URL.replace(/\/$/, "")}/api/google-ads/oauth/callback/`;
}
