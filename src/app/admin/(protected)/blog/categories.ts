import "server-only";
import { db } from "@/lib/db";
import { posts as builtInPosts } from "@/content/blog/posts";

/** Categories already in use, offered as suggestions in the editor. */
export async function blogCategories(): Promise<string[]> {
  const rows = await db().blogPost.findMany({ distinct: ["category"], select: { category: true } });
  return [...new Set([...builtInPosts.map((p) => p.category), ...rows.map((r) => r.category)])].sort((a, b) => a.localeCompare(b));
}
