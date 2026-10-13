import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { emptySignature, parseSignature } from "@/lib/mail/signature";
import { formatAddress, parseAddress, splitAddresses } from "@/lib/mail/format";
import { ADS_ID, GA_ID, SEARCH_CONSOLE_TOKEN, type AnalyticsSettings, type MailSettings } from "./schema";

/** Cache tag for everything public pages read from settings. */
export const SITE_SETTINGS_TAG = "site-settings";

type SettingKey = "analytics" | "mail" | "mail_secrets" | "google_ads" | "google_ads_secrets";
type MailSecrets = { apiKey?: string; webhookSecret?: string };

export async function readSetting<T>(key: SettingKey): Promise<T | null> {
  const row = await db().setting.findUnique({ where: { key } });
  return (row?.value as T | undefined) ?? null;
}

export async function writeSetting(key: SettingKey, value: object, userId: string) {
  const json = value as Prisma.InputJsonValue;
  await db().setting.upsert({ where: { key }, create: { key, value: json, updatedById: userId }, update: { value: json, updatedById: userId } });
}

/* ---------------- Analytics & SEO (public, cached) ---------------- */

const envAnalytics = (): AnalyticsSettings => {
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
  const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
  const gsc = process.env.GOOGLE_SITE_VERIFICATION ?? "";
  return {
    gaMeasurementId: GA_ID.test(ga) ? ga : undefined,
    googleAdsId: ADS_ID.test(ads) ? ads : undefined,
    searchConsoleToken: SEARCH_CONSOLE_TOKEN.test(gsc) ? gsc : undefined,
  };
};

/**
 * Analytics IDs and verification tokens for public pages. Cached until an
 * admin saves new values (which calls updateTag(SITE_SETTINGS_TAG)), so pages
 * stay static. Values are re-validated on read: only well-formed IDs are ever
 * interpolated into the gtag script.
 */
export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  "use cache";
  cacheTag(SITE_SETTINGS_TAG);
  cacheLife("max");
  const fallback = envAnalytics();
  try {
    const saved = await readSetting<AnalyticsSettings>("analytics");
    if (!saved) return fallback;
    return {
      gaMeasurementId: saved.gaMeasurementId && GA_ID.test(saved.gaMeasurementId) ? saved.gaMeasurementId : undefined,
      googleAdsId: saved.googleAdsId && ADS_ID.test(saved.googleAdsId) ? saved.googleAdsId : undefined,
      searchConsoleToken: saved.searchConsoleToken && SEARCH_CONSOLE_TOKEN.test(saved.searchConsoleToken) ? saved.searchConsoleToken : undefined,
    };
  } catch {
    // Database unreachable (e.g. during a build without one): fall back to env.
    return fallback;
  }
}

export async function getSavedAnalytics(): Promise<AnalyticsSettings | null> {
  return readSetting<AnalyticsSettings>("analytics");
}

/* ---------------- Mail (server-only, never cached) ---------------- */

export type MailConfig = {
  /** Where the effective configuration came from. */
  source: "admin" | "env" | "none";
  apiKey: string | null;
  fromName: string;
  fromAddress: string | null;
  /** Formatted From header, or null when sending isn't possible. */
  from: string | null;
  replyTo: string | null;
  notificationEmails: string[];
  autoReply: boolean;
  teamSignature: MailSettings["teamSignature"];
  webhookSecret: string | null;
  saved: MailSettings | null;
  /** True when the stored secrets can't be decrypted (encryption key changed). */
  secretsUnreadable: boolean;
};

export const getMailConfig = cache(async (): Promise<MailConfig> => {
  const env = getServerEnv();
  const [saved, secrets] = await Promise.all([readSetting<MailSettings>("mail"), readSetting<MailSecrets>("mail_secrets")]);
  const unseal = (v?: string) => (v ? decryptSecret(v, env.SETTINGS_ENCRYPTION_KEY) : null);
  const apiKey = unseal(secrets?.apiKey);
  const webhookSecret = unseal(secrets?.webhookSecret);
  const secretsUnreadable = Boolean((secrets?.apiKey && !apiKey) || (secrets?.webhookSecret && !webhookSecret));

  if (saved || apiKey) {
    return {
      source: "admin",
      apiKey,
      fromName: saved?.fromName ?? "",
      fromAddress: saved?.fromAddress ?? null,
      from: apiKey && saved?.fromAddress ? formatAddress(saved.fromName, saved.fromAddress) : null,
      replyTo: saved?.replyTo ?? null,
      notificationEmails: saved?.notificationEmails ?? [],
      autoReply: saved?.autoReply ?? true,
      teamSignature: parseSignature(saved?.teamSignature),
      webhookSecret,
      saved,
      secretsUnreadable,
    };
  }

  // Legacy environment configuration.
  const envFrom = env.EMAIL_FROM ? parseAddress(env.EMAIL_FROM) : null;
  const hasEnv = Boolean(env.RESEND_API_KEY && envFrom);
  return {
    source: hasEnv ? "env" : "none",
    apiKey: env.RESEND_API_KEY ?? null,
    fromName: envFrom?.name ?? "",
    fromAddress: envFrom?.email ?? null,
    from: hasEnv && envFrom ? formatAddress(envFrom.name, envFrom.email) : null,
    replyTo: null,
    notificationEmails: splitAddresses(env.LEAD_NOTIFICATION_EMAIL ?? ""),
    autoReply: true,
    teamSignature: emptySignature,
    webhookSecret: null,
    saved: null,
    secretsUnreadable,
  };
});

export async function saveMailSecrets(update: Partial<Record<keyof MailSecrets, string | null>>, userId: string) {
  const key = getServerEnv().SETTINGS_ENCRYPTION_KEY;
  const current = (await readSetting<MailSecrets>("mail_secrets")) ?? {};
  const next: MailSecrets = { ...current };
  for (const [k, v] of Object.entries(update) as [keyof MailSecrets, string | null | undefined][]) {
    if (v === undefined) continue;
    if (v === null) delete next[k];
    else next[k] = encryptSecret(v, key);
  }
  await writeSetting("mail_secrets", next, userId);
}

export async function saveMailSettings(update: Partial<MailSettings>, userId: string) {
  const current = (await readSetting<MailSettings>("mail")) ?? ({} as Partial<MailSettings>);
  await writeSetting("mail", { ...current, ...update }, userId);
}
