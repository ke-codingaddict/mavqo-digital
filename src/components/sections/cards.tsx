import Image from "next/image";
import Link from "next/link";
import type { BlogPost, Product, Service } from "@/content/types";
import { isAvailable, statusLabel } from "@/content/products";
import { Icon } from "@/components/ui/icon";
import { ArrowIcon } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

const cardBase =
  "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lg";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const available = isAvailable(product);
  return (
    <article className={cn(cardBase, className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.03]", !available && "grayscale-[60%]")}
        />
        <span
          className={cn(
            "absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm",
            available ? "bg-white text-navy" : "bg-sun text-navy",
          )}
        >
          {available && <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />}
          {statusLabel(product.status)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-sm font-bold text-teal-ink">
          <Icon name={product.icon} className="size-4" /> {product.industry}
        </p>
        <h3 className="text-h3 mt-2">
          <Link href={`/software/${product.slug}/`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{product.summary}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-heading">
          {available ? "See how it works" : "Join early access"} <ArrowIcon />
        </span>
      </div>
    </article>
  );
}

export function ServiceCard({ service, className }: { service: Service; className?: string }) {
  return (
    <article className={cn(cardBase, className)}>
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <Image src={service.image.src} alt={service.image.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-h3">
          <Link href={service.href} className="after:absolute after:inset-0">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{service.summary}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 font-bold text-heading">
          Learn more <ArrowIcon />
        </span>
      </div>
    </article>
  );
}

export function BlogCard({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <article className={cn(cardBase, className)}>
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <Image src={post.image.src} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm text-ink-soft">
          <span className="font-bold text-teal-ink">{post.category}</span> · {post.readingMinutes} min read
        </p>
        <h3 className="text-h3 mt-2">
          <Link href={`/blog/${post.slug}/`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{post.excerpt}</p>
        <p className="mt-5 text-sm text-ink-soft">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}
