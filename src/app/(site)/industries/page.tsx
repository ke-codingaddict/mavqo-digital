import Image from "next/image";
import Link from "next/link";
import { industries } from "@/content/industries";
import { getProduct } from "@/content/products";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/primitives";
import { ArrowIcon } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageHero } from "@/components/sections/page-hero";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Industries We Serve",
  description:
    "Software and digital marketing solutions for Kenyan schools, hospitals and clinics, restaurants, retailers, wholesalers and SMEs.",
  path: "/industries/",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "Industries", path: "/industries/" }]}
        eyebrow="Industries"
        title="Solutions shaped around your sector"
        intro="Every industry runs differently. We pair the right management software with the right online growth plan for yours."
      >
        <nav aria-label="Jump to industry" className="mt-8 flex flex-wrap gap-2">
          {industries.map((ind) => (
            <a key={ind.slug} href={`#${ind.slug}`} className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-heading ring-1 ring-inset ring-line hover:ring-line-strong">
              <Icon name={ind.icon} className="size-4 text-teal-ink" /> {ind.name}
            </a>
          ))}
        </nav>
      </PageHero>
      <Container className="space-y-20 py-16 sm:space-y-28 sm:py-24">
        {industries.map((ind, i) => {
          const products = ind.products.map((s) => getProduct(s)).filter((p) => p !== undefined);
          const services = ind.services.map((s) => getService(s)).filter((s) => s !== undefined);
          return (
            <section key={ind.slug} id={ind.slug} aria-labelledby={`${ind.slug}-heading`} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]", i % 2 === 1 && "lg:order-2")}>
                <Image src={ind.image.src} alt={ind.image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              </div>
              <div>
                <p className="kicker">
                  <Icon name={ind.icon} className="size-4" />
                </p>
                <h2 id={`${ind.slug}-heading`} className="text-h2 mt-3">
                  {ind.name}
                </h2>
                <p className="text-lead mt-4 text-ink-soft">{ind.summary}</p>
                <p className="mt-6 text-sm font-bold text-heading">Challenges we help with</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {ind.challenges.map((c) => (
                    <li key={c} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm text-ink ring-1 ring-inset ring-line">
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {[
                    { title: "Run it better", links: products.map((p) => ({ label: p.name, href: `/software/${p.slug}/` })) },
                    { title: "Grow online", links: services.map((s) => ({ label: s.name, href: s.href })) },
                  ].map((col) => (
                    <div key={col.title}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-ink-soft">{col.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {col.links.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href} className="group inline-flex items-center gap-1.5 font-bold text-teal-ink">
                              {l.label} <ArrowIcon />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </Container>
    </>
  );
}
