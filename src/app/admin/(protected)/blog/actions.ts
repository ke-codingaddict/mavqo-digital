"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { getClientIpHash } from "@/lib/security/request";
import { todayIn } from "@/lib/google-ads/range";
import { BLOG_TAG, builtInSlugs } from "@/lib/blog/posts";
import { blogPostSchema } from "@/lib/blog/schema";
import { COVER_MAX_BYTES, sniffImageType } from "@/lib/blog/images";

export type FormState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string> };

const ok = (message: string): FormState => ({ status: "success", message });
const fail = (message: string, errors?: Record<string, string>): FormState => ({ status: "error", message, errors });

function fieldErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path.at(-1) ?? "form")] ??= i.message;
  return errors;
}

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Creates or updates an article (an existing one when the form carries a postId). */
export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("blog:manage");
  const id = str(formData, "postId") || null;
  if (id && !z.uuid().safeParse(id).success) return fail("Unknown article.");

  const parsed = blogPostSchema.safeParse({
    title: str(formData, "title"),
    slug: str(formData, "slug"),
    excerpt: str(formData, "excerpt"),
    category: str(formData, "category"),
    author: str(formData, "author"),
    body: str(formData, "body"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
    ctaLabel: str(formData, "ctaLabel"),
    ctaHref: str(formData, "ctaHref"),
    coverSource: str(formData, "coverSource"),
    imageSrc: str(formData, "imageSrc"),
    imageAlt: str(formData, "imageAlt"),
    published: formData.get("published") === "on",
    publishedAt: str(formData, "publishedAt"),
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));
  const { coverSource, imageSrc, publishedAt, ...fields } = parsed.data;

  // Public URLs must stay unique across built-in and admin-written articles.
  if (builtInSlugs.has(fields.slug)) return fail("A built-in article already uses that URL.", { slug: "Already in use" });
  const clash = await db().blogPost.findFirst({ where: { slug: fields.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
  if (clash) return fail("Another article already uses that URL.", { slug: "Already in use" });

  const existing = id
    ? await db().blogPost.findUnique({ where: { id }, select: { imageType: true, published: true, publishedAt: true } })
    : null;
  if (id && !existing) return fail("Unknown article.");

  // Publish dates can't be in the future: public pages are cached until the next save,
  // so a scheduled article would not appear on its date.
  const today = todayIn();
  if (publishedAt && publishedAt > today) return fail("Please fix the highlighted fields.", { publishedAt: "Choose today or an earlier date." });
  const date = publishedAt ? asDate(publishedAt) : fields.published ? (existing?.publishedAt ?? asDate(today)) : null;

  let cover: { imageSrc: string | null; image?: Uint8Array<ArrayBuffer> | null; imageType?: string | null; imageUpdatedAt?: Date };
  if (coverSource === "library") {
    cover = { imageSrc, image: null, imageType: null };
  } else {
    const file = formData.get("cover");
    if (file instanceof File && file.size > 0) {
      if (file.size > COVER_MAX_BYTES) return fail("Please fix the highlighted fields.", { cover: "That image is over 4 MB — export a smaller JPEG or WebP." });
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = sniffImageType(bytes);
      if (!type) return fail("Please fix the highlighted fields.", { cover: "Use a PNG, JPEG or WebP image." });
      cover = { imageSrc: null, image: bytes, imageType: type, imageUpdatedAt: new Date() };
    } else if (existing?.imageType) {
      cover = { imageSrc: null }; // keep the uploaded image
    } else {
      return fail("Please fix the highlighted fields.", { cover: "Choose an image to upload." });
    }
  }

  const data = { ...fields, ...cover, publishedAt: date };
  let savedId: string;
  if (id) {
    await db().blogPost.update({ where: { id }, data, select: { id: true } });
    savedId = id;
  } else {
    const created = await db().blogPost.create({ data: { ...data, createdById: user.id }, select: { id: true } });
    savedId = created.id;
  }

  const action = !id ? "blog_post_created" : fields.published && !existing?.published ? "blog_post_published" : "blog_post_updated";
  await audit({ action, actorId: user.id, entityType: "blog_post", entityId: savedId, metadata: { slug: fields.slug, published: fields.published } });
  updateTag(BLOG_TAG);

  if (!id) redirect(`/admin/blog/${savedId}/?saved=1`);
  refresh();
  if (fields.published && !existing?.published) return ok("Published — the article is now live on the blog.");
  if (!fields.published && existing?.published) return ok("Unpublished — the article is no longer on the blog.");
  return ok(fields.published ? "Saved — the live article is updated." : "Draft saved.");
}

export async function deletePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("blog:manage");
  const id = str(formData, "postId");
  if (!z.uuid().safeParse(id).success) return fail("Unknown article.");
  if (formData.get("confirm") !== "on") return fail("Tick the box to confirm.");
  const removed = await db().blogPost.delete({ where: { id }, select: { slug: true } }).catch(() => null);
  if (!removed) return fail("Unknown article.");
  await audit({ action: "blog_post_deleted", actorId: user.id, entityType: "blog_post", entityId: id, metadata: { slug: removed.slug }, ipHash: await getClientIpHash() });
  updateTag(BLOG_TAG);
  redirect("/admin/blog/?removed=1");
}
