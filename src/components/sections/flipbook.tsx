"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Page = { src: string; alt: string };

/** Two-page spreads from this width up; one page at a time below it. */
const SPREAD_QUERY = "(min-width: 768px)";
const TURN_MS = 900;
const PEEK_MS = 350;
const SWIPE_PX = 40;

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(SPREAD_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useSpread() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(SPREAD_QUERY).matches, () => true);
}

/**
 * A brochure shown as a book whose pages turn in 3D. On wide screens it opens
 * as two-page spreads with the cover on its own; on phones it shows one page
 * at a time. Turn pages by clicking either side, swiping, the arrow keys or the
 * buttons below.
 */
export function Flipbook({
  pages,
  pageWidth,
  pageHeight,
  title,
  className,
}: {
  pages: readonly Page[];
  pageWidth: number;
  pageHeight: number;
  title: string;
  className?: string;
}) {
  const spread = useSpread();
  const n = pages.length;
  // Index of the first page in view; the same value works in both layouts.
  const [current, setCurrent] = useState(0);
  const [turning, setTurning] = useState<number | null>(null);
  const [peek, setPeek] = useState<"prev" | "next" | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  // A leaf is one sheet of paper: a page on the front and, in spreads, the next page on its back.
  const leaves = spread
    ? Array.from({ length: Math.ceil(n / 2) }, (_, k) => ({ front: 2 * k, back: 2 * k + 1 < n ? 2 * k + 1 : null }))
    : pages.map((_, k) => ({ front: k, back: null }));
  const flipped = spread ? Math.ceil(current / 2) : current;
  const maxFlipped = spread ? Math.floor(n / 2) : n - 1;

  const left = spread && flipped > 0 ? 2 * flipped - 1 : null;
  const right = spread ? (2 * flipped < n ? 2 * flipped : null) : current;
  const visible = new Set([left, right].filter((i): i is number => i !== null));

  useEffect(() => {
    if (turning === null) return;
    const t = window.setTimeout(() => setTurning(null), TURN_MS);
    return () => window.clearTimeout(t);
  }, [turning]);

  function turnTo(target: number) {
    const to = Math.max(0, Math.min(maxFlipped, target));
    if (to === flipped) return;
    setTurning(to > flipped ? flipped : to);
    setPeek(null);
    setCurrent(spread ? Math.max(0, 2 * to - 1) : to);
  }
  const next = () => turnTo(flipped + 1);
  const prev = () => turnTo(flipped - 1);

  function sideOf(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? "prev" : "next";
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      if (sideOf(e) === "next") next();
      else prev();
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!spread || e.pointerType !== "mouse" || turning !== null) return;
    const side = sideOf(e);
    const can = side === "next" ? flipped < maxFlipped : flipped > 0;
    setPeek(can ? side : null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const actions: Record<string, () => void> = {
      ArrowRight: next,
      ArrowLeft: prev,
      Home: () => turnTo(0),
      End: () => turnTo(maxFlipped),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  }

  // Centre the closed book: the cover alone sits right of the spine, a lone last page left of it.
  const shift = spread ? (left === null ? "-25%" : right === null ? "25%" : "0%") : "0%";
  const ratio = ((spread ? 2 : 1) * pageWidth) / pageHeight;

  const label = spread
    ? left === null
      ? `Cover · page 1 of ${n}`
      : right === null
        ? `Page ${left + 1} of ${n}`
        : `Pages ${left + 1}–${right + 1} of ${n}`
    : `Page ${current + 1} of ${n}`;

  function face(index: number, side: "front" | "back") {
    const page = pages[index];
    const spine =
      side === "front"
        ? "linear-gradient(to right, rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.06) 4%, transparent 9%)"
        : "linear-gradient(to left, rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.06) 4%, transparent 9%)";
    return (
      <div
        className={cn("absolute inset-0 overflow-hidden bg-white backface-hidden", side === "back" && "rotate-y-180")}
        aria-hidden={!visible.has(index)}
      >
        <Image
          src={page.src}
          alt={page.alt}
          fill
          sizes="(min-width: 768px) min(46vw, 560px), 100vw"
          loading={index < 3 ? "eager" : "lazy"}
          draggable={false}
          className="select-none object-cover"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: spine }} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="w-full overflow-x-clip py-4">
        <div
          role="region"
          aria-roledescription="flipbook"
          aria-label={`${title}. Use the left and right arrow keys to turn pages.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => (pointer.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointer.current = null)}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setPeek(null)}
          className="relative mx-auto cursor-pointer touch-pan-y select-none transition-transform duration-700 ease-out"
          style={{
            width: `min(100%, calc(76svh * ${ratio}))`,
            aspectRatio: `${(spread ? 2 : 1) * pageWidth} / ${pageHeight}`,
            perspective: spread ? "2800px" : "1800px",
            transform: `translateX(${shift})`,
          }}
        >
          {/* Shadow under the open pages */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 rounded-sm shadow-[0_30px_60px_-20px_rgb(8_19_31/0.45)] transition-[left,right] duration-700"
            style={{ left: spread && left === null ? "50%" : 0, right: spread && right === null ? "50%" : 0 }}
          />

          {leaves.map((leaf, k) => {
            const isFlipped = k < flipped;
            let angle = isFlipped ? -180 : 0;
            if (peek === "next" && k === flipped) angle = -12;
            if (peek === "prev" && k === flipped - 1) angle = -168;
            const zIndex = turning === k ? leaves.length * 3 : isFlipped ? k + 1 : leaves.length * 2 - k;
            return (
              <div
                key={`${spread ? "s" : "p"}${k}`}
                className="absolute inset-y-0 origin-left transform-3d transition-transform ease-[cubic-bezier(0.645,0.045,0.355,1)]"
                style={{
                  left: spread ? "50%" : 0,
                  width: spread ? "50%" : "100%",
                  zIndex,
                  transform: `rotateY(${angle}deg)`,
                  transitionDuration: `${turning === k ? TURN_MS : PEEK_MS}ms`,
                }}
              >
                {face(leaf.front, "front")}
                {leaf.back !== null && face(leaf.back, "back")}
              </div>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {label}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={flipped === 0}
          aria-label="Previous page"
          className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-heading ring-1 ring-inset ring-line-strong transition hover:ring-heading/40 disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <span aria-hidden="true" className="min-w-36 text-center text-sm font-bold tabular-nums text-ink-soft">
          {label}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={flipped === maxFlipped}
          aria-label="Next page"
          className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-heading ring-1 ring-inset ring-line-strong transition hover:ring-heading/40 disabled:opacity-40"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div aria-hidden="true" className="mt-5 h-1 w-full max-w-xl overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-teal transition-[width] duration-700"
          style={{ width: `${((flipped + 1) / (maxFlipped + 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
