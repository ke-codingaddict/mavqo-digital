import { z } from "zod";
import { signatureSchema } from "@/lib/mail/signature";
import { splitAddresses } from "@/lib/mail/format";
import { normalizeCustomerId } from "@/lib/google-ads/customer-id";

/** Validation for admin-editable settings. Pure, shared by forms, server actions and tests. */

export const GA_ID = /^G-[A-Z0-9]{4,20}$/;
export const ADS_ID = /^AW-\d{6,15}$/;
/** Google Search Console HTML-tag token (the `content` value of the meta tag). */
export const SEARCH_CONSOLE_TOKEN = /^[A-Za-z0-9_-]{20,100}$/;
export const RESEND_KEY = /^re_[A-Za-z0-9_]{10,200}$/;

const optionalMatch = (re: RegExp, message: string) =>
  z
    .string()
    .trim()
    .transform((v) => v || undefined)
    .pipe(z.string().regex(re, message).optional());

export const analyticsSchema = z.object({
  gaMeasurementId: optionalMatch(GA_ID, "GA4 measurement IDs look like G-XXXXXXXXXX"),
  googleAdsId: optionalMatch(ADS_ID, "Google Ads IDs look like AW-123456789"),
  searchConsoleToken: z
    .string()
    .trim()
    // Accept the whole <meta …> tag pasted from Search Console, and keep just the token.
    .transform((v) => v.match(/content=["']([^"']+)["']/)?.[1] ?? v)
    .transform((v) => v || undefined)
    .pipe(z.string().regex(SEARCH_CONSOLE_TOKEN, "Paste the token (or the whole meta tag) from Search Console's HTML tag method").optional()),
});
export type AnalyticsSettings = z.infer<typeof analyticsSchema>;

const emailList = z
  .string()
  .transform((v) => [...new Set(splitAddresses(v).map((e) => e.toLowerCase()))])
  .pipe(z.array(z.email("One of the notification addresses isn't a valid email")).max(10, "Up to 10 notification addresses"));

export const mailSettingsSchema = z.object({
  fromName: z.string().trim().min(1, "Enter the sender name").max(80),
  fromAddress: z.string().trim().toLowerCase().pipe(z.email("Enter a valid sender address")),
  replyTo: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v || undefined)
    .pipe(z.email("Enter a valid inbox address").optional()),
  notificationEmails: emailList,
  autoReply: z.boolean(),
  teamSignature: signatureSchema,
});
export type MailSettings = z.infer<typeof mailSettingsSchema> & { domainId?: string; webhookId?: string; webhookEndpoint?: string; inboxConnectedAt?: string };

/* ---------------- Google Ads API connection ---------------- */

export const ADS_DEVELOPER_TOKEN = /^[A-Za-z0-9_-]{15,40}$/;
export const OAUTH_CLIENT_ID = /^[0-9]+-[A-Za-z0-9_]+\.apps\.googleusercontent\.com$/;
export const OAUTH_CLIENT_SECRET = /^[A-Za-z0-9_-]{10,100}$/;

const customerIdField = (message: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const id = normalizeCustomerId(v);
      if (!id) ctx.addIssue({ code: "custom", message });
      return id ?? "";
    });

export const googleAdsAppSchema = z.object({
  clientId: z.string().trim().regex(OAUTH_CLIENT_ID, "OAuth client IDs end in .apps.googleusercontent.com"),
  loginCustomerId: z
    .string()
    .trim()
    .transform((v) => v || undefined)
    .pipe(customerIdField("Manager account IDs look like 123-456-7890").optional()),
});

export type GoogleAdsSettings = z.infer<typeof googleAdsAppSchema> & {
  /** Google account that authorised access, shown in Settings. */
  connectedEmail?: string;
  connectedAt?: string;
  /** Why the last connection attempt failed, shown once in Settings. */
  lastConnectError?: string;
};

/** Messages for the fixed error codes the OAuth callback returns. */
export const GOOGLE_ADS_CONNECT_ERRORS: Record<string, string> = {
  expired: "The connection request expired or didn't start in this browser. Please try again.",
  session: "Your admin session ended. Sign in and connect again.",
  denied: "Access wasn't granted, so nothing changed.",
  google: "Google couldn't complete the connection. Please try again.",
  client: "Save the OAuth client ID and secret first.",
};

export const adsAccountSchema = z.object({
  name: z.string().trim().min(2, "Enter the client's name").max(160),
  customerId: customerIdField("Customer IDs have 10 digits, like 123-456-7890"),
  monthlyBudget: z
    .string()
    .trim()
    .transform((v) => v.replace(/[,\s]/g, ""))
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number("Enter the budget as a number").positive("Enter a budget above zero").max(1e11).optional()),
});
