import Link from "next/link";
import { Container } from "@/components/ui/primitives";
import { buttonClasses } from "@/components/ui/button";

/** Sticky in-page navigation so visitors can jump straight to what they care about. */
export function SectionNav({ links, cta }: { links: { label: string; href: string }[]; cta?: { label: string; href: string } }) {
  return (
    <div className="sticky top-[4.75rem] z-30 border-b border-line bg-canvas">
      <Container className="flex h-14 items-center justify-between gap-4">
        <nav aria-label="On this page" className="-mx-1 min-w-0 overflow-x-auto">
          <ul className="flex items-center gap-1 px-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-2 hover:text-heading">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {cta && (
          <Link href={cta.href} className={buttonClasses("primary", "sm", "hidden shrink-0 sm:inline-flex")}>
            {cta.label}
          </Link>
        )}
      </Container>
    </div>
  );
}
