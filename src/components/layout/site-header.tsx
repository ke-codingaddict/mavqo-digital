import { mainNav, siteConfig } from "@/config/site";
import { getPublicProducts, isAvailable, statusLabel } from "@/content/products";
import { getPublishedServices } from "@/content/services";
import { Container } from "@/components/ui/primitives";
import { Logo } from "./logo";
import { SiteNav, type MegaMenus } from "./site-nav";

export function SiteHeader() {
  const menus: MegaMenus = {
    Software: getPublicProducts().map((p) => ({
      label: p.shortName === "POS" ? "POS System" : p.name.replace(" Management System", "").replace(" System", ""),
      href: `/software/${p.slug}/`,
      description: p.summary,
      icon: p.icon,
      badge: isAvailable(p) ? undefined : statusLabel(p.status),
    })),
    "Digital Marketing": getPublishedServices("digital_marketing").map((s) => ({
      label: s.name,
      href: s.href,
      description: s.summary,
      icon: s.icon,
    })),
    "Web Development": getPublishedServices("web_development").map((s) => ({
      label: s.name,
      href: s.href,
      description: s.summary,
      icon: s.icon,
    })),
  };

  // Solid background on purpose: backdrop-filter would trap the fixed mobile menu inside the header.
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas">
      <Container className="flex h-[4.75rem] items-center justify-between gap-6">
        <Logo />
        <SiteNav nav={mainNav} menus={menus} freeConsultation={siteConfig.offersFreeConsultation} />
      </Container>
    </header>
  );
}
