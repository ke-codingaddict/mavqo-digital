/**
 * Client-side analytics helpers (spec §12). Only send non-sensitive,
 * aggregate information — never names, emails, phone numbers or messages.
 */

type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export type ConversionEvent =
  | "demo_request_submitted"
  | "quote_request_submitted"
  | "contact_form_submitted"
  | "waitlist_joined"
  | "phone_contact_clicked"
  | "whatsapp_contact_clicked"
  | "email_contact_clicked";

export function track(event: ConversionEvent, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Analytics must never break the page.
  }
}

/* ---------- Attribution: remember how the visitor first arrived ---------- */

export const ATTRIBUTION_KEYS = ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "gclid", "referrer"] as const;
export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

const STORAGE_KEY = "mavqo_attribution";
const PARAM_MAP: Record<string, keyof Attribution> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
  gclid: "gclid",
};

/** Captures UTM parameters on landing. Campaign params overwrite older ones; referrer is first-touch. */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const stored: Attribution = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
    const fromUrl: Attribution = {};
    for (const [param, key] of Object.entries(PARAM_MAP)) {
      const value = params.get(param);
      if (value) fromUrl[key] = value.slice(0, 150);
    }
    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer.slice(0, 300) : undefined;
    const next: Attribution = { ...stored, ...fromUrl };
    if (!next.referrer && referrer) next.referrer = referrer;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, blocked); attribution is best-effort.
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
