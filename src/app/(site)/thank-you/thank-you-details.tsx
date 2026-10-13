"use client";

import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  demo: "We'll contact you shortly to arrange your live demo at a time that suits you.",
  quote: "We'll review your request and get back to you to discuss your needs and next steps.",
  marketing: "We'll review your request and get back to you to arrange your consultation.",
  contact: "Thanks for your message. A member of our team will get back to you soon.",
  waitlist: "You're on the early-access list. We'll let you know as soon as demos are available.",
};

export function ThankYouDetails() {
  const params = useSearchParams();
  const type = params.get("type") ?? "contact";
  const ref = params.get("ref");
  const validRef = ref && /^MVQ-[A-Z0-9]{6}$/.test(ref) ? ref : null;

  return (
    <>
      <p className="text-lead mx-auto mt-4 max-w-xl text-ink">{messages[type] ?? messages.contact}</p>
      {validRef && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm text-ink">
          Your reference: <strong className="font-mono text-heading">{validRef}</strong>
        </p>
      )}
    </>
  );
}
