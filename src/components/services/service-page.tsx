import Image from "next/image";
import { Info } from "lucide-react";
import type { Service } from "@/content/types";
import { siteConfig } from "@/config/site";
import { getPublishedServices } from "@/content/services";
import { quoteServiceOptions } from "@/content/form-options";
import { serviceJsonLd, type Crumb } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { CheckList, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { PageHero } from "@/components/sections/page-hero";
import { ProcessSteps } from "@/components/sections/process-steps";
import { FaqSection } from "@/components/sections/faq";
import { ServiceCard } from "@/components/sections/cards";
import { SectionNav } from "@/components/sections/section-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadForm } from "@/components/forms/lead-form";

export function ServicePage({ service, crumbs }: { service: Service; crumbs: Crumb[] }) {
  const isMarketing = service.division === "digital_marketing";
  const others = getPublishedServices(service.division).filter((s) => s.slug !== service.slug);
  const consult = siteConfig.offersFreeConsultation;
  const ctaLabel = consult ? "Get a free consultation" : "Get a quote";

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={isMarketing ? "Digital marketing" : "Web development"}
        title={service.seoTitle}
        intro={service.description}
        image={service.image}
        actions={
          <>
            <ButtonLink href="#get-started" size="lg">
              {ctaLabel} <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="#included" variant="secondary" size="lg">
              What&apos;s included
            </ButtonLink>
          </>
        }
        overlay={
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-lg">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal-ink">
              <Icon name={service.icon} className="size-5" />
            </span>
            <span className="text-sm leading-snug">
              <strong className="block text-heading">{consult ? "Free first consultation" : "Clear written quote"}</strong>
              <span className="text-ink-soft">No obligation to proceed</span>
            </span>
          </div>
        }
      />

      <SectionNav
        links={[
          { label: "Benefits", href: "#benefits" },
          { label: "What's included", href: "#included" },
          { label: "Process", href: "#process" },
          { label: "FAQs", href: "#faq" },
        ]}
        cta={{ label: consult ? "Free consultation" : "Get a quote", href: "#get-started" }}
      />

      <Section id="benefits" labelledBy="benefits-heading" className="scroll-mt-36">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading id="benefits-heading" eyebrow="Why it matters" title="What you can expect" />
          <CheckList className="text-lg" columns items={service.benefits} />
        </div>
      </Section>

      <Section id="included" tone="surface" labelledBy="included-heading" className="scroll-mt-36 border-y border-line">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <SectionHeading id="included-heading" eyebrow="What's included" title={`Our ${service.name.toLowerCase()}`} />
            {service.notes?.map((note) => (
              <div key={note} className="mt-8 flex gap-3 rounded-[var(--radius-md)] bg-sun-wash p-5 text-heading">
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <p className="text-[0.9375rem]">{note}</p>
              </div>
            ))}
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {service.deliverables.map((d, i) => (
              <li key={d.title} className="border-t border-line py-6">
                <span className="text-sm font-black text-teal-ink">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-lg font-bold text-heading">{d.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{d.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="process" labelledBy="process-heading" className="scroll-mt-36">
        <SectionHeading id="process-heading" eyebrow="Our process" title="How we work with you" />
        <ProcessSteps className="mt-14" steps={service.process} />
      </Section>

      <Section id="faq" tone="muted" labelledBy="faq-heading" className="scroll-mt-36">
        <FaqSection faqs={service.faqs} />
      </Section>

      <section id="get-started" aria-labelledby="start-heading" className="scroll-mt-36 py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <p className="kicker">{consult ? "Free consultation" : "Get a quote"}</p>
            <h2 id="start-heading" className="text-h2 mt-4">
              Let&apos;s talk about your goals
            </h2>
            <p className="text-lead mt-5 text-ink-soft">
              Share a few details and we&apos;ll come back with practical recommendations{consult ? " — free and with no obligation." : "."}
            </p>
            <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] lg:block">
              <Image src={service.image.src} alt="" fill sizes="40vw" className="object-cover" />
            </div>
          </div>
          <div className="self-start rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-md sm:p-10">
            <LeadForm type={isMarketing ? "marketing" : "quote"} serviceOptions={quoteServiceOptions()} defaultService={service.slug} />
          </div>
        </Container>
      </section>

      {others.length > 0 && (
        <Section tone="muted" labelledBy="others-heading">
          <SectionHeading id="others-heading" eyebrow="Explore more" title={isMarketing ? "More ways to grow" : "More web services"} />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </Section>
      )}

      <JsonLd
        data={serviceJsonLd({
          name: service.name,
          description: service.seoDescription,
          path: service.href,
          serviceType: isMarketing ? "Digital marketing" : "Web development",
        })}
      />
    </>
  );
}
