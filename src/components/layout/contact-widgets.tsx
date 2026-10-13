"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link";

/**
 * Persistent conversion shortcuts: a floating WhatsApp button (desktop) and a
 * sticky bottom action bar on mobile. Hidden on the form pages themselves.
 */
export function ContactWidgets({ whatsappHref, phone }: { whatsappHref: string | null; phone: string | null }) {
  const pathname = usePathname();
  const onFormPage = ["/request-demo", "/request-quote", "/contact", "/thank-you"].some((p) => pathname.startsWith(p));

  return (
    <>
      {whatsappHref && (
        <TrackedContactLink
          kind="whatsapp"
          href={whatsappHref}
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-6 right-6 z-40 hidden size-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-lg transition-transform hover:scale-105 lg:flex"
        >
          <MessageCircle aria-hidden="true" className="size-7" />
        </TrackedContactLink>
      )}

      {!onFormPage && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas px-3 py-2.5 lg:hidden">
          <div className="flex gap-2">
            {whatsappHref ? (
              <TrackedContactLink
                kind="whatsapp"
                href={whatsappHref}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#1fa855] text-sm font-bold text-white"
              >
                <MessageCircle aria-hidden="true" className="size-4" /> WhatsApp
              </TrackedContactLink>
            ) : phone ? (
              <TrackedContactLink
                kind="phone"
                href={`tel:${phone}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-sm font-bold text-heading ring-1 ring-inset ring-line"
              >
                <Phone aria-hidden="true" className="size-4" /> Call us
              </TrackedContactLink>
            ) : (
              <Link
                href="/request-quote/"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-surface text-sm font-bold text-heading ring-1 ring-inset ring-line"
              >
                Get a quote
              </Link>
            )}
            <Link
              href="/request-demo/"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
            >
              Book a demo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
