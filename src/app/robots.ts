import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Production allows crawling of public pages; every other environment blocks everything (spec §11.2). */
export default function robots(): MetadataRoute.Robots {
  if (process.env.APP_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/thank-you/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
