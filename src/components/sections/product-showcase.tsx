"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { ArrowIcon, buttonClasses } from "@/components/ui/button";
import { CheckList } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type ShowcaseItem = {
  slug: string;
  tab: string;
  name: string;
  icon: IconName;
  image: { src: string; alt: string; position?: string };
  summary: string;
  audience: string;
  highlights: string[];
  demo: boolean;
};

/** Accessible tabs (WAI-ARIA pattern, arrow-key navigation) showing one product at a time. */
export function ProductShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Home" || e.key === "End" || delta) {
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (active + delta + items.length) % items.length;
      setActive(next);
      tabsRef.current[next]?.focus();
    }
  };

  const item = items[active];

  return (
    <div>
      <div role="tablist" aria-label="Software products" onKeyDown={onKeyDown} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map((it, i) => (
          <button
            key={it.slug}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            role="tab"
            id={`${baseId}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[0.9375rem] font-bold transition-colors",
              i === active ? "bg-primary text-on-primary shadow-sm" : "bg-surface text-ink ring-1 ring-inset ring-line hover:text-heading hover:ring-line-strong",
            )}
          >
            <Icon name={it.icon} className="size-4" />
            {it.tab}
          </button>
        ))}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-8 grid overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="relative min-h-72 lg:min-h-[30rem]">
          {items.map((it, i) => (
            <Image
              key={it.slug}
              src={it.image.src}
              alt={i === active ? it.image.alt : ""}
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              style={it.image.position ? { objectPosition: it.image.position } : undefined}
              className={cn("object-cover transition-opacity duration-500", i === active ? "opacity-100" : "opacity-0")}
              aria-hidden={i !== active}
            />
          ))}
          <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-bold text-navy shadow-md">
            For {item.audience}
          </div>
        </div>
        <div className="flex flex-col p-7 sm:p-10">
          <h3 className="text-[1.75rem] font-black leading-tight tracking-tight text-heading">{item.name}</h3>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">{item.summary}</p>
          <CheckList className="mt-7" items={item.highlights} />
          <div className="mt-auto flex flex-col gap-3 pt-9 sm:flex-row">
            <Link href={`/software/${item.slug}/`} className={buttonClasses("primary", "md")}>
              Explore {item.tab} <ArrowIcon />
            </Link>
            {item.demo && (
              <Link href={`/request-demo/?product=${item.slug}`} className={buttonClasses("secondary", "md")}>
                Book a live demo
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
