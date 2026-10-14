import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A pulsing placeholder block; size and shape it with `className`.
 * `bg-line` stays visible on the canvas, surface and surface-2 in both themes.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-full bg-line motion-safe:animate-pulse", className)} />;
}

/** Wraps a loading placeholder so screen readers hear one "Loading…" instead of empty blocks. */
export function SkeletonRegion({ label = "Loading", className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}
