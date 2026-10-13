import type { ReactNode } from "react";
import Image from "next/image";
import type { Crumb } from "@/lib/seo";
import type { Photo } from "@/content/types";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "./breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * Inner-page header. With an image: editorial split layout with a large photo.
 * Without: a calm, text-only header.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  intro,
  actions,
  image,
  overlay,
  children,
  className,
}: {
  crumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  image?: Photo;
  /** Small floating card over the photo. */
  overlay?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-line", className)}>
      <Container className={cn("pt-8 sm:pt-10", image ? "pb-14 sm:pb-20" : "pb-12 sm:pb-16")}>
        {crumbs && <Breadcrumbs crumbs={crumbs} />}
        <div className={cn("mt-8 grid items-center gap-10 sm:mt-12 lg:gap-16", image && "lg:grid-cols-[1.05fr_1fr]")}>
          <div className={cn(!image && "max-w-3xl")}>
            {eyebrow && <div className="kicker mb-5">{eyebrow}</div>}
            <h1 className="text-h1">{title}</h1>
            {intro && <p className="text-lead mt-6 max-w-xl text-ink-soft">{intro}</p>}
            {actions && <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>}
            {children}
          </div>
          {image && (
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] bg-surface-2">
                <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
              </div>
              {overlay && <div className="absolute -bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xs">{overlay}</div>}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
