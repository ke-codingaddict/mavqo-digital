import type { ReactNode } from "react";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { siteConfig, whatsappLink } from "@/config/site";
import type { Crumb } from "@/lib/seo";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link";

/** Conversion page layout: reassurance on the left, the form on the right. */
export function FormPageLayout({
  crumbs,
  eyebrow,
  title,
  intro,
  points,
  formTitle,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro: string;
  points: string[];
  formTitle: string;
  children: ReactNode;
}) {
  const { email, phone, phoneDisplay } = siteConfig.contact;
  const wa = whatsappLink("Hi Mavqo Digital, I have a question.");
  const hasDirect = Boolean(email || phone || wa);

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="kicker">{eyebrow}</p>
          <h1 className="text-h1 mt-4">{title}</h1>
          <p className="text-lead mt-5 text-ink-soft">{intro}</p>

          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-ink-soft">What happens next</h2>
          <ol className="mt-5 space-y-5">
            {points.map((p, i) => (
              <li key={p} className="flex gap-4">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-wash text-sm font-black text-teal-ink">{i + 1}</span>
                <span className="pt-1 text-ink">{p}</span>
              </li>
            ))}
          </ol>

          {hasDirect && (
            <div className="mt-10 border-t border-line pt-6">
              <p className="font-bold text-heading">Prefer to talk directly?</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {wa && (
                  <li>
                    <TrackedContactLink kind="whatsapp" href={wa} className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
                      <MessageCircle aria-hidden="true" className="size-4 text-[#1fa855]" /> WhatsApp
                    </TrackedContactLink>
                  </li>
                )}
                {phone && (
                  <li>
                    <TrackedContactLink kind="phone" href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
                      <Phone aria-hidden="true" className="size-4 text-teal-ink" /> {phoneDisplay}
                    </TrackedContactLink>
                  </li>
                )}
                {email && (
                  <li>
                    <TrackedContactLink kind="email" href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
                      <Mail aria-hidden="true" className="size-4 text-teal-ink" /> {email}
                    </TrackedContactLink>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-md sm:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1.5rem] font-black tracking-tight text-heading">{formTitle}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-ink-soft">
              <Clock aria-hidden="true" className="size-3.5" /> Takes about a minute
            </span>
          </div>
          {children}
        </div>
      </div>
    </Container>
  );
}
