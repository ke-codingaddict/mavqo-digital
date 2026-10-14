import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { BlogEditorSkeleton } from "@/components/admin/skeletons";
import { PageHeader } from "@/components/admin/ui";
import { blogCategories } from "../categories";
import { PostEditor } from "../editor";

export const metadata: Metadata = { title: "New article" };

export default function NewPostPage() {
  return (
    <Suspense fallback={<BlogEditorSkeleton />}>
      <NewPost />
    </Suspense>
  );
}

async function NewPost() {
  await requireUser("blog:manage");
  const categories = await blogCategories();
  return (
    <div className="space-y-6">
      <Link href="/admin/blog/" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-heading">
        <ArrowLeft aria-hidden="true" className="size-4" /> All articles
      </Link>
      <PageHeader title="New article" description="Save it as a draft while you write, then publish when it's ready." />
      <PostEditor categories={categories} defaultAuthor="Mavqo Digital Team" />
    </div>
  );
}
