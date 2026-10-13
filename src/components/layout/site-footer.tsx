import Link from "next/link";
import { cacheLife } from "next/cache";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPublicProducts } from "@/content/products";
import { getPublishedServices } from "@/content/services";
import { Container } from "@/components/ui/primitives";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { TrackedContactLink } from "@/components/analytics/tracked-contact-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Logo } from "./logo";

const socialLabels: Record<keyof typeof siteConfig.social, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
};

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-on-inverse">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[0.9375rem] text-on-inverse-soft transition-colors hover:text-on-inverse">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { email, phone, location, businessHours } = siteConfig.contact;
  const socials = (Object.keys(siteConfig.social) as (keyof typeof siteConfig.social)[]).filter((k) => siteConfig.social[k]);
  const hasContact = Boolean(email || phone || location || businessHours);

  return (
    <footer className="bg-inverse text-on-inverse-soft">
      <Container>
        {/* Closing call to action */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div className="max-w-2xl">
            <p className="text-lg font-bold text-teal">Have a project in mind?</p>
            <p className="text-h2 mt-3 !text-on-inverse">Let&apos;s figure out the right next step — together.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/request-demo/" variant="accent" size="lg">
              Book a demo <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/request-quote/" variant="inverseOutline" size="lg">
              {siteConfig.offersFreeConsultation ? "Free consultation" : "Get a quote"}
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-12 py-14 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Logo onInverse />
            <p className="mt-5 leading-relaxed">{siteConfig.description}</p>
            {hasContact && (
              <ul className="mt-6 space-y-3 text-[0.9375rem]">
                {phone && (
                  <li className="flex items-center gap-3">
                    <Phone aria-hidden="true" className="size-4 text-teal" />
                    <TrackedContactLink kind="phone" href={`tel:${phone}`} className="hover:text-on-inverse">
                      {phone}
                    </TrackedContactLink>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-3">
                    <Mail aria-hidden="true" className="size-4 text-teal" />
                    <TrackedContactLink kind="email" href={`mailto:${email}`} className="hover:text-on-inverse">
                      {email}
                    </TrackedContactLink>
                  </li>
                )}
                {location && (
                  <li className="flex items-center gap-3">
                    <MapPin aria-hidden="true" className="size-4 text-teal" />
                    {location}
                  </li>
                )}
                {businessHours && (
                  <li className="flex items-center gap-3">
                    <Clock aria-hidden="true" className="size-4 text-teal" />
                    {businessHours}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <FooterColumn title="Software" links={getPublicProducts().map((p) => ({ label: p.shortName === "POS" ? "POS System" : p.shortName, href: `/software/${p.slug}/` }))} />
            <FooterColumn title="Marketing" links={getPublishedServices("digital_marketing").map((s) => ({ label: s.name, href: s.href }))} />
            <FooterColumn
              title="Web"
              links={[...getPublishedServices("web_development").map((s) => ({ label: s.name, href: s.href })), { label: "Pricing", href: "/pricing/" }]}
            />
            <FooterColumn
              title="Company"
              links={[
                { label: "About us", href: "/about/" },
                { label: "Industries", href: "/industries/" },
                { label: "Guides & articles", href: "/blog/" },
                { label: "Contact", href: "/contact/" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            © <CurrentYear /> {siteConfig.legalName}. {siteConfig.tagline}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {socials.map((k) => (
              <a key={k} href={siteConfig.social[k]!} className="hover:text-on-inverse" rel="noopener noreferrer" target="_blank">
                {socialLabels[k]}
              </a>
            ))}
            <Link href="/privacy-policy/" className="hover:text-on-inverse">Privacy</Link>
            <Link href="/terms-of-service/" className="hover:text-on-inverse">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-on-inverse" prefetch={false}>Sitemap</Link>
            <ThemeToggle onInverse />
          </div>
        </div>
      </Container>
    </footer>
  );
}
