import { Container } from "@/components/ui/primitives";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const block = "rounded-[var(--radius-xl)]";

/**
 * Placeholder for pages whose content depends on the URL (e.g. `[slug]`).
 * Shown for a moment during client navigation while the page streams in;
 * prerendered pages never show it on a full page load.
 */
export function PageHeroSkeleton({ image = true }: { image?: boolean }) {
  return (
    <SkeletonRegion className="border-b border-line">
      <Container className="pb-14 pt-8 sm:pb-20 sm:pt-10">
        <Skeleton className="h-4 w-48" />
        <div className={cn("mt-8 grid items-center gap-10 sm:mt-12 lg:gap-16", image && "lg:grid-cols-[1.05fr_1fr]")}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full max-w-xl" />
            <Skeleton className="h-12 w-3/4 max-w-md" />
            <Skeleton className="mt-6 h-5 w-full max-w-lg" />
            <Skeleton className="h-5 w-2/3 max-w-md" />
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-36" />
            </div>
          </div>
          {image && <Skeleton className={cn(block, "aspect-[4/3]")} />}
        </div>
      </Container>
    </SkeletonRegion>
  );
}

/** Placeholder for a blog article: header, cover image and the first lines of text. */
export function ArticleSkeleton() {
  return (
    <SkeletonRegion label="Loading article">
      <Container className="max-w-3xl space-y-4 pt-8 sm:pt-12">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-10 h-4 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-5 w-full" />
      </Container>
      <Container className="mt-10 max-w-5xl">
        <Skeleton className={cn(block, "aspect-[21/9]")} />
      </Container>
      <Container className="max-w-3xl space-y-3 py-12">
        {["w-full", "w-11/12", "w-full", "w-4/5"].map((w, i) => (
          <Skeleton key={i} className={cn("h-4", w)} />
        ))}
      </Container>
    </SkeletonRegion>
  );
}
