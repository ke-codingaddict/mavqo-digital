import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Info } from "lucide-react";
import type { BlogBlock } from "@/content/types";
import { getPost, getPublishedPosts } from "@/content/blog/posts";
import { articleJsonLd, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Badge, Container } from "@/components/ui/primitives";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { BlogCard } from "@/components/sections/cards";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seoTitle,
    description: post.seoDescription,
    path: `/blog/${post.slug}/`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="flex gap-3 rounded-[var(--radius-md)] border-l-4 border-teal bg-teal-wash p-5 text-heading">
          <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-teal-ink" />
          <p>{block.text}</p>
        </aside>
      );
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const path = `/blog/${post.slug}/`;
  const more = getPublishedPosts().filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <article>
        <header>
          <Container className="max-w-3xl pt-8 sm:pt-12">
            <Breadcrumbs crumbs={[{ name: "Blog", path: "/blog/" }, { name: post.title, path }]} />
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <Badge tone="teal">{post.category}</Badge>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, { dateStyle: "long" })}</time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" /> {post.readingMinutes} min read
              </span>
            </div>
            <h1 className="text-h1 mt-5">{post.title}</h1>
            <p className="text-lead mt-5 text-ink-soft">{post.excerpt}</p>
            <p className="mt-6 text-sm font-bold text-heading">By {post.author}</p>
          </Container>
          <Container className="mt-10 max-w-5xl">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-xl)] bg-surface-2">
              <Image src={post.image.src} alt={post.image.alt} fill priority sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
            </div>
          </Container>
        </header>
        <Container className="max-w-3xl py-12 sm:py-16">
          <div className="prose-mavqo">
            {post.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
          <div className="mt-14 flex flex-col items-start gap-5 rounded-[var(--radius-xl)] bg-inverse p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-bold text-on-inverse">Want help putting this into practice?</p>
            <ButtonLink href={post.relatedHref.href} variant="accent">
              {post.relatedHref.label} <ArrowIcon />
            </ButtonLink>
          </div>
        </Container>
      </article>

      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="border-t border-line bg-surface-2 py-16 sm:py-20">
          <Container className="max-w-5xl">
            <div className="flex items-end justify-between gap-6">
              <h2 id="more-heading" className="text-h2">
                More articles
              </h2>
              <Link href="/blog/" className="font-bold text-teal-ink">
                All articles
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {more.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.seoDescription,
          path,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          author: post.author,
        })}
      />
    </>
  );
}
