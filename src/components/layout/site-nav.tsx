"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import type { NavGroup } from "@/config/site";
import { ArrowIcon, buttonClasses } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

type MegaItem = { label: string; href: string; description?: string; badge?: string; icon?: IconName };
export type MegaMenus = Record<string, MegaItem[]>;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function DesktopDropdown({ group, items, pathname }: { group: NavGroup; items: MegaItem[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const id = useId();
  const ref = useRef<HTMLLIElement>(null);
  const wide = items.length > 3;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        // Mouse clicks only open (hover may already have opened it); keyboard activation (detail 0) toggles.
        onClick={(e) => setOpen((o) => (e.detail === 0 ? !o : true))}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.9375rem] font-bold transition-colors hover:bg-surface-2 hover:text-heading",
          isActive(pathname, group.href) || open ? "text-heading" : "text-ink",
        )}
      >
        {group.label}
        <ChevronDown aria-hidden="true" className={cn("size-4 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      <div id={id} hidden={!open} className={cn("absolute top-full z-50 pt-3", wide ? "-left-3 w-[46rem]" : "-left-3 w-[24rem]")}>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-lg">
          <ul className={cn("grid gap-1 p-3", wide && "grid-cols-2")}>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-surface-2">
                  {item.icon && (
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-teal-wash text-teal-ink">
                      <Icon name={item.icon} className="size-5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[0.9375rem] font-bold text-heading">
                      {item.label}
                      {item.badge && <span className="rounded-full bg-sun-wash px-2 py-0.5 text-[0.6875rem] font-bold text-heading">{item.badge}</span>}
                    </span>
                    {item.description && <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{item.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2 px-6 py-4">
            <p className="text-sm text-ink-soft">Not sure which one fits? We&apos;ll help you choose.</p>
            <Link href={group.href} className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal-ink">
              Explore all <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

export function SiteNav({ nav, menus, freeConsultation }: { nav: NavGroup[]; menus: MegaMenus; freeConsultation: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <nav aria-label="Main" className="hidden xl:block">
        <ul className="flex items-center gap-0.5">
          {nav.map((group) => {
            const items = menus[group.label] ?? group.items;
            return items?.length ? (
              <DesktopDropdown key={group.label} group={group} items={items} pathname={pathname} />
            ) : (
              <li key={group.label}>
                <Link
                  href={group.href}
                  aria-current={isActive(pathname, group.href) ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-2 text-[0.9375rem] font-bold transition-colors hover:bg-surface-2 hover:text-heading",
                    isActive(pathname, group.href) ? "text-heading" : "text-ink",
                  )}
                >
                  {group.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden items-center gap-3 xl:flex">
        <ThemeToggle />
        <Link href="/request-demo/" className={buttonClasses("primary", "md")}>
          Book a demo <ArrowIcon />
        </Link>
      </div>

      <button
        ref={toggleRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full text-heading ring-1 ring-inset ring-line xl:hidden"
        aria-expanded={mobileOpen}
        aria-controls={panelId}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((o) => !o)}
      >
        {mobileOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
      </button>

      <div id={panelId} hidden={!mobileOpen} className="fixed inset-x-0 bottom-0 top-[4.75rem] z-40 overflow-y-auto bg-canvas xl:hidden">
        <nav aria-label="Mobile" className="px-4 pb-32 pt-2 sm:px-6">
          <ul className="divide-y divide-line">
            {nav.map((group) => {
              const items = menus[group.label] ?? group.items;
              return (
                <li key={group.label}>
                  {items?.length ? (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-lg font-bold text-heading [&::-webkit-details-marker]:hidden">
                        {group.label}
                        <ChevronDown aria-hidden="true" className="size-5 text-ink-soft transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="mb-3 grid gap-1">
                        {items.map((item) => (
                          <li key={item.href}>
                            <Link href={item.href} className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 hover:bg-surface-2">
                              {item.icon && (
                                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-teal-wash text-teal-ink">
                                  <Icon name={item.icon} className="size-4" />
                                </span>
                              )}
                              <span className="flex-1 font-bold text-heading">{item.label}</span>
                              {item.badge && <span className="text-xs font-bold text-ink-soft">{item.badge}</span>}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link href={group.href} className="block px-2 py-2.5 font-bold text-teal-ink">
                            Explore all {group.label.toLowerCase()}
                          </Link>
                        </li>
                      </ul>
                    </details>
                  ) : (
                    <Link href={group.href} className="block py-4 text-lg font-bold text-heading">
                      {group.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link href="/request-demo/" className={buttonClasses("primary", "lg", "w-full")}>
              Book a demo
            </Link>
            <Link href="/request-quote/" className={buttonClasses("secondary", "lg", "w-full")}>
              {freeConsultation ? "Get a free consultation" : "Get a quote"}
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-between rounded-[var(--radius-lg)] bg-surface-2 px-4 py-3">
            <span className="text-sm font-bold text-heading">Appearance</span>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </>
  );
}
