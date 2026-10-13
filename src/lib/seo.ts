import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Don't append "| Mavqo Digital" (e.g. the homepage). */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/** Unique, page-specific metadata with canonical URL and social tags (spec §11.1). */
export function pageMetadata(input: PageMetaInput): Metadata {
  const fullTitle = input.absoluteTitle ? input.title : `${input.title} | ${siteConfig.name}`;
  // Page metadata overrides the layout's, so indexability must be decided here too:
  // only production pages that aren't explicitly private are indexable.
  const indexable = process.env.APP_ENV === "production" && !input.noIndex;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: input.type ?? "website",
      title: fullTitle,
      description: input.description,
      url: input.path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      ...(input.type === "article" ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: input.description },
  };
}

/* ---------- Structured data (spec §11.3) — only facts visible on the page ---------- */

export function organizationJsonLd() {
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  const { email, phone } = siteConfig.contact;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    description: siteConfig.description,
    slogan: siteConfig.tagline,
    ...(sameAs.length ? { sameAs } : {}),
    ...(email || phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            areaServed: "KE",
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
          },
        }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en-KE",
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function serviceJsonLd(input: { name: string; description: string; path: string; serviceType: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url: absoluteUrl(input.path),
    areaServed: { "@type": "Country", name: "Kenya" },
    provider: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function softwareJsonLd(input: { name: string; description: string; path: string; category: string }) {
  // No price, rating or review fields: none are published (spec §11.3).
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: input.category,
    operatingSystem: "Web browser",
    url: absoluteUrl(input.path),
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    author: { "@type": "Organization", name: input.author },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    image: absoluteUrl("/opengraph-image"),
  };
}
