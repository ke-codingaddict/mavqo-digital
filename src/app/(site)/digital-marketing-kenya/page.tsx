import { siteConfig } from "@/config/site";
import { getPublishedServices } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceCard } from "@/components/sections/cards";
import { ProcessSteps } from "@/components/sections/process-steps";

export const metadata = pageMetadata({
  title: "Digital Marketing Agency in Kenya",
  description:
    "SEO, Google Ads, social media marketing and conversion rate optimization for Kenyan businesses — focused on qualified leads and transparent reporting.",
  path: "/digital-marketing-kenya/",
});

const principles = [
  { title: "No guaranteed rankings", text: "Search engines control rankings. We won't pretend otherwise — we do the work that improves your odds." },
  { title: "Fees separate from ad spend", text: "You always see exactly how much goes to Google or Meta, and how much is our fee." },
  { title: "Your accounts, your data", text: "Ad accounts and analytics stay in your business's name." },
  { title: "Measured in enquiries", text: "Conversion tracking comes first, so results are counted in leads — not just clicks." },
];

export default function DigitalMarketingPage() {
  const services = getPublishedServices("digital_marketing");
  const consult = siteConfig.offersFreeConsultation;
  return (
    <>
      <PageHero
        crumbs={[{ name: "Digital Marketing", path: "/digital-marketing-kenya/" }]}
        eyebrow="Digital marketing"
        title="Marketing that's measured in enquiries, not likes"
        intro="We help Kenyan businesses get found, win attention and turn it into conversations — through SEO, Google Ads, social media and conversion optimization."
        image={{ src: "/images/google-ads.jpg", alt: "Team planning a marketing campaign with sticky notes" }}
        actions={
          <>
            <ButtonLink href="/request-quote/?service=seo-services-kenya" size="lg">
              {consult ? "Get a free consultation" : "Get a quote"} <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="#services" variant="secondary" size="lg">
              Explore services
            </ButtonLink>
          </>
        }
      />
      <Section id="services" labelledBy="services-heading" className="scroll-mt-24">
        <SectionHeading id="services-heading" eyebrow="Services" title="Four ways we help you grow" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </Section>
      <Section tone="inverse" labelledBy="principles-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <SectionHeading id="principles-heading" inverse eyebrow="Our principles" title="Marketing you can trust" intro="We'd rather earn your business with honesty than with promises nobody can keep." />
          <ul className="grid gap-8 sm:grid-cols-2">
            {principles.map((p) => (
              <li key={p.title} className="border-t border-white/15 pt-5">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 leading-relaxed">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section labelledBy="process-heading">
        <SectionHeading id="process-heading" eyebrow="How we work" title="From audit to measurable growth" />
        <ProcessSteps
          className="mt-14"
          steps={[
            { title: "Audit", description: "We review your website, tracking, competitors and current results." },
            { title: "Plan", description: "We agree goals, channels and budgets in a written proposal." },
            { title: "Execute", description: "We launch campaigns, publish content and make improvements." },
            { title: "Report & improve", description: "Plain-language monthly reports and continuous optimization." },
          ]}
        />
      </Section>
    </>
  );
}
