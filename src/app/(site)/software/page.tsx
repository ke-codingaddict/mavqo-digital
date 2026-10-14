import { getPublicProducts } from "@/content/products";
import { pageMetadata } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";
import { ProductCard } from "@/components/sections/cards";
import { ProcessSteps } from "@/components/sections/process-steps";

export const metadata = pageMetadata({
  title: "Business Management Software in Kenya",
  description:
    "School, hospital and clinic, restaurant, POS and inventory management software for Kenyan organizations. See any system in a live demo before you commit.",
  path: "/software/",
});

export default function SoftwarePage() {
  const products = getPublicProducts();
  return (
    <>
      <PageHero
        crumbs={[{ name: "Software", path: "/software/" }]}
        eyebrow="Business software"
        title="Software that fits the way you already work"
        intro="Replace paperwork, spreadsheets and disconnected tools with systems your team will actually use — and see each one working in a live demo before you decide."
        image={{ src: "/images/hero-team.webp", alt: "Team of colleagues working together at computers in a modern office" }}
        actions={
          <>
            <ButtonLink href="/request-demo/" size="lg">
              Book a live demo <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="#products" variant="secondary" size="lg">
              Browse systems
            </ButtonLink>
          </>
        }
      />
      <Section id="products" labelledBy="products-heading" className="scroll-mt-24">
        <SectionHeading id="products-heading" eyebrow="Choose your system" title="Built for your sector" intro="Pick a system to see who it's for, what it does and how getting started works." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>
      <Section tone="inverse" labelledBy="onboarding-heading">
        <SectionHeading id="onboarding-heading" inverse eyebrow="Getting started" title="From first demo to go-live" intro="A clear path with no surprises — so your team is confident from day one." />
        <ProcessSteps
          inverse
          className="mt-14"
          steps={[
            { title: "Live demo", description: "We show you the system with sample data, focused on your workflows." },
            { title: "Proposal", description: "A written quote covering modules, timelines and support." },
            { title: "Set-up & training", description: "We configure the system, help migrate data and train your staff." },
            { title: "Go-live & support", description: "We're with you through launch and beyond." },
          ]}
        />
      </Section>
    </>
  );
}
