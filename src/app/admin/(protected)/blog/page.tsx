import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Newspaper, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { posts as builtInPosts } from "@/content/blog/posts";
import { formatDate, formatInboxDate } from "@/lib/utils";
import { BlogListSkeleton } from "@/components/admin/skeletons";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Blog" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function BlogAdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<BlogListSkeleton />}>
      <BlogList searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogList({ searchParams }: { searchParams: SearchParams }) {
  await requireUser("blog:manage");
  const params = await searchParams;
  const rows = await db().blogPost.findMany({
    select: { id: true, slug: true, title: true, category: true, published: true, publishedAt: true, updatedAt: true },
    orderBy: [{ published: "asc" }, { updatedAt: "desc" }],
  });
  const builtIn = builtInPosts.filter((p) => p.published);
  const live = rows.filter((r) => r.published).length + builtIn.length;

  return (
    <div className="space-y-8">
      {params.removed && <p role="status" className="rounded-[var(--radius-md)] bg-success-wash p-3 text-sm font-medium text-success">Article deleted.</p>}

      <PageHeader
        title="Blog"
        description={`Write and publish articles for the website blog. ${live} article${live === 1 ? " is" : "s are"} live.`}
        actions={
          <Link href="/admin/blog/new/" className={buttonClasses("primary", "sm")}>
            <Plus aria-hidden="true" className="size-4" /> New article
          </Link>
        }
      />

      {rows.length === 0 && (
        <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-teal-wash text-teal-ink">
            <Newspaper aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-bold text-heading">Write your first article</h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft">Articles you publish here appear on the blog, the home page and the sitemap alongside the built-in guides below.</p>
          <Link href="/admin/blog/new/" className={buttonClasses("primary", "sm", "mt-5")}>
            <Plus aria-hidden="true" className="size-4" /> New article
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-[0.8125rem] text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Article</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Published</th>
                <th scope="col" className="px-4 py-3 font-medium">Last edited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="relative hover:bg-surface-2/60">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/blog/${r.id}/`} className="font-bold text-heading after:absolute after:inset-0">
                      {r.title}
                    </Link>
                    <span className="block truncate font-mono text-xs text-ink-soft">/blog/{r.slug}/</span>
                  </td>
                  <td className="px-4 py-3">{r.published ? <StatusPill tone="success">Published</StatusPill> : <StatusPill tone="neutral">Draft</StatusPill>}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{r.published && r.publishedAt ? formatDate(r.publishedAt.toISOString().slice(0, 10)) : "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatInboxDate(r.updatedAt)}</td>
                </tr>
              ))}
              {builtIn.map((p) => (
                <tr key={p.slug} className="relative hover:bg-surface-2/60">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/blog/${p.slug}/`} target="_blank" className="inline-flex items-center gap-1.5 font-bold text-heading after:absolute after:inset-0">
                      {p.title} <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 text-ink-soft" />
                    </Link>
                    <span className="block truncate font-mono text-xs text-ink-soft">/blog/{p.slug}/</span>
                  </td>
                  <td className="px-4 py-3">
                    <span title="Ships with the website code; edit it in src/content/blog/posts.ts">
                      <StatusPill tone="info">Built in</StatusPill>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(p.publishedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
