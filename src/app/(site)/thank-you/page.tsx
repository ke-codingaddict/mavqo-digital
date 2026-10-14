import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { getPublishedPosts } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ThankYouDetails } from "./thank-you-details";

export const metadata = pageMetadata({
  title: "Thank You",
  description: "We've received your enquiry.",
  path: "/thank-you/",
  noIndex: true,
});

export default async function ThankYouPage() {
  const posts = (await getPublishedPosts()).slice(0, 3);
  return (
    <section className="bg-surface-2 py-16 sm:py-24">
      <Container className="max-w-3xl">
        <div className="rounded-[var(--radius-lg)] bg-surface p-8 text-center shadow-lg sm:p-12">
          <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-success-wash text-success">
            <CircleCheck aria-hidden="true" className="size-9" />
          </span>
          <h1 className="text-h1 mt-6">Thank you — we&apos;ve got it!</h1>
          <Suspense fallback={<p className="text-lead mt-4 text-ink">A member of our team will be in touch soon.</p>}>
            <ThankYouDetails />
          </Suspense>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
            <ButtonLink href="/software/" variant="primary">
              Explore our software
            </ButtonLink>
          </div>
        </div>

        {posts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-h3">While you wait, you might find these useful</h2>
            <ul className="mt-5 space-y-3">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}/`}
                    className="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-line bg-surface p-5 font-bold text-heading hover:border-teal/50"
                  >
                    {p.title}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-teal-ink transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
