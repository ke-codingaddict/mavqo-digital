"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-series column chart for a daily metric. Rendered as SVG on the
 * server too, so it prints crisply. Hover or arrow keys show a tooltip with
 * the day's value; the full numbers are also in the table view beneath.
 */

export type TrendPoint = { date: string; value: number };

const MARGIN = { top: 12, right: 8, bottom: 26, left: 52 };
const HEIGHT = 200;

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * exp;
}

const compact = (n: number) => new Intl.NumberFormat("en-KE", { notation: n >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-KE", { timeZone: "UTC", ...opts }).format(new Date(`${iso}T00:00:00Z`));

/** Column with a 4px rounded top and a square base. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(w >= 8 ? 4 : 1, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function TrendChart({
  points,
  title,
  series,
  formatValue,
  unit,
}: {
  points: TrendPoint[];
  title: string;
  series: "spend" | "conversions";
  /** How the tooltip formats values; "money" uses `unit` as the currency code. */
  formatValue: "money" | "number";
  unit?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const slot = n ? plotW / n : plotW;
  const barW = Math.max(1.5, Math.min(24, slot - 2, slot * 0.72));
  const y = (v: number) => MARGIN.top + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 72))));
  const fill = series === "spend" ? "var(--chart-spend)" : "var(--chart-conversions)";

  const fmt = (v: number) =>
    formatValue === "money" && unit
      ? new Intl.NumberFormat("en-KE", { style: "currency", currency: unit, maximumFractionDigits: v >= 1000 ? 0 : 2 }).format(v)
      : new Intl.NumberFormat("en-KE", { maximumFractionDigits: 1 }).format(v);

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width - MARGIN.left;
    setActive(n ? Math.min(n - 1, Math.max(0, Math.floor(x / slot))) : null);
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!n) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? (e.key === "ArrowRight" ? -1 : n)) + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
  };

  const a = active !== null ? points[active] : null;
  const tipLeft = active !== null ? ((MARGIN.left + slot * active + slot / 2) / width) * 100 : 0;

  return (
    <div ref={ref} className="relative w-full">
      <svg
        role="img"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        tabIndex={0}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        className="block touch-pan-y overflow-visible rounded-md outline-none focus-visible:ring-4 focus-visible:ring-teal/25"
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? (n ? n - 1 : null))}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>Daily values; use the left and right arrow keys to read each day. The table below lists every value.</desc>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-soft text-[11px] tabular-nums">
              {compact(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const h = Math.max(0, (p.value / max) * plotH);
          const x = MARGIN.left + slot * i + (slot - barW) / 2;
          return (
            <g key={p.date}>
              {active === i && <rect x={MARGIN.left + slot * i} y={MARGIN.top} width={slot} height={plotH} className="fill-surface-2" />}
              {h > 0 && <path d={columnPath(x, y(p.value), barW, h)} fill={fill} opacity={active === null || active === i ? 1 : 0.55} />}
              {i % labelEvery === 0 && (
                <text x={MARGIN.left + slot * i + slot / 2} y={HEIGHT - 6} textAnchor="middle" className="fill-ink-soft text-[11px]">
                  {dayLabel(p.date, { day: "numeric", month: "short" })}
                </text>
              )}
            </g>
          );
        })}
        <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
      </svg>

      {a && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-xs shadow-md print:hidden"
          style={{ left: `${Math.min(88, Math.max(12, tipLeft))}%` }}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: fill }} />
            <strong className="text-sm text-heading">{fmt(a.value)}</strong>
          </span>
          <span className="block text-ink-soft">{dayLabel(a.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      )}
    </div>
  );
}

/** Small legend-free caption swatch for a chart card's title. */
export function SeriesKey({ series, className }: { series: "spend" | "conversions"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 rounded-sm", className)}
      style={{ background: series === "spend" ? "var(--chart-spend)" : "var(--chart-conversions)" }}
    />
  );
}
