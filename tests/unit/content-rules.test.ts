import { describe, expect, it } from "vitest";
import { canRequestDemo, getPublicProducts, isAvailable, products } from "@/content/products";
import { services } from "@/content/services";
import { posts } from "@/content/blog/posts";
import { demoProductOptions } from "@/content/form-options";
import type { Product } from "@/content/types";

const make = (over: Partial<Product>): Product => ({ ...products[0], ...over });

describe("product status rules", () => {
  it("only available statuses count as available", () => {
    expect(isAvailable({ status: "available_for_demo" })).toBe(true);
    expect(isAvailable({ status: "available_for_sale" })).toBe(true);
    for (const status of ["planned", "in_development", "maintenance"] as const) {
      expect(isAvailable({ status })).toBe(false);
    }
  });

  it("never offers demos for unavailable products, even if flagged demoable", () => {
    expect(canRequestDemo({ status: "in_development", demoAvailable: true })).toBe(false);
    expect(canRequestDemo({ status: "available_for_sale", demoAvailable: false })).toBe(false);
    expect(canRequestDemo({ status: "available_for_demo", demoAvailable: true })).toBe(true);
  });

  it("hides planned and unpublished products from the public catalogue", () => {
    const list = [make({ slug: "a", status: "planned" }), make({ slug: "b", published: false }), make({ slug: "c" })];
    expect(getPublicProducts(list).map((p) => p.slug)).toEqual(["c"]);
  });

  it("only lists demoable products in the demo form", () => {
    const slugs = demoProductOptions().map((o) => o.value);
    for (const p of products) expect(slugs.includes(p.slug)).toBe(canRequestDemo(p) && p.published);
  });
});

describe("content integrity (SEO)", () => {
  const all = [
    ...products.map((p) => ({ slug: p.slug, title: p.seoTitle, description: p.seoDescription })),
    ...services.map((s) => ({ slug: s.slug, title: s.seoTitle, description: s.seoDescription })),
    ...posts.map((p) => ({ slug: p.slug, title: p.seoTitle, description: p.seoDescription })),
  ];

  it("has unique slugs, titles and descriptions", () => {
    for (const key of ["slug", "title", "description"] as const) {
      const values = all.map((x) => x[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("keeps meta descriptions a sensible length", () => {
    for (const x of all) {
      expect(x.description.length, x.slug).toBeGreaterThan(70);
      expect(x.description.length, x.slug).toBeLessThanOrEqual(170);
    }
  });

  it("never promises guaranteed rankings", () => {
    const text = JSON.stringify([products, services, posts]).toLowerCase();
    expect(text).not.toMatch(/guaranteed (first[- ]page|#1|top) rank/);
  });

  it("lists no features for products that are not yet available", () => {
    for (const p of products.filter((p) => !isAvailable(p))) expect(p.features).toEqual([]);
  });
});
