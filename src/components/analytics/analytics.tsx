"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { captureAttribution } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "mavqo_consent";
type Consent = "granted" | "denied";

function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function applyConsent(value: Consent) {
  window.gtag?.("consent", "update", {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

/**
 * Google Analytics 4 / Google Ads with Consent Mode: tags load with storage
 * denied by default and only use cookies after the visitor accepts (spec §12).
 * Loads no tags unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set; UTM attribution
 * for lead records is captured either way.
 */
const noSubscribe = () => () => {};

export function Analytics({ measurementId, adsId }: { measurementId?: string; adsId?: string }) {
  // "unknown" during server render/hydration, so the banner never flashes for returning visitors.
  const stored = useSyncExternalStore(noSubscribe, readConsent, () => "unknown" as const);
  const [choice, setChoice] = useState<Consent | null>(null);
  const consent = choice ?? stored;

  useEffect(() => captureAttribution(), []);

  if (!measurementId) return null;

  const choose = (value: Consent) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Choice still applies for this page view.
    }
    applyConsent(value);
    setChoice(value);
  };

  return (
    <>
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
try{if(localStorage.getItem('${CONSENT_KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}
gtag('js',new Date());gtag('config','${measurementId}');${adsId ? `gtag('config','${adsId}');` : ""}`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />

      {consent === null && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-xl rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-lg sm:bottom-5 lg:inset-x-auto lg:left-5"
        >
          <p className="text-sm leading-relaxed text-ink">
            We use cookies to understand how our website is used and to measure our advertising. You can accept or
            decline analytics cookies. See our{" "}
            <Link href="/privacy-policy/" className="font-bold text-teal-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => choose("granted")}>
              Accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => choose("denied")}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

