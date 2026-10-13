import { Boxes, ChartLine, Monitor } from "lucide-react";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { CheckList, Section } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { FaqSection } from "@/components/sections/faq";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "How pricing works for Mavqo Digital's business software, websites and digital marketing — clear, written quotes based on what you actually need.",
  path: "/pricing/",
});

// Published prices can be added here once they are approved.
const models = [
  {
    icon: Boxes,
    title: "Business software",
    model: "Per module & user",
    summary: "Priced by the modules you need, your number of users or branches, and your support level.",
    points: ["Live demo before any commitment", "Only pay for modules you use", "Set-up, training & data migration scoped upfront", "Clear ongoing support terms"],
    cta: { label: "Book a demo", href: "/request-demo/" },
    featured: true,
  },
  {
    icon: Monitor,
    title: "Websites & e-commerce",
    model: "Fixed project price",
    summary: "One agreed price based on the size and features of your site, with optional maintenance.",
    points: ["Price agreed before work starts", "SEO foundations & analytics included", "Training so you can update content", "Optional monthly maintenance"],
    cta: { label: "Get a website quote", href: "/request-quote/?service=website-design-kenya" },
  },
  {
    icon: ChartLine,
    title: "Digital marketing",
    model: "Monthly management fee",
    summary: "A monthly fee based on scope. Ad spend is always separate and paid directly to the platform.",
    points: ["Fee separate from ad spend", "Ad accounts stay in your name", "Monthly reporting included", "Scope agreed in writing"],
    cta: { label: "Get a marketing quote", href: "/request-quote/?service=google-ads-management-kenya" },
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Pricing", path: "/pricing/" }]}
        eyebrow="Pricing"
        title="Clear pricing, tailored to what you actually need"
        intro="Every organization is different, so we price on your real requirements — and always put it in writing before any work starts."
      />
      <Section labelledBy="models-heading">
        <h2 id="models-heading" className="sr-only">
          How each service is priced
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {models.map(({ icon: I, title, model, summary, points, cta, featured }) => (
            <div
              key={title}
              className={cn(
                "flex flex-col rounded-[var(--radius-xl)] p-8",
                featured ? "bg-inverse text-on-inverse-soft shadow-lg" : "border border-line bg-surface",
              )}
            >
              <I aria-hidden="true" className={cn("size-7", featured ? "text-teal" : "text-teal-ink")} />
              <h3 className={cn("mt-5 text-xl font-black", featured ? "text-on-inverse" : "text-heading")}>{title}</h3>
              <p className={cn("mt-1 text-sm font-bold", featured ? "text-teal" : "text-teal-ink")}>{model}</p>
              <p className="mt-4 leading-relaxed">{summary}</p>
              <CheckList tone={featured ? "light" : "teal"} className="mt-6 flex-1" items={points} />
              <ButtonLink href={cta.href} variant={featured ? "accent" : "primary"} className="mt-8 w-full">
                {cta.label} <ArrowIcon />
              </ButtonLink>
            </div>
          ))}
        </div>
      </Section>
      <Section tone="muted" labelledBy="faq-heading">
        <FaqSection
          title="Pricing questions"
          faqs={[
            { question: "Why don't you list fixed prices?", answer: "Costs depend heavily on scope — the modules, users and branches for software, or the size of a website or marketing programme. Rather than publish numbers that won't apply to you, we give you a clear written quote for your situation." },
            { question: "How quickly will I get a quote?", answer: "After a short conversation (or a demo for software) we'll send a written proposal setting out scope, timelines and costs." },
            { question: "Are there hidden costs?", answer: "No. Your proposal lists set-up, licence or subscription, training, support and any third-party costs (like ad spend or domain names) separately." },
            ...(siteConfig.offersFreeConsultation
              ? [{ question: "Is the first consultation really free?", answer: "Yes. The first consultation is free and there's no obligation to proceed." }]
              : []),
          ]}
        />
      </Section>
    </>
  );
}
