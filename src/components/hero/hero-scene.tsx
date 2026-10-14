"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import type { SceneHandle, SceneProduct } from "./scene-engine";
import { cn } from "@/lib/utils";

/**
 * 3D product dashboard for the homepage banner. three.js is loaded only after
 * the page is idle, so it never delays the headline or first paint. The canvas
 * is decorative for assistive tech; the tabs below it are real buttons, and the
 * product strip under the banner offers the same links.
 */
export function HeroScene({ products, className }: { products: SceneProduct[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

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
        onProductChange: setActive,
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
  }, [products]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    handleRef.current?.setPaused(next);
  };
  const current = products[active];

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/scene relative isolate min-w-0 cursor-grab touch-pan-y select-none data-[grabbing=true]:cursor-grabbing data-[hover=true]:cursor-crosshair",
        className,
      )}
    >
      {/* Soft glow behind the scene, visible while three.js loads */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700",
          "bg-[radial-gradient(55%_50%_at_55%_48%,rgba(24,182,164,0.2),transparent_70%)]",
          ready ? "opacity-50" : "opacity-100",
        )}
      />

      {ready && (
        <>
          <div className="absolute inset-x-0 bottom-24 z-10 flex flex-col items-center gap-2.5 px-4 sm:bottom-28">
            <div
              role="group"
              aria-label="Preview a product dashboard"
              className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-[#0b1a31]/70 p-1 ring-1 ring-inset ring-white/12 backdrop-blur-md [scrollbar-width:none]"
            >
              {products.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={i === active}
                  onClick={() => handleRef.current?.setProduct(i)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-[0.8125rem]",
                    i === active ? "bg-white text-[#0b1a31] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {current && (
              <Link
                href={current.href}
                className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-white/70 transition-colors hover:text-white"
              >
                Explore this system<span className="sr-only">: {current.label}</span>
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            )}
          </div>
          <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
            <button
              type="button"
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? "Play the dashboard animation" : "Pause the dashboard animation"}
              title={paused ? "Play" : "Pause"}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
            >
              {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
            </button>
          </div>
        </>
      )}

      {unsupported && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/60">
          Your browser can&apos;t show the 3D preview, but every system is listed just below.
        </p>
      )}
    </div>
  );
}
