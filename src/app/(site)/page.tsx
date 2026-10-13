import Image from "next/image";
import Link from "next/link";
import { CircleCheck, FileText, Handshake, Headset, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { canRequestDemo, getPublicProducts, isAvailable } from "@/content/products";
import { getPublishedServices } from "@/content/services";
import { homeFaqs, industries } from "@/content/industries";
import { getPublishedPosts } from "@/content/blog/posts";
import { quoteServiceOptions } from "@/content/form-options";
import { pageMetadata } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, CheckList } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { BlogCard } from "@/components/sections/cards";
import { ProcessSteps } from "@/components/sections/process-steps";
import { FaqSection } from "@/components/sections/faq";
import { ProductShowcase, type ShowcaseItem } from "@/components/sections/product-showcase";
import { LeadForm } from "@/components/forms/lead-form";
import { HeroScene } from "@/components/hero/hero-scene";
import type { SceneProduct } from "@/components/hero/scene-engine";

export const metadata = pageMetadata({
  title: "Mavqo Digital — Business Software, Websites & Digital Marketing in Kenya",
  absoluteTitle: true,
  description:
    "School, hospital, restaurant, POS and inventory management software, plus website development, SEO and Google Ads for Kenyan organizations. Book a live demo.",
  path: "/",
});

const paths: { icon: IconName; need: string; title: string; text: string; href: string; links: { label: string; href: string }[] }[] = [
  {
    icon: "business",
    need: "I want to run my organization better",
    title: "Business software",
    text: "Replace paperwork and spreadsheets with a system built for your sector.",
    href: "/software/",
    links: [
      { label: "Schools", href: "/software/school-management-system-kenya/" },
      { label: "Hospitals & clinics", href: "/software/hospital-management-system-kenya/" },
      { label: "Restaurants", href: "/software/restaurant-management-system-kenya/" },
      { label: "Shops & POS", href: "/software/pos-system-kenya/" },
    ],
  },
  {
    icon: "web",
    need: "I need a professional website",
    title: "Web development",
    text: "A fast, mobile-friendly website or online store that turns visitors into enquiries.",
    href: "/website-design-kenya/",
    links: [
      { label: "Business websites", href: "/website-design-kenya/" },
      { label: "Online stores", href: "/ecommerce-website-development/" },
      { label: "Pricing", href: "/pricing/" },
    ],
  },
  {
    icon: "analytics",
    need: "I want more customers online",
    title: "Digital marketing",
    text: "SEO, Google Ads and social media — measured in enquiries, not likes.",
    href: "/digital-marketing-kenya/",
    links: [
      { label: "SEO", href: "/digital-marketing-kenya/seo-services-kenya/" },
      { label: "Google Ads", href: "/digital-marketing-kenya/google-ads-management-kenya/" },
      { label: "Social media", href: "/digital-marketing-kenya/social-media-marketing-kenya/" },
    ],
  },
];

const process = [
  { title: "We listen", description: "A short conversation about your goals, how you work today and what's getting in the way." },
  { title: "We recommend", description: "A clear recommendation and a written quote — no jargon and no surprises." },
  { title: "We deliver", description: "Set-up, build or launch, with training and regular updates along the way." },
  { title: "We stay", description: "Support after go-live, and improvements based on real results." },
];

const commitments = [
  { icon: Handshake, title: "See it before you commit", text: "Live demos with sample data, tailored to you." },
  { icon: FileText, title: "Quotes in writing", text: "Scope, timelines and costs agreed up front." },
  { icon: ShieldCheck, title: "Your data, protected", text: "Role-based access and careful data handling." },
  { icon: Headset, title: "Real people to help", text: "Training at go-live and support when you need it." },
];

const tabNames: Record<string, string> = {
  "school-management-system-kenya": "Schools",
  "hospital-management-system-kenya": "Hospitals",
  "restaurant-management-system-kenya": "Restaurants",
  "pos-system-kenya": "Shops (POS)",
  "inventory-management-software-kenya": "Inventory",
};

export default function HomePage() {
  const products = getPublicProducts();
  const showcase: ShowcaseItem[] = products.filter(isAvailable).map((p) => ({
    slug: p.slug,
    tab: tabNames[p.slug] ?? p.shortName,
    name: p.name,
    icon: p.icon,
    image: p.showcaseImage ?? p.image,
    summary: p.summary,
    // Lower-case the first letter for "For …", but keep acronyms such as "CBC".
    audience: /^[A-Z]{2}/.test(p.audience[0]) ? p.audience[0] : p.audience[0][0].toLowerCase() + p.audience[0].slice(1),
    highlights: p.features.slice(0, 4).map((f) => f.title),
    demo: canRequestDemo(p),
  }));
  const sceneProducts: SceneProduct[] = products.filter(isAvailable).map((p) => ({
    key: p.icon,
    label: tabNames[p.slug] ?? p.shortName,
    href: `/software/${p.slug}/`,
    features: p.features.slice(0, 3).map((f) => f.title),
  }));
  const comingSoon = products.filter((p) => !isAvailable(p));
  const marketing = getPublishedServices("digital_marketing");
  const web = getPublishedServices("web_development");
  const posts = getPublishedPosts().slice(0, 3);
  const free = siteConfig.offersFreeConsultation;

  return (
    <>
      {/* ───────────── Hero banner with playable 3D scene ───────────── */}
      <section aria-labelledby="hero-heading" className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[var(--radius-xl)] bg-[radial-gradient(120%_90%_at_78%_40%,#15305a_0%,#0b1a31_58%)] text-white">
          <Container className="grid items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="relative z-10 flex flex-col justify-center pb-6 pt-14 sm:pt-16 lg:pb-32 lg:pt-20">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white/90 ring-1 ring-inset ring-white/20">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />
                Software · Websites · Marketing — made for Kenya
              </p>
              <h1 id="hero-heading" className="text-display mt-6 !text-white">
                Build smarter. <span className="text-teal">Grow faster.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-white/80 sm:text-lg">
                The software that runs schools, clinics, restaurants and shops — and the websites and marketing that
                bring them new customers. One team, from first demo to real results.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/request-demo/" variant="accent" size="lg">
                  Book a free demo <ArrowIcon />
                </ButtonLink>
                <ButtonLink href="#what-do-you-need" variant="inverseOutline" size="lg">
                  Find the right solution
                </ButtonLink>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
                {["Live demos with sample data", "Clear written quotes", free ? "Free first consultation" : "Training included"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CircleCheck aria-hidden="true" className="size-4 text-teal" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <HeroScene products={sceneProducts} className="-mx-4 h-[24rem] sm:-mx-6 sm:h-[28rem] lg:mx-0 lg:-mr-8 lg:h-auto lg:min-h-[40rem]" />
          </Container>
        </div>

        {/* Product shortcuts overlapping the banner's bottom edge */}
        <Container className="relative z-10 -mt-16 sm:-mt-20">
          <nav aria-label="Our software" className="rounded-[var(--radius-lg)] border border-line bg-surface p-2 shadow-lg">
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
              {showcase.map((s) => (
                <li key={s.slug}>
                  <Link href={`/software/${s.slug}/`} className="group flex items-center gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-surface-2">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal-ink transition-colors group-hover:bg-teal group-hover:text-[#08131f]">
                      <Icon name={s.icon} className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-semibold text-heading">{s.tab}</span>
                      <span className="block text-xs text-ink-soft">Live demo available</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      {/* ───────────── Path chooser ───────────── */}
      <section id="what-do-you-need" aria-labelledby="paths-heading" className="scroll-mt-24 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading id="paths-heading" eyebrow="Start here" title="What do you need help with?" />
            <p className="max-w-sm text-ink-soft">Pick the one that sounds most like you — we&apos;ll take it from there.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {paths.map((p) => (
              <div key={p.title} className="group relative flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface p-7 transition-[border-color,box-shadow] hover:border-teal hover:shadow-md">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-on-primary">
                  <Icon name={p.icon} className="size-6" />
                </span>
                <p className="mt-6 text-lg font-semibold leading-snug tracking-tight text-heading">&ldquo;{p.need}&rdquo;</p>
                <p className="mt-2 text-ink-soft">{p.text}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {p.links.map((l) => (
                    <li key={l.href} className="relative z-10">
                      <Link href={l.href} className="inline-block rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-inset ring-line hover:text-heading hover:ring-line-strong">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="mt-auto inline-flex items-center gap-1.5 pt-8 font-bold text-teal-ink after:absolute after:inset-0">
                  Explore {p.title.toLowerCase()} <ArrowIcon />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────────── Software showcase ───────────── */}
      <Section labelledBy="software-heading">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="software-heading"
            eyebrow="Business software"
            title="Software for the way your sector works"
            intro="Each system is built around real workflows — and every one can be seen live, with sample data, before you decide."
          />
          <ButtonLink href="/software/" variant="secondary" className="shrink-0">
            All software
          </ButtonLink>
        </div>
        <div className="mt-10">
          <ProductShowcase items={showcase} />
        </div>
        {comingSoon.map((p) => (
          <Link
            key={p.slug}
            href={`/software/${p.slug}/`}
            className="group mt-5 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-line-strong p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="mr-2 rounded-full bg-sun-wash px-2.5 py-1 text-xs font-bold text-heading">Coming soon</span>
              <strong className="text-heading">{p.name}</strong>
              <span className="text-ink-soft"> — {p.summary}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-bold text-teal-ink">
              Join early access <ArrowIcon />
            </span>
          </Link>
        ))}
      </Section>

      {/* ───────────── Grow online ───────────── */}
      <Section tone="muted" labelledBy="growth-heading">
        <SectionHeading
          id="growth-heading"
          eyebrow="Grow online"
          title="Websites and marketing that bring in real enquiries"
          intro="Get found by the right people, make a great first impression and turn visitors into conversations — with honest reporting on what's working."
        />
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
            <Image src="/images/seo.jpg" alt="Laptop showing a website analytics dashboard" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h3 className="text-[1.75rem] font-black tracking-tight text-heading">Digital marketing</h3>
            <ul className="mt-6 border-t border-line">
              {marketing.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link href={s.href} className="group flex items-center justify-between gap-6 py-5">
                    <span>
                      <span className="block text-lg font-bold text-heading group-hover:text-teal-ink">{s.name}</span>
                      <span className="mt-0.5 block text-ink-soft">{s.summary}</span>
                    </span>
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-line-strong text-heading transition-colors group-hover:bg-primary group-hover:text-on-primary group-hover:ring-transparent">
                      <ArrowIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
              <Image src="/images/web-design.jpg" alt="Developer workspace with code on multiple screens" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          </div>
          <div className="lg:order-1">
            <h3 className="text-[1.75rem] font-black tracking-tight text-heading">Web development</h3>
            <ul className="mt-6 border-t border-line">
              {web.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link href={s.href} className="group flex items-center justify-between gap-6 py-5">
                    <span>
                      <span className="block text-lg font-bold text-heading group-hover:text-teal-ink">{s.name}</span>
                      <span className="mt-0.5 block text-ink-soft">{s.summary}</span>
                    </span>
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-line-strong text-heading transition-colors group-hover:bg-primary group-hover:text-on-primary group-hover:ring-transparent">
                      <ArrowIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-[var(--radius-md)] bg-surface p-4 text-[0.9375rem] text-ink ring-1 ring-inset ring-line">
              <strong className="text-heading">Every site includes:</strong> mobile-first design, SEO foundations, analytics and clear enquiry forms.
            </p>
          </div>
        </div>
      </Section>

      {/* ───────────── Promise ───────────── */}
      <Section tone="inverse" labelledBy="promise-heading">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
          <div>
            <p className="kicker !text-teal">Our promise</p>
            <h2 id="promise-heading" className="mt-5 text-[clamp(1.75rem,1.2rem+2.2vw,3rem)] font-black leading-[1.12] tracking-tight">
              No overnight miracles. No guaranteed rankings.
              <br />
              <span className="text-teal">Just honest advice and work you can measure.</span>
            </h2>
          </div>
          <ul className="grid gap-6 self-end sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {commitments.map(({ icon: I, title, text }) => (
              <li key={title} className="border-t border-white/15 pt-5">
                <I aria-hidden="true" className="size-6 text-teal" />
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-1">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ───────────── Process ───────────── */}
      <Section labelledBy="process-heading">
        <SectionHeading id="process-heading" eyebrow="How we work" title="Simple, transparent, and built around you" />
        <ProcessSteps steps={process} className="mt-14" />
      </Section>

      {/* ───────────── Industries ───────────── */}
      <Section tone="muted" labelledBy="industries-heading">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading id="industries-heading" eyebrow="Industries" title="Made for your sector" />
          <Link href="/industries/" className="group inline-flex items-center gap-1.5 font-bold text-teal-ink">
            See all industries <ArrowIcon />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {industries.map((ind, i) => (
            <Link
              key={ind.slug}
              href={`/industries/#${ind.slug}`}
              className={`group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-5 ${i === 0 ? "col-span-2 aspect-[16/10] lg:col-span-1 lg:aspect-[3/4]" : ""}`}
            >
              <Image src={ind.image.src} alt="" fill sizes="(min-width: 1024px) 20vw, 50vw" className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105" />
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08131f]/90 via-[#08131f]/30 to-transparent" />
              <span className="text-lg font-black leading-tight text-white">{ind.name}</span>
              <span className="mt-1 text-sm text-white/80">{ind.summary}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ───────────── FAQ ───────────── */}
      <Section labelledBy="faq-heading">
        <FaqSection faqs={homeFaqs} />
      </Section>

      {/* ───────────── Consultation ───────────── */}
      <Section tone="muted" labelledBy="consult-heading" id="consultation">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <SectionHeading
              id="consult-heading"
              eyebrow={free ? "Free consultation" : "Get in touch"}
              title="Tell us where you want to go. We'll map the way."
              intro="Share a few details and we'll get back to you to talk through your goals — then recommend the right next step."
            />
            <CheckList
              className="mt-8"
              items={["A conversation focused on your goals", "Honest advice — even if we're not the right fit", "A clear written proposal if you'd like to proceed"]}
            />
            <div className="relative mt-10 hidden aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] lg:block">
              <Image src="/images/about-team.jpg" alt="Two colleagues discussing a project at a desk" fill sizes="40vw" className="object-cover" />
            </div>
          </div>
          <div className="self-start rounded-[var(--radius-xl)] border border-line bg-surface p-6 shadow-md sm:p-10">
            <LeadForm type="quote" serviceOptions={quoteServiceOptions()} submitLabel={free ? "Book my free consultation" : "Send my request"} />
          </div>
        </div>
      </Section>

      {/* ───────────── Resources ───────────── */}
      {posts.length > 0 && (
        <Section labelledBy="resources-heading">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading id="resources-heading" eyebrow="Guides" title="Practical advice for growing organizations" />
            <Link href="/blog/" className="group inline-flex items-center gap-1.5 font-bold text-teal-ink">
              All articles <ArrowIcon />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
