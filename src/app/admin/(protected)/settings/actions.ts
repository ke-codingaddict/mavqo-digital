"use server";

import { randomBytes } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { confirmPassword } from "@/lib/auth/reauth";
import { getServerEnv } from "@/lib/env";
import { getClientIpHash } from "@/lib/security/request";
import {
  getMailConfig,
  saveMailSecrets,
  saveMailSettings,
  SITE_SETTINGS_TAG,
  writeSetting,
} from "@/lib/settings";
import { ADS_DEVELOPER_TOKEN, analyticsSchema, googleAdsAppSchema, mailSettingsSchema, OAUTH_CLIENT_SECRET, RESEND_KEY } from "@/lib/settings/schema";
import { getGoogleAdsConfig, oauthRedirectUri, saveGoogleAdsSecrets, saveGoogleAdsSettings } from "@/lib/google-ads/config";
import { authorizeUrl, revokeToken } from "@/lib/google-ads/client";
import { OAUTH_NONCE_COOKIE, OAUTH_STATE_TTL_SECONDS, signOAuthState } from "@/lib/google-ads/oauth-state";
import { createWebhook, deleteWebhook, listDomains, verifyDomain } from "@/lib/mail/resend";
import { sendMail } from "@/lib/mail/outbound";
import { siteConfig } from "@/config/site";

export type FormState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string> };

const ok = (message: string): FormState => ({ status: "success", message });
const fail = (message: string, errors?: Record<string, string>): FormState => ({ status: "error", message, errors });

function fieldErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path.at(-1) ?? "form")] ??= i.message;
  return errors;
}

async function admin() {
  return requireUser("settings:manage");
}

/* ---------------- Sender, notifications, team signature ---------------- */

export async function saveMailPreferences(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const sig = (k: string) => String(formData.get(`sig_${k}`) ?? "");
  const parsed = mailSettingsSchema.safeParse({
    fromName: formData.get("fromName") ?? "",
    fromAddress: formData.get("fromAddress") ?? "",
    replyTo: formData.get("replyTo") ?? "",
    notificationEmails: formData.get("notificationEmails") ?? "",
    autoReply: formData.get("autoReply") === "on",
    teamSignature: Object.fromEntries(["closing", "name", "title", "company", "phone", "email", "website"].map((k) => [k, sig(k)])),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));

  const { saved } = await getMailConfig();
  const domainChanged = saved?.fromAddress?.split("@")[1] !== parsed.data.fromAddress.split("@")[1];
  await saveMailSettings({ ...parsed.data, ...(domainChanged ? { domainId: undefined } : {}) }, user.id);
  await audit({ action: "settings_mail_updated", actorId: user.id, entityType: "setting", entityId: "mail" });
  refresh();
  return ok("Email settings saved.");
}

/* ---------------- API key (step-up) ---------------- */

export async function saveApiKey(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const reauth = await confirmPassword(user.id, formData.get("password"));
  if (!reauth.ok) return fail(reauth.error, { password: reauth.error });

  if (formData.get("intent") === "remove") {
    await saveMailSecrets({ apiKey: null }, user.id);
    await audit({ action: "mail_api_key_removed", actorId: user.id, ipHash: await getClientIpHash() });
    refresh();
    return ok("API key removed. Email is now off.");
  }

  const apiKey = String(formData.get("apiKey") ?? "").trim();
  if (!RESEND_KEY.test(apiKey)) return fail("That doesn't look like a Resend API key.", { apiKey: "Resend keys start with re_" });

  // Verify the key works before saving it — and that it can manage domains and webhooks.
  const check = await listDomains(apiKey);
  if (!check.ok) {
    const message =
      check.status === 401 || check.status === 403
        ? "Resend rejected this key. Create a key with Full access (sending-only keys can't verify domains or connect the inbox)."
        : check.message;
    return fail(message, { apiKey: message });
  }

  await saveMailSecrets({ apiKey }, user.id);
  await audit({ action: "mail_api_key_changed", actorId: user.id, ipHash: await getClientIpHash() });
  refresh();
  return ok(`Key verified and saved. ${check.data.data.length} domain${check.data.data.length === 1 ? "" : "s"} found on this Resend account.`);
}

/* ---------------- Domain verification ---------------- */

export async function checkDomain(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const config = await getMailConfig();
  if (!config.apiKey) return fail("Add your Resend API key first.");
  if (!config.fromAddress) return fail("Save a sender address first.");

  const domainName = config.fromAddress.split("@")[1];
  const domains = await listDomains(config.apiKey);
  if (!domains.ok) return fail(domains.message);
  const domain = domains.data.data.find((d) => d.name === domainName);
  if (!domain) {
    return fail(`${domainName} isn't added to your Resend account yet. Add it at resend.com/domains, then check again.`);
  }

  if (formData.get("intent") === "verify") {
    const res = await verifyDomain(config.apiKey, domain.id);
    if (!res.ok) return fail(res.message);
  }
  await saveMailSettings({ domainId: domain.id }, user.id);
  refresh();
  return ok(
    formData.get("intent") === "verify"
      ? "Verification started. DNS changes can take a few minutes (sometimes hours) to be seen — check back shortly."
      : "Domain status refreshed.",
  );
}

/* ---------------- Inbox (webhook) connection (step-up) ---------------- */

export async function connectInbox(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const reauth = await confirmPassword(user.id, formData.get("password"));
  if (!reauth.ok) return fail(reauth.error, { password: reauth.error });

  const config = await getMailConfig();
  if (!config.apiKey) return fail("Add your Resend API key first.");

  const baseUrl = getServerEnv().APP_BASE_URL.replace(/\/$/, "");
  if (!baseUrl.startsWith("https://")) {
    return fail("The inbox can only be connected on the deployed site (Resend must reach it over https).");
  }

  if (formData.get("intent") === "disconnect") {
    if (config.saved?.webhookId) await deleteWebhook(config.apiKey, config.saved.webhookId);
    await saveMailSecrets({ webhookSecret: null }, user.id);
    await saveMailSettings({ webhookId: undefined, webhookEndpoint: undefined, inboxConnectedAt: undefined }, user.id);
    await audit({ action: "mail_inbox_disconnected", actorId: user.id, ipHash: await getClientIpHash() });
    refresh();
    return ok("Inbox disconnected. New emails will no longer arrive here.");
  }

  const endpoint = `${baseUrl}/api/mail/inbound/`;
  const created = await createWebhook(config.apiKey, endpoint, ["email.received"]);
  if (!created.ok) return fail(created.message);
  // Replace any earlier webhook so emails aren't delivered twice.
  if (config.saved?.webhookId && config.saved.webhookId !== created.data.id) await deleteWebhook(config.apiKey, config.saved.webhookId);

  await saveMailSecrets({ webhookSecret: created.data.signing_secret }, user.id);
  await saveMailSettings({ webhookId: created.data.id, webhookEndpoint: endpoint, inboxConnectedAt: new Date().toISOString() }, user.id);
  await audit({ action: "mail_inbox_connected", actorId: user.id, ipHash: await getClientIpHash() });
  refresh();
  return ok("Inbox connected. Emails sent to your receiving address will now appear in Mail.");
}

/* ---------------- Test email ---------------- */

export async function sendTestEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const to = z.email().safeParse(String(formData.get("to") ?? user.email).trim());
  if (!to.success) return fail("Enter a valid address for the test email.");
  const config = await getMailConfig();
  const result = await sendMail({
    category: "test",
    to: [to.data],
    subject: `Test email from ${siteConfig.name}`,
    text: `This is a test email from your ${siteConfig.name} admin.\n\nIf you're reading this, sending works. Reply to it to check that replies arrive in Mail.`,
    signature: config.teamSignature,
    sentById: user.id,
    record: {},
  });
  refresh();
  return result.ok ? ok(`Test email sent to ${to.data}. Check the inbox (and spam folder).`) : fail(result.message);
}

/* ---------------- Analytics & SEO ---------------- */

export async function saveAnalytics(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const parsed = analyticsSchema.safeParse({
    gaMeasurementId: formData.get("gaMeasurementId") ?? "",
    googleAdsId: formData.get("googleAdsId") ?? "",
    searchConsoleToken: formData.get("searchConsoleToken") ?? "",
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
  await writeSetting("analytics", parsed.data, user.id);
  await audit({ action: "settings_analytics_updated", actorId: user.id, entityType: "setting", entityId: "analytics", metadata: parsed.data });
  // Public pages read these from the cache; expire it so the change is live immediately.
  updateTag(SITE_SETTINGS_TAG);
  refresh();
  return ok("Saved. The website now uses these settings.");
}

/* ---------------- Google Ads API (step-up) ---------------- */

export async function saveGoogleAdsApp(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const reauth = await confirmPassword(user.id, formData.get("password"));
  if (!reauth.ok) return fail(reauth.error, { password: reauth.error });

  const parsed = googleAdsAppSchema.safeParse({ clientId: formData.get("clientId") ?? "", loginCustomerId: formData.get("loginCustomerId") ?? "" });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));

  // Secret fields left blank keep the saved value.
  const developerToken = String(formData.get("developerToken") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  const current = await getGoogleAdsConfig();
  const errors: Record<string, string> = {};
  if (developerToken ? !ADS_DEVELOPER_TOKEN.test(developerToken) : !current.developerToken) errors.developerToken = "Paste the developer token from the API Center";
  if (clientSecret ? !OAUTH_CLIENT_SECRET.test(clientSecret) : !current.clientSecret) errors.clientSecret = "Paste the OAuth client secret";
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", errors);

  // A different OAuth client can't use the old refresh token.
  const clientChanged = Boolean(current.clientId && current.clientId !== parsed.data.clientId);
  await saveGoogleAdsSecrets(
    { ...(developerToken ? { developerToken } : {}), ...(clientSecret ? { clientSecret } : {}), ...(clientChanged ? { refreshToken: null } : {}) },
    user.id,
  );
  await saveGoogleAdsSettings(
    { clientId: parsed.data.clientId, loginCustomerId: parsed.data.loginCustomerId, ...(clientChanged ? { connectedEmail: undefined, connectedAt: undefined } : {}) },
    user.id,
  );
  await audit({ action: "google_ads_app_updated", actorId: user.id, entityType: "setting", entityId: "google_ads", ipHash: await getClientIpHash() });
  refresh();
  return ok(clientChanged ? "Saved. The OAuth client changed, so connect your Google account again." : "Google Ads API details saved.");
}

export async function connectGoogleAds(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await admin();
  const reauth = await confirmPassword(user.id, formData.get("password"));
  if (!reauth.ok) return fail(reauth.error, { password: reauth.error });

  const config = await getGoogleAdsConfig();

  if (formData.get("intent") === "disconnect") {
    if (config.refreshToken) await revokeToken(config.refreshToken);
    await saveGoogleAdsSecrets({ refreshToken: null }, user.id);
    await saveGoogleAdsSettings({ connectedEmail: undefined, connectedAt: undefined }, user.id);
    await audit({ action: "google_ads_disconnected", actorId: user.id, ipHash: await getClientIpHash() });
    refresh();
    return ok("Disconnected. Reports keep the data already synced.");
  }

  if (!config.clientId || !config.clientSecret || !config.developerToken) return fail("Save the developer token and OAuth client first.");

  const nonce = randomBytes(24).toString("base64url");
  (await cookies()).set(OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax, so it comes back on Google's top-level redirect to the callback.
    sameSite: "lax",
    path: "/api/google-ads/oauth/",
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
  const state = await signOAuthState({ sub: user.id, sid: user.sessionId, nonce }, getServerEnv().AUTH_SECRET);
  redirect(authorizeUrl(config.clientId, oauthRedirectUri(), state));
}
