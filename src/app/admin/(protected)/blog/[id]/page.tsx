import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { coverUrl } from "@/lib/blog/images";
import { formatInboxDate } from "@/lib/utils";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { blogCategories } from "../categories";
import { DeletePost, PostEditor } from "../editor";

export const metadata: Metadata = { title: "Edit article" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function EditPostPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <EditPost params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditPost({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  await requireUser("blog:manage");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();

  const [post, categories] = await Promise.all([db().blogPost.findUnique({ where: { id }, omit: { image: true } }), blogCategories()]);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/blog/" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
        <ArrowLeft aria-hidden="true" className="size-4" /> All articles
      </Link>
      {query.saved && (
        <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">
          {post.published ? "Published — the article is now live on the blog." : "Draft saved."}
        </p>
      )}
      <PageHeader
        title={post.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {post.published ? <StatusPill tone="success">Published</StatusPill> : <StatusPill tone="neutral">Draft</StatusPill>}
            Last edited {formatInboxDate(post.updatedAt)}
          </span>
        }
      />
      <PostEditor
        categories={categories}
        defaultAuthor={post.author}
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          author: post.author,
          body: post.body,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          ctaLabel: post.ctaLabel,
          ctaHref: post.ctaHref,
          imageSrc: post.imageSrc,
          imageAlt: post.imageAlt,
          uploadedCover: coverUrl(post),
          published: post.published,
          publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : "",
        }}
      />
      <div className="border-t border-line pt-6">
        <DeletePost id={post.id} title={post.title} />
      </div>
    </div>
  );
}
