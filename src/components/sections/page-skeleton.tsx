import { Container } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const bar = "rounded-full bg-surface-2 motion-safe:animate-pulse";

/**
 * Placeholder for pages whose content depends on the URL (e.g. `[slug]`).
 * Shown for a moment during client navigation while the page streams in;
 * prerendered pages never show it on a full page load.
 */
export function PageHeroSkeleton({ image = true }: { image?: boolean }) {
  return (
    <section aria-busy="true" aria-label="Loading" className="border-b border-line">
      <Container className="pb-14 pt-8 sm:pb-20 sm:pt-10">
        <div className={cn(bar, "h-4 w-48")} />
        <div className={cn("mt-8 grid items-center gap-10 sm:mt-12 lg:gap-16", image && "lg:grid-cols-[1.05fr_1fr]")}>
          <div className="space-y-4">
            <div className={cn(bar, "h-4 w-32")} />
            <div className={cn(bar, "h-12 w-full max-w-xl")} />
            <div className={cn(bar, "h-12 w-3/4 max-w-md")} />
            <div className={cn(bar, "mt-6 h-5 w-full max-w-lg")} />
            <div className={cn(bar, "h-5 w-2/3 max-w-md")} />
          </div>
          {image && <div className="aspect-[4/3] rounded-[var(--radius-xl)] bg-surface-2 motion-safe:animate-pulse" />}
        </div>
      </Container>
    </section>
  );
}

/** Placeholder for a blog article: header, cover image and the first lines of text. */
export function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading article">
      <Container className="max-w-3xl space-y-4 pt-8 sm:pt-12">
        <div className={cn(bar, "h-4 w-48")} />
        <div className={cn(bar, "mt-10 h-4 w-40")} />
        <div className={cn(bar, "h-12 w-full")} />
        <div className={cn(bar, "h-12 w-2/3")} />
        <div className={cn(bar, "h-5 w-full")} />
      </Container>
      <Container className="mt-10 max-w-5xl">
        <div className="aspect-[21/9] rounded-[var(--radius-xl)] bg-surface-2 motion-safe:animate-pulse" />
      </Container>
      <Container className="max-w-3xl space-y-3 py-12">
        {["w-full", "w-11/12", "w-full", "w-4/5"].map((w, i) => (
          <div key={i} className={cn(bar, "h-4", w)} />
        ))}
      </Container>
    </div>
  );
}
