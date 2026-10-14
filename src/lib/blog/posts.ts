import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { BlogPost } from "@/content/types";
import { posts as builtInPosts } from "@/content/blog/posts";
import { db } from "@/lib/db";
import { coverUrl } from "./images";
import { parseArticle, readingMinutes } from "./markdown";

/** Cache tag for every public page that lists or shows articles. Saving a post calls updateTag(BLOG_TAG). */
export const BLOG_TAG = "blog-posts";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: string;
  author: string;
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string | null;
  imageAlt: string;
  imageType: string | null;
  imageUpdatedAt: Date | null;
  published: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
};

/** Shapes a database row like the built-in articles, so pages treat both the same. */
export function toBlogPost(row: Row): BlogPost {
  const publishedAt = isoDate(row.publishedAt ?? row.updatedAt);
  const updatedAt = isoDate(row.updatedAt);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    image: { src: coverUrl(row) ?? row.imageSrc ?? "/images/hero-team.webp", alt: row.imageAlt },
    author: row.author,
    publishedAt,
    updatedAt: updatedAt > publishedAt ? updatedAt : undefined,
    readingMinutes: readingMinutes(row.body),
    body: parseArticle(row.body),
    relatedHref: { label: row.ctaLabel, href: row.ctaHref },
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    published: row.published,
  };
}

/** Slugs of the articles that live in code, which admin posts must not reuse. */
export const builtInSlugs = new Set(builtInPosts.map((p) => p.slug));

/**
 * Every published article, newest first: the built-in ones plus those written
 * in the admin. Cached until a post is saved, so blog pages stay static.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheTag(BLOG_TAG);

  let fromDb: BlogPost[] = [];
  try {
    // Publish dates can't be in the future (see the admin action), so no date filter is needed here.
    const rows = await db().blogPost.findMany({ where: { published: true }, omit: { image: true } });
    fromDb = rows.filter((r) => !builtInSlugs.has(r.slug)).map(toBlogPost);
    cacheLife("max");
  } catch (err) {
    // Database unreachable (e.g. during a build without one): show the built-in articles,
    // and retry soon rather than caching the fallback until the next save.
    console.error("[blog] couldn't load posts:", err instanceof Error ? err.message.split("\n")[0] : err);
    cacheLife("minutes");
  }

  return [...builtInPosts.filter((p) => p.published), ...fromDb].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title),
  );
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  return (await getPublishedPosts()).find((p) => p.slug === slug);
}
