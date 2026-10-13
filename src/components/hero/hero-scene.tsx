"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { HintName, SceneHandle, SceneProduct } from "./scene-engine";
import { cn } from "@/lib/utils";

const HINTS: { name: HintName; label: string; desktopOnly?: boolean }[] = [
  { name: "spin", label: "Drag to spin" },
  { name: "throw", label: "Throw a card", desktopOnly: true },
  { name: "flip", label: "Tap a card" },
  { name: "core", label: "Tap the M" },
  { name: "bars", label: "Tap the bars", desktopOnly: true },
];

/**
 * Playable 3D scene for the homepage banner. three.js is loaded only after the
 * page is idle, so it never delays the headline or first paint. Purely
 * decorative for assistive tech — the product strip below offers the same links.
 */
export function HeroScene({ products, className }: { products: SceneProduct[]; className?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState<Set<HintName>>(() => new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = window.matchMedia("(max-width: 900px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;

    const boot = async () => {
      const engine = await import("./scene-engine");
      if (cancelled) return;
      if (!engine.webglAvailable()) {
        setUnsupported(true);
        return;
      }
      handleRef.current = engine.createHeroScene(container, {
        products,
        reducedMotion: reduced,
        lowPower,
        onHint: (h) => setDone((prev) => (prev.has(h) ? prev : new Set(prev).add(h))),
        onOpen: (p) => router.push(p.href),
      });
      setPaused(reduced);
      setReady(true);
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => void boot(), { timeout: 1500 })
      : window.setTimeout(() => void boot(), 300);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle as number);
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [products, router]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    handleRef.current?.setPaused(next);
  };
  const reset = () => {
    handleRef.current?.reset();
    setDone(new Set());
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/scene relative isolate min-w-0 cursor-grab touch-pan-y select-none data-[grabbing=true]:cursor-grabbing data-[hover=true]:cursor-pointer",
        className,
      )}
    >
      {/* Soft glow behind the scene, visible while three.js loads */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700",
          "bg-[radial-gradient(60%_55%_at_55%_50%,rgba(24,182,164,0.18),transparent_70%)]",
          ready ? "opacity-60" : "opacity-100",
        )}
      />

      {ready && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4 sm:bottom-28">
            <ul className="flex flex-wrap justify-center gap-1.5">
              {HINTS.map((h) => (
                <li
                  key={h.name}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
                    h.desktopOnly && "max-sm:hidden",
                    done.has(h.name) ? "bg-teal/20 text-white ring-teal/50" : "bg-white/8 text-white/80 ring-white/15",
                  )}
                >
                  {done.has(h.name) && <span className="mr-1 text-teal">✓</span>}
                  {h.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute right-3 top-3 z-10 flex gap-1.5 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={reset}
              aria-label="Reset the 3D scene"
              title="Reset"
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? "Play animation" : "Pause animation"}
              title={paused ? "Play" : "Pause"}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 hover:text-white"
            >
              {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
            </button>
          </div>
        </>
      )}

      {unsupported && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/60">
          Your browser can&apos;t show the 3D scene, but every system is listed just below.
        </p>
      )}
    </div>
  );
}
