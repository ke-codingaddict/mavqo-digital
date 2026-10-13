import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Page not found", robots: { index: false } };

const helpful = [
  { label: "Business software", href: "/software/" },
  { label: "Digital marketing", href: "/digital-marketing-kenya/" },
  { label: "Website design", href: "/website-design-kenya/" },
  { label: "Blog & resources", href: "/blog/" },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Container className="max-w-2xl py-20 text-center sm:py-28">
          <p className="text-6xl font-black text-teal">404</p>
          <h1 className="text-h1 mt-4">We can&apos;t find that page</h1>
          <p className="text-lead mt-4 text-ink-soft">
            It may have moved, or the link might be mistyped. Here are some places to start instead:
          </p>
          <ul className="mx-auto mt-8 grid max-w-md gap-2 text-left">
            {helpful.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between rounded-[var(--radius-md)] border border-line px-4 py-3 font-bold text-heading hover:border-teal/50">
                  {l.label} <ArrowRight aria-hidden="true" className="size-4 text-teal-ink" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/">Go to homepage</ButtonLink>
            <ButtonLink href="/contact/" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
