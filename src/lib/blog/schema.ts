import { z } from "zod";
import { isSiteImage } from "./images";

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Internal links only (e.g. /software/pos-system-kenya/ or /contact/#form). */
const INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/#?=&%]*$/;

export const DEFAULT_CTA = { label: "Talk to our team", href: "/contact/" };

const text = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .min(min, min > 1 ? `${what} needs at least ${min} characters.` : `${what} is required.`)
    .max(max, `Keep ${what.toLowerCase()} to ${max} characters or fewer.`);

/** Article form fields as submitted from the admin editor. */
export const blogPostSchema = z
  .object({
    title: text(10, 160, "Title"),
    slug: z
      .string()
      .trim()
      .max(100, "Keep the URL to 100 characters or fewer.")
      .regex(SLUG, "Use lower-case letters, numbers and single hyphens only."),
    excerpt: text(40, 320, "Summary"),
    category: text(2, 60, "Category"),
    author: text(2, 120, "Author"),
    body: text(200, 100_000, "Article"),
    seoTitle: z.string().trim().max(70, "Keep the search title to 70 characters or fewer."),
    seoDescription: z.string().trim().max(170, "Keep the search description to 170 characters or fewer."),
    ctaLabel: z.string().trim().max(80, "Keep the button text to 80 characters or fewer."),
    ctaHref: z
      .string()
      .trim()
      .max(200)
      .refine((v) => !v || INTERNAL_PATH.test(v), "Use a page on this site, starting with / (e.g. /contact/)."),
    coverSource: z.enum(["library", "upload"]),
    imageSrc: z.string().trim(),
    imageAlt: text(5, 200, "Image description"),
    published: z.boolean(),
    publishedAt: z.union([z.literal(""), z.iso.date("Use a valid date.")]),
  })
  .superRefine((v, ctx) => {
    if (!v.seoTitle && v.title.length > 70) ctx.addIssue({ code: "custom", path: ["seoTitle"], message: "The title is long — write a search title of up to 70 characters." });
    if (!v.seoDescription && v.excerpt.length > 170)
      ctx.addIssue({ code: "custom", path: ["seoDescription"], message: "The summary is long — write a search description of up to 170 characters." });
    if (v.coverSource === "library" && !isSiteImage(v.imageSrc)) ctx.addIssue({ code: "custom", path: ["imageSrc"], message: "Choose a cover image." });
  })
  .transform((v) => ({
    ...v,
    seoTitle: v.seoTitle || v.title,
    seoDescription: v.seoDescription || v.excerpt,
    ctaLabel: v.ctaLabel || DEFAULT_CTA.label,
    ctaHref: v.ctaHref || DEFAULT_CTA.href,
  }));

export type BlogPostInput = z.output<typeof blogPostSchema>;
