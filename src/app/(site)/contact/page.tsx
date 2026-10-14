import Image from "next/image";
import { Clock, Mail, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import { siteConfig, whatsappLink } from "@/config/site";
import { companyProfile } from "@/content/company-profile";
import { pageMetadata } from "@/lib/seo";
import { FormPageLayout } from "@/components/forms/form-page-layout";
import { LeadForm } from "@/components/forms/lead-form";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Mavqo Digital about business software, websites or digital marketing. Call, WhatsApp or email us — we'll get back to you promptly.",
  path: "/contact/",
});

type Channel = { icon: LucideIcon; label: string; value: string; note: string; href: string; kind: "phone" | "whatsapp" | "email"; tint: string };

export default function ContactPage() {
  const { email, phone, phoneDisplay, businessHours } = siteConfig.contact;
  const wa = whatsappLink("Hi Mavqo Digital, I have a question.");

  const channels: Channel[] = [
    ...(wa ? [{ icon: MessageCircle, label: "WhatsApp", value: phoneDisplay, note: "Chat with us — the quickest way to reach us", href: wa, kind: "whatsapp" as const, tint: "bg-[#1fa855]/12 text-[#1a8f48]" }] : []),
    ...(phone ? [{ icon: Phone, label: "Call us", value: phoneDisplay, note: "Speak to our sales team", href: `tel:${phone}`, kind: "phone" as const, tint: "bg-teal-wash text-teal-ink" }] : []),
    ...(email ? [{ icon: Mail, label: "Email", value: email, note: "For quotes, proposals and documents", href: `mailto:${email}`, kind: "email" as const, tint: "bg-sun-wash text-heading" }] : []),
  ];

  return (
    <>
      <FormPageLayout
        crumbs={[{ name: "Contact", path: "/contact/" }]}
        eyebrow="Contact us"
        title="Let's talk"
        intro="Have a question about our software, websites or marketing services? Send us a message and the right person will get back to you."
        points={[
          "Your message goes straight to our team.",
          "We reply using your preferred contact method.",
          "Looking for a demo or quote? Use those forms for a faster response.",
        ]}
        formTitle="Send us a message"
      >
        <LeadForm type="contact" />
      </FormPageLayout>

      {channels.length > 0 && (
        <Section tone="muted" labelledBy="contact-details-heading">
          <SectionHeading
            id="contact-details-heading"
            eyebrow="Contact details"
            title="Reach us directly"
            intro="Prefer not to fill in a form? Call, WhatsApp or email us — whichever suits you."
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map(({ icon: I, label, value, note, href, kind, tint }) => (
              <li key={label}>
                <TrackedContactLink
                  kind={kind}
                  href={href}
                  className="group flex h-full flex-col rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className={`inline-flex size-12 items-center justify-center rounded-full ${tint}`}>
                    <I aria-hidden="true" className="size-6" />
                  </span>
                  <span className="mt-5 text-sm font-bold uppercase tracking-wider text-ink-soft">{label}</span>
                  <span className="mt-1 break-all text-xl font-bold text-heading group-hover:underline">{value}</span>
                  <span className="mt-2 text-ink-soft">{note}</span>
                </TrackedContactLink>
              </li>
            ))}
          </ul>
          {businessHours && (
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
              <Clock aria-hidden="true" className="size-4" /> {businessHours}
            </p>
          )}
        </Section>
      )}

      <Section labelledBy="profile-cta-heading">
        <div className="grid items-center gap-10 rounded-[var(--radius-xl)] border border-line bg-surface p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="kicker">Company profile</p>
            <h2 id="profile-cta-heading" className="text-h2 mt-4">
              Want the full picture first?
            </h2>
            <p className="text-lead mt-4 text-ink-soft">
              Flip through our company profile to see our software, websites, marketing and how we work.
            </p>
            <ButtonLink href="/company-profile/" size="lg" className="mt-8">
              View company profile <ArrowIcon />
            </ButtonLink>
          </div>
          <div className="relative mx-auto aspect-[1242/1756] w-full max-w-60 -rotate-3 overflow-hidden rounded-sm shadow-xl ring-1 ring-line">
            <Image src={companyProfile.pages[0].src} alt="" fill sizes="240px" className="object-cover" />
          </div>
        </div>
      </Section>
    </>
  );
}
