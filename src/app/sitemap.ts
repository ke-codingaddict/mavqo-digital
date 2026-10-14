import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/content/products";
import { getPublishedServices } from "@/content/services";
import { getPublishedPosts } from "@/lib/blog/posts";
import { absoluteUrl } from "@/lib/seo";

/** Only published, indexable pages (spec §11.2). Thank-you and admin pages are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/software/", priority: 0.9 },
    { path: "/digital-marketing-kenya/", priority: 0.9 },
    { path: "/request-demo/", priority: 0.8 },
    { path: "/request-quote/", priority: 0.8 },
    { path: "/industries/", priority: 0.7 },
    { path: "/pricing/", priority: 0.7 },
    { path: "/about/", priority: 0.6 },
    { path: "/company-profile/", priority: 0.6 },
    { path: "/contact/", priority: 0.6 },
    { path: "/blog/", priority: 0.6 },
    { path: "/privacy-policy/", priority: 0.2 },
    { path: "/terms-of-service/", priority: 0.2 },
  ];

  return [
    ...staticPages.map((p) => ({ url: absoluteUrl(p.path), priority: p.priority })),
    ...getPublicProducts().map((p) => ({ url: absoluteUrl(`/software/${p.slug}/`), priority: 0.9 })),
    ...getPublishedServices().map((s) => ({ url: absoluteUrl(s.href), priority: 0.8 })),
    ...(await getPublishedPosts()).map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}/`),
      lastModified: p.updatedAt ?? p.publishedAt,
      priority: 0.6,
    })),
  ];
}
