import Image from "next/image";
import Link from "next/link";
import { getPublishedPosts } from "@/content/blog/posts";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Container } from "@/components/ui/primitives";
import { ArrowIcon } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { BlogCard } from "@/components/sections/cards";

export const metadata = pageMetadata({
  title: "Blog & Resources",
  description:
    "Practical guides on business software, websites, SEO and digital marketing for Kenyan schools, healthcare facilities, restaurants and businesses.",
  path: "/blog/",
});

export default function BlogIndexPage() {
  const [featured, ...rest] = getPublishedPosts();
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs crumbs={[{ name: "Blog", path: "/blog/" }]} />
      <div className="mt-8 max-w-2xl">
        <p className="kicker">Guides & articles</p>
        <h1 className="text-h1 mt-4">Practical advice to run better and grow online</h1>
      </div>

      {featured && (
        <article className="group relative mt-12 grid overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface lg:grid-cols-2">
          <div className="relative aspect-[16/10] lg:aspect-auto">
            <Image src={featured.image.src} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="text-sm text-ink-soft">
              <span className="font-bold text-teal-ink">{featured.category}</span> · {featured.readingMinutes} min read ·{" "}
              <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
            </p>
            <h2 className="mt-3 text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-black leading-tight tracking-tight text-heading">
              <Link href={`/blog/${featured.slug}/`} className="after:absolute after:inset-0">
                {featured.title}
              </Link>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{featured.excerpt}</p>
            <span className="mt-8 inline-flex items-center gap-1.5 font-bold text-heading">
              Read the guide <ArrowIcon />
            </span>
          </div>
        </article>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-16 pb-12">
          <h2 id="more-heading" className="text-h3">
            More articles
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
