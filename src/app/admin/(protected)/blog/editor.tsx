"use client";

import { useActionState, useMemo, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Eye, ImageUp, LoaderCircle, PencilLine } from "lucide-react";
import { Card, Field, FormMessage, inputClass, Switch } from "@/components/admin/ui";
import { ArticleBody } from "@/components/sections/article-body";
import { buttonClasses } from "@/components/ui/button";
import { COVER_ACCEPT, SITE_IMAGES } from "@/lib/blog/images";
import { parseArticle, readingMinutes, slugify } from "@/lib/blog/markdown";
import { DEFAULT_CTA } from "@/lib/blog/schema";
import { cn } from "@/lib/utils";
import { deletePost, savePost, type FormState } from "./actions";

export type EditorPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string | null;
  imageAlt: string;
  /** URL of the uploaded cover, if any. */
  uploadedCover: string | null;
  published: boolean;
  publishedAt: string;
};

const idle: FormState = { status: "idle" };

const FORMAT_HELP: [string, string][] = [
  ["## Heading", "Section heading"],
  ["### Subheading", "Smaller heading"],
  ["- Item", "Bulleted list"],
  ["1. Item", "Numbered list"],
  ["> Tip or warning", "Highlighted callout"],
  ["Blank line", "New paragraph"],
];

function TextArea({
  name,
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: { name: string; label: string; hint?: ReactNode; error?: string; optional?: boolean } & ComponentProps<"textarea">) {
  const id = `fld-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-heading">
        {label}
        {optional && <span className="font-normal text-ink-soft"> · optional</span>}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      />
      {hint && !error && <div id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">{hint}</div>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}

/** "42 / 70" counter that turns red past the limit. */
function Count({ value, max }: { value: string; max: number }) {
  return <span className={cn("tabular-nums", value.length > max && "font-bold text-danger")}>{value.length} / {max}</span>;
}

export function PostEditor({ post, categories, defaultAuthor }: { post?: EditorPost; categories: string[]; defaultAuthor: string }) {
  const [state, action] = useActionState(savePost, idle);
  const [pending, startTransition] = useTransition();
  const e = state.errors ?? {};

  // Controlled fields: React resets uncontrolled forms after an action, which would
  // wipe a long draft on a validation error. Submitting through a transition (below)
  // also keeps a picked cover file in place.
  const [v, setV] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    category: post?.category ?? "",
    author: post?.author ?? defaultAuthor,
    body: post?.body ?? "",
    seoTitle: post?.seoTitle && post.seoTitle !== post.title ? post.seoTitle : "",
    seoDescription: post?.seoDescription && post.seoDescription !== post.excerpt ? post.seoDescription : "",
    ctaLabel: post?.ctaLabel ?? "",
    ctaHref: post?.ctaHref ?? "",
    imageAlt: post?.imageAlt ?? "",
    publishedAt: post?.publishedAt ?? "",
  });
  const set = (key: keyof typeof v) => (ev: { currentTarget: { value: string } }) => {
    const value = ev.currentTarget.value;
    setV((prev) => ({ ...prev, [key]: value }));
  };

  // New articles get a URL from the title until the author edits it themselves.
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const slug = slugTouched ? v.slug : slugify(v.title);

  const [published, setPublished] = useState(post?.published ?? false);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const [coverSource, setCoverSource] = useState<"library" | "upload">(post?.uploadedCover ? "upload" : "library");
  const [imageSrc, setImageSrc] = useState(post?.imageSrc ?? "");
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const coverPreview = coverSource === "upload" ? (pickedFile ?? post?.uploadedCover ?? null) : imageSrc || null;

  const pickLibrary = (src: string) => {
    const prevDefault = SITE_IMAGES.find((i) => i.src === imageSrc)?.alt;
    setImageSrc(src);
    // Fill in a description, without overwriting one the author wrote.
    if (!v.imageAlt || v.imageAlt === prevDefault) setV((p) => ({ ...p, imageAlt: SITE_IMAGES.find((i) => i.src === src)?.alt ?? p.imageAlt }));
  };

  const blocks = useMemo(() => (tab === "preview" ? parseArticle(v.body) : []), [tab, v.body]);
  const minutes = readingMinutes(v.body);

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      noValidate
    >
      {post && <input type="hidden" name="postId" value={post.id} />}
      <input type="hidden" name="slug" value={slug} />

      <div className="space-y-6">
        <FormMessage state={state} />
        <Card>
          <div className="space-y-5">
            <Field name="title" label="Title" value={v.title} onChange={set("title")} required error={e.title} placeholder="How to choose a POS system for your shop" />
            <Field
              name="slugInput"
              label="Web address"
              value={slug}
              onChange={(ev) => {
                setSlugTouched(true);
                setV((p) => ({ ...p, slug: ev.currentTarget.value.toLowerCase() }));
              }}
              error={e.slug}
              autoComplete="off"
              spellCheck={false}
              hint={
                <>
                  /blog/<strong className="text-heading">{slug || "…"}</strong>/
                  {post?.published && " — changing this breaks existing links to the article."}
                </>
              }
            />
            <TextArea
              name="excerpt"
              label="Summary"
              rows={3}
              value={v.excerpt}
              onChange={set("excerpt")}
              error={e.excerpt}
              hint={<>Shown under the title and on article cards. <Count value={v.excerpt} max={320} /></>}
            />
          </div>
        </Card>

        <Card
          title="Article"
          description={`${minutes} min read`}
          aside={
            <div role="tablist" aria-label="Editor mode" className="flex rounded-full bg-surface-2 p-1 text-sm font-bold">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5", tab === t ? "bg-surface text-heading shadow-sm" : "text-ink-soft hover:text-heading")}
                >
                  {t === "write" ? <PencilLine aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
                  {t === "write" ? "Write" : "Preview"}
                </button>
              ))}
            </div>
          }
        >
          {/* The textarea stays mounted (just hidden) so it always submits with the form. */}
          <div className={cn(tab !== "write" && "hidden")}>
            <TextArea
              name="body"
              label="Article text"
              rows={24}
              value={v.body}
              onChange={set("body")}
              error={e.body}
              className="[&_textarea]:font-mono [&_textarea]:leading-relaxed"
              placeholder={"Start with an introduction paragraph.\n\n## First section\n\nExplain the point here.\n\n- A bullet point\n- Another one\n\n> A helpful tip readers shouldn't miss."}
            />
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-[var(--radius-md)] bg-surface-2 p-4 text-xs sm:grid-cols-3">
              {FORMAT_HELP.map(([code, meaning]) => (
                <div key={code} className="flex items-baseline gap-2">
                  <dt className="shrink-0 font-mono font-bold text-heading">{code}</dt>
                  <dd className="text-ink-soft">{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
          {tab === "preview" && (
            <div className="mx-auto max-w-3xl py-2">
              {coverPreview && (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file
                <img src={coverPreview} alt="" className="mb-8 aspect-[21/9] w-full rounded-[var(--radius-lg)] object-cover" />
              )}
              <h1 className="text-h2">{v.title || "Untitled article"}</h1>
              {v.excerpt && <p className="text-lead mt-4 text-ink-soft">{v.excerpt}</p>}
              <div className="mt-8">
                {blocks.length ? <ArticleBody blocks={blocks} /> : <p className="text-sm text-ink-soft">Nothing to preview yet — write something first.</p>}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <Card title="Publishing">
          <div className="space-y-4">
            <Switch
              name="published"
              defaultChecked={published}
              onCheckedChange={setPublished}
              label="Published"
              description={published ? "Visible on the blog once saved." : "Saved as a draft — only admins can see it."}
            />
            <Field
              name="publishedAt"
              label="Publish date"
              type="date"
              optional
              value={v.publishedAt}
              onChange={set("publishedAt")}
              max={new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date())}
              error={e.publishedAt}
              hint="Defaults to the day you first publish."
            />
            <button type="submit" disabled={pending} aria-busy={pending || undefined} className={buttonClasses("primary", "md", "w-full")}>
              {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {pending ? "Saving…" : published ? (post?.published ? "Update article" : "Publish article") : "Save draft"}
            </button>
            {post?.published && (
              <Link href={`/blog/${post.slug}/`} target="_blank" className="flex items-center justify-center gap-1.5 text-sm font-bold text-teal-ink hover:underline">
                View on site <ExternalLink aria-hidden="true" className="size-3.5" />
              </Link>
            )}
          </div>
        </Card>

        <Card title="Cover image">
          <div className="space-y-4">
            <input type="hidden" name="coverSource" value={coverSource} />
            <input type="hidden" name="imageSrc" value={coverSource === "library" ? imageSrc : ""} />
            <div role="radiogroup" aria-label="Cover source" className="grid grid-cols-2 rounded-full bg-surface-2 p-1 text-sm font-bold">
              {(["library", "upload"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={coverSource === s}
                  onClick={() => setCoverSource(s)}
                  className={cn("rounded-full px-3 py-1.5", coverSource === s ? "bg-surface text-heading shadow-sm" : "text-ink-soft hover:text-heading")}
                >
                  {s === "library" ? "Site photos" : "Upload"}
                </button>
              ))}
            </div>

            {coverSource === "library" ? (
              <fieldset>
                <legend className="sr-only">Choose a site photo</legend>
                <div className="grid max-h-72 grid-cols-3 gap-2 overflow-auto pr-1">
                  {SITE_IMAGES.map((img) => (
                    <label
                      key={img.src}
                      title={img.label}
                      className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[var(--radius-sm,0.5rem)] ring-2 ring-transparent has-[:checked]:ring-teal has-[:focus-visible]:ring-teal/60"
                    >
                      <input type="radio" name="libraryPick" value={img.src} checked={imageSrc === img.src} onChange={() => pickLibrary(img.src)} className="sr-only" />
                      {/* eslint-disable-next-line @next/next/no-img-element -- small picker thumbnails */}
                      <img src={img.src} alt={img.label} loading="lazy" className="size-full object-cover" />
                    </label>
                  ))}
                </div>
                {e.imageSrc && <p className="mt-1.5 text-xs font-bold text-danger">{e.imageSrc}</p>}
              </fieldset>
            ) : (
              <div className="space-y-2">
                {coverPreview && (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file
                  <img src={coverPreview} alt="" className="aspect-[16/9] w-full rounded-[var(--radius-md)] object-cover" />
                )}
                <label className={buttonClasses("secondary", "sm", "w-full cursor-pointer")}>
                  <ImageUp aria-hidden="true" className="size-4" /> {coverPreview ? "Replace image" : "Choose image"}
                  <input
                    type="file"
                    name="cover"
                    accept={COVER_ACCEPT}
                    className="sr-only"
                    onChange={(ev) => {
                      const f = ev.currentTarget.files?.[0];
                      setPickedFile(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                </label>
                <p className="text-xs text-ink-soft">JPEG, PNG or WebP up to 4 MB. Landscape photos at least 1600px wide look best.</p>
                {e.cover && <p className="text-xs font-bold text-danger">{e.cover}</p>}
              </div>
            )}

            <TextArea
              name="imageAlt"
              label="Image description"
              rows={2}
              value={v.imageAlt}
              onChange={set("imageAlt")}
              error={e.imageAlt}
              hint="Describe the photo for people using screen readers."
            />
          </div>
        </Card>

        <Card title="Details">
          <div className="space-y-4">
            <Field name="category" label="Category" list="blog-categories" value={v.category} onChange={set("category")} error={e.category} placeholder="Digital Marketing" />
            <datalist id="blog-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Field name="author" label="Author" value={v.author} onChange={set("author")} error={e.author} />
          </div>
        </Card>

        <Card title="Search engines" description="Leave blank to use the title and summary.">
          <div className="space-y-4">
            <Field
              name="seoTitle"
              label="Search title"
              optional
              value={v.seoTitle}
              onChange={set("seoTitle")}
              placeholder={v.title.slice(0, 70)}
              error={e.seoTitle}
              hint={<Count value={v.seoTitle || v.title} max={70} />}
            />
            <TextArea
              name="seoDescription"
              label="Search description"
              optional
              rows={3}
              value={v.seoDescription}
              onChange={set("seoDescription")}
              placeholder={v.excerpt.slice(0, 170)}
              error={e.seoDescription}
              hint={<Count value={v.seoDescription || v.excerpt} max={170} />}
            />
          </div>
        </Card>

        <Card title="Call to action" description="The button at the end of the article.">
          <div className="space-y-4">
            <Field name="ctaLabel" label="Button text" optional value={v.ctaLabel} onChange={set("ctaLabel")} placeholder={DEFAULT_CTA.label} error={e.ctaLabel} />
            <Field
              name="ctaHref"
              label="Links to"
              optional
              value={v.ctaHref}
              onChange={set("ctaHref")}
              placeholder={DEFAULT_CTA.href}
              error={e.ctaHref}
              hint="A page on this site, e.g. /software/pos-system-kenya/"
            />
          </div>
        </Card>
      </div>
    </form>
  );
}

export function DeletePost({ id, title }: { id: string; title: string }) {
  const [state, action] = useActionState(deletePost, idle);
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-bold text-danger hover:underline">
        Delete this article…
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-[var(--radius-md)] bg-danger-wash p-4">
      <FormMessage state={state} />
      <input type="hidden" name="postId" value={id} />
      <label className="flex items-start gap-2 text-sm text-danger">
        <input type="checkbox" name="confirm" className="mt-1 size-4 accent-current" required />
        Permanently delete “{title}”. It disappears from the blog straight away and can&apos;t be restored.
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setConfirming(false)} className="h-9 px-3 text-sm font-bold text-ink-soft hover:text-heading">
          Cancel
        </button>
        <button type="submit" className={buttonClasses("primary", "sm", "bg-danger hover:bg-danger")}>
          Delete article
        </button>
      </div>
    </form>
  );
}
