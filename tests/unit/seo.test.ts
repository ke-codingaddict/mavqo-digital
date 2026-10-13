import { afterEach, describe, expect, it, vi } from "vitest";
import { breadcrumbJsonLd, organizationJsonLd, pageMetadata, softwareJsonLd } from "@/lib/seo";
import sitemap from "@/app/sitemap";

describe("pageMetadata", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sets a unique title, description and canonical", () => {
    const m = pageMetadata({ title: "POS System in Kenya", description: "desc", path: "/software/pos-system-kenya/" });
    expect(m.title).toBe("POS System in Kenya");
    expect(m.alternates?.canonical).toBe("/software/pos-system-kenya/");
    expect(m.openGraph?.title).toBe("POS System in Kenya | Mavqo Digital");
  });
  it("is indexable only in production", () => {
    const page = { title: "Pricing", description: "d", path: "/pricing/" };
    vi.stubEnv("APP_ENV", "staging");
    expect(pageMetadata(page).robots).toEqual({ index: false, follow: false });
    vi.stubEnv("APP_ENV", "production");
    expect(pageMetadata(page).robots).toEqual({ index: true, follow: true });
  });
  it("keeps private pages noindex even in production", () => {
    vi.stubEnv("APP_ENV", "production");
    const m = pageMetadata({ title: "Home", description: "d", path: "/", absoluteTitle: true, noIndex: true });
    expect(m.title).toEqual({ absolute: "Home" });
    expect(m.robots).toEqual({ index: false, follow: false });
  });
});

describe("structured data", () => {
  it("never invents ratings, reviews or prices", () => {
    const json = JSON.stringify([organizationJsonLd(), softwareJsonLd({ name: "x", description: "y", path: "/", category: "z" })]);
    expect(json).not.toMatch(/aggregateRating|review|"offers"|"price"/i);
  });
  it("omits contact details that are not configured", () => {
    expect(organizationJsonLd()).not.toHaveProperty("contactPoint");
  });
  it("builds ordered breadcrumbs with absolute URLs", () => {
    const b = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Software", path: "/software/" }]);
    expect(b.itemListElement[1]).toMatchObject({ position: 2, item: "http://localhost:3000/software/" });
  });
});

describe("sitemap", () => {
  it("includes key pages and excludes private ones", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls).toContain("/");
    expect(urls).toContain("/software/school-management-system-kenya/");
    expect(urls).toContain("/digital-marketing-kenya/seo-services-kenya/");
    expect(urls.some((u) => u.startsWith("/admin") || u.startsWith("/thank-you"))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
