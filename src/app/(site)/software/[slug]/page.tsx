import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Headset, MonitorPlay, Quote } from "lucide-react";
import { canRequestDemo, getProduct, getPublicProducts, isAvailable, statusLabel } from "@/content/products";
import { demoProductOptions } from "@/content/form-options";
import { pageMetadata, softwareJsonLd } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Badge, CheckList, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { PageHero } from "@/components/sections/page-hero";
import { ProductCard } from "@/components/sections/cards";
import { FaqSection } from "@/components/sections/faq";
import { SectionNav } from "@/components/sections/section-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadForm } from "@/components/forms/lead-form";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublicProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return pageMetadata({ title: product.seoTitle, description: product.seoDescription, path: `/software/${product.slug}/` });
}

const pricingCopy = {
  subscription: "Simple subscription pricing based on the modules and number of users you need.",
  licence: "A one-time licence with optional annual support, sized to your organization.",
  custom_quote:
    "Pricing depends on the modules you choose, your number of users or branches, and the support you need. After your demo you'll get a clear, written quote — no hidden costs.",
};

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const path = `/software/${product.slug}/`;
  const available = isAvailable(product);
  const demo = canRequestDemo(product);
  const related = product.related.map((slug) => getProduct(slug)).filter((p) => p !== undefined);
  const short = product.shortName === "POS" ? "POS" : product.shortName.toLowerCase();

  const navLinks = [
    { label: "Who it's for", href: "#overview" },
    ...(product.features.length ? [{ label: "Features", href: "#features" }] : []),
    ...(available ? [{ label: "Getting started", href: "#onboarding" }, { label: "Pricing", href: "#pricing" }] : []),
    { label: "FAQs", href: "#faq" },
  ];

  return (
    <>
      <PageHero
        crumbs={[
          { name: "Software", path: "/software/" },
          { name: product.name, path },
        ]}
        eyebrow={
          <>
            {product.industry}
            <Badge tone={available ? "teal" : "sun"}>{statusLabel(product.status)}</Badge>
          </>
        }
        title={available ? product.seoTitle : product.name}
        intro={product.description}
        image={product.image}
        actions={
          demo ? (
            <>
              <ButtonLink href="#demo" size="lg">
                Book a live demo <ArrowIcon />
              </ButtonLink>
              <ButtonLink href="#features" variant="secondary" size="lg">
                See what it does
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href="#demo" size="lg">
              Join the early-access list <ArrowIcon />
            </ButtonLink>
          )
        }
        overlay={
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-lg">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal-ink">
              <Icon name={product.icon} className="size-5" />
            </span>
            <span className="text-sm leading-snug">
              <strong className="block text-heading">{demo ? "Live demo with sample data" : "In development"}</strong>
              <span className="text-ink-soft">{demo ? "Tailored to your workflows" : "Early-access list open"}</span>
            </span>
          </div>
        }
      />

      <SectionNav links={navLinks} cta={{ label: demo ? "Book a demo" : "Join early access", href: "#demo" }} />

      {/* Who it's for + problems */}
      <Section id="overview" labelledBy="fit-heading" className="scroll-mt-36">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading id="fit-heading" eyebrow="Who it's for" title={`Built for ${product.industry.toLowerCase()}`} />
            <CheckList className="mt-8 text-lg" items={product.audience} />
          </div>
          <div className="rounded-[var(--radius-xl)] bg-surface-2 p-8 sm:p-10">
            <Quote aria-hidden="true" className="size-8 text-sun" />
            <h2 className="mt-4 text-[1.5rem] font-black tracking-tight text-heading">Sound familiar?</h2>
            <ul className="mt-6 space-y-4">
              {product.problems.map((p) => (
                <li key={p} className="border-l-2 border-sun pl-4 text-lg text-ink">
                  {p}
                </li>
              ))}
            </ul>
            {available && <p className="mt-8 font-bold text-heading">{product.name} is built to fix exactly this.</p>}
          </div>
        </div>
      </Section>

      {/* Features */}
      {product.features.length > 0 && (
        <Section id="features" tone="surface" labelledBy="features-heading" className="scroll-mt-36 border-y border-line">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <div className="lg:sticky lg:top-40 lg:self-start">
              <SectionHeading id="features-heading" eyebrow="Features" title="Everything in one place" intro="Choose the modules you need today and add more as you grow." />
              {demo && (
                <ButtonLink href="#demo" variant="secondary" className="mt-8">
                  See it in a live demo
                </ButtonLink>
              )}
            </div>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {product.features.map((f, i) => (
                <li key={f.title} className="border-t border-line py-6">
                  <span className="text-sm font-black text-teal-ink">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg font-bold text-heading">{f.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink-soft">{f.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* Screenshots (shown once real ones are added to the product content) */}
      {available && product.screenshots.length > 0 && (
        <Section labelledBy="see-heading">
          <SectionHeading id="see-heading" eyebrow="Screenshots" title="Take a look inside" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {product.screenshots.map((s) => (
              <div key={s.src} className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)] border border-line">
                <Image src={s.src} alt={s.alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Onboarding + pricing + support */}
      {available && (
        <Section id="onboarding" labelledBy="onboarding-heading" className="scroll-mt-36">
          <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
            <div>
              <SectionHeading id="onboarding-heading" eyebrow="Getting started" title="From first demo to go-live" />
              <ol className="relative mt-10 space-y-8 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-line-strong">
                {product.onboarding.map((step, i) => (
                  <li key={step} className="relative flex gap-5">
                    <span className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-on-primary ring-4 ring-canvas">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-lg text-ink">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div id="pricing" className="scroll-mt-36 space-y-5">
              <div className="rounded-[var(--radius-xl)] bg-inverse p-8 text-on-inverse-soft">
                <h2 className="text-[1.5rem] font-black tracking-tight text-on-inverse">Pricing</h2>
                <p className="mt-3 leading-relaxed">{pricingCopy[product.pricingModel]}</p>
                <ButtonLink href="#demo" variant="accent" className="mt-6">
                  Get my quote <ArrowIcon />
                </ButtonLink>
              </div>
              <div className="flex gap-4 rounded-[var(--radius-xl)] border border-line bg-surface p-8">
                <Headset aria-hidden="true" className="size-7 shrink-0 text-teal-ink" />
                <div>
                  <h2 className="text-lg font-bold text-heading">Training & support included</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">
                    Your team is trained at go-live and can reach us when they need help. Support terms are set out clearly in your proposal.
                  </p>
                </div>
              </div>
              {product.screenshots.length === 0 && (
                <div className="flex gap-4 rounded-[var(--radius-xl)] border border-line bg-surface p-8">
                  <MonitorPlay aria-hidden="true" className="size-7 shrink-0 text-teal-ink" />
                  <div>
                    <h2 className="text-lg font-bold text-heading">See it working — live</h2>
                    <p className="mt-2 leading-relaxed text-ink-soft">We&apos;ll walk you through the real system with sample data and answer questions as we go.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      <Section id="faq" tone="muted" labelledBy="faq-heading" className="scroll-mt-36">
        <FaqSection faqs={product.faqs} title={`${product.shortName === "POS" ? "POS" : product.shortName} system FAQs`} />
      </Section>

      {/* Demo / waitlist form */}
      <section id="demo" aria-labelledby="demo-heading" className="scroll-mt-36 py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <p className="kicker">{demo ? "Live demo" : "Early access"}</p>
            <h2 id="demo-heading" className="text-h2 mt-4">
              {demo ? `See the ${short} system in action` : `Be first to see ${product.name}`}
            </h2>
            <p className="text-lead mt-5 text-ink-soft">
              {demo
                ? "Tell us a little about your organization and we'll arrange a walkthrough at a time that suits you."
                : "Join the early-access list and we'll contact you as soon as demos are available."}
            </p>
            {demo && <CheckList className="mt-8" items={["Tailored to your workflows", "Sample data — never real records", "No obligation to buy"]} />}
            <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] lg:block">
              <Image src={product.image.src} alt="" fill sizes="40vw" className="object-cover" />
            </div>
          </div>
          <div className="self-start rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-md sm:p-10">
            <LeadForm type={demo ? "demo" : "waitlist"} productOptions={demoProductOptions()} defaultProduct={product.slug} lockProduct />
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <Section tone="muted" labelledBy="related-heading">
          <SectionHeading id="related-heading" eyebrow="Works well with" title="Related software" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      )}

      {available && (
        <JsonLd data={softwareJsonLd({ name: product.name, description: product.seoDescription, path, category: product.industry })} />
      )}
    </>
  );
}
