"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Line chart of one daily metric for the selected period, drawn over the
 * previous period (grey) so the reader sees at a glance whether things are
 * better or worse. One y-axis, one metric at a time; tabs switch the metric.
 * Rendered as SVG on the server too, so it prints crisply. Hover, tap or the
 * arrow keys show both periods' values for a day.
 */

export type ChartPoint = { date: string; cost: number; conversions: number; clicks: number };
export type MetricKey = "conversions" | "cost" | "clicks";

const METRICS: Record<MetricKey, { label: string; color: string; money?: boolean }> = {
  conversions: { label: "Conversions", color: "var(--chart-conversions)" },
  cost: { label: "Money spent", color: "var(--chart-spend)", money: true },
  clicks: { label: "Clicks", color: "var(--chart-clicks)" },
};

const MARGIN = { top: 16, right: 12, bottom: 28, left: 52 };

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * exp;
}

const compact = (n: number) => new Intl.NumberFormat("en-KE", { notation: n >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-KE", { timeZone: "UTC", ...opts }).format(new Date(`${iso}T00:00:00Z`));

function format(v: number, money: boolean | undefined, currency: string) {
  if (money) {
    try {
      return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: v >= 1000 ? 0 : 2 }).format(v);
    } catch {
      return `${currency} ${Math.round(v).toLocaleString("en-KE")}`;
    }
  }
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 1 }).format(v);
}

export function PerformanceChart({
  current,
  previous,
  currency,
  metrics = ["conversions", "cost", "clicks"],
  weekly = false,
  height = 260,
}: {
  current: ChartPoint[];
  previous: ChartPoint[];
  currency: string;
  metrics?: MetricKey[];
  /** Points are 7-day totals rather than days. */
  weekly?: boolean;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [metric, setMetric] = useState<MetricKey>(metrics[0]);
  const [active, setActive] = useState<number | null>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = METRICS[metric];
  const n = current.length;
  const cur = current.map((p) => p[metric]);
  const prev = previous.slice(0, n).map((p) => p[metric]);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const max = niceMax(Math.max(0, ...cur, ...prev));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const x = (i: number) => MARGIN.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v: number) => MARGIN.top + plotH - (v / max) * plotH;
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = n > 1 ? `${line(cur)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z` : "";
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 78))));
  const unit = weekly ? "week" : "day";

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    if (!n) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setActive(Math.min(n - 1, Math.max(0, Math.round(((px - MARGIN.left) / plotW) * (n - 1)))));
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!n) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      setActive((i) => Math.min(n - 1, Math.max(0, (i ?? (step > 0 ? -1 : n)) + step)));
    } else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
  };

  const tipLeft = active !== null ? (x(active) / width) * 100 : 0;
  const hasPrev = prev.some((v) => v > 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {metrics.length > 1 ? (
          <div role="tablist" aria-label="Metric" className="inline-flex rounded-full bg-surface-2 p-1 print:hidden">
            {metrics.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={metric === k}
                onClick={() => setMetric(k)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors",
                  metric === k ? "bg-surface text-heading shadow-sm" : "text-ink-soft hover:text-heading",
                )}
              >
                {METRICS[k].label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <ul className="flex items-center gap-4 text-xs text-ink-soft" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: m.color }} />
            This period
          </li>
          {hasPrev && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: "var(--chart-previous)" }} />
              Previous period
            </li>
          )}
        </ul>
      </div>

      <div ref={ref} className="relative w-full">
        <svg
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
          tabIndex={0}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="block touch-pan-y overflow-visible rounded-md outline-none focus-visible:ring-4 focus-visible:ring-teal/25"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((i) => i ?? (n ? n - 1 : null))}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
        >
          <title id={`${id}-t`}>{`${m.label} per ${unit}, this period compared with the previous one`}</title>
          <desc id={`${id}-d`}>Use the left and right arrow keys to read each {unit}.</desc>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={m.color} stopOpacity={0.16} />
              <stop offset="1" stopColor={m.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={MARGIN.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-soft text-[11px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          ))}
          {current.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.date} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : "middle"} className="fill-ink-soft text-[11px]">
                {dayLabel(p.date, { day: "numeric", month: "short" })}
              </text>
            ) : null,
          )}

          {hasPrev && <path d={line(prev)} fill="none" stroke="var(--chart-previous)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
          {n > 1 && <path d={area} fill={`url(#${id}-fill)`} />}
          <path d={line(cur)} fill="none" stroke={m.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={y(0)} stroke="var(--line-strong)" strokeWidth={1} shapeRendering="crispEdges" />
              {hasPrev && prev[active] !== undefined && <circle cx={x(active)} cy={y(prev[active])} r={4} fill="var(--chart-previous)" stroke="var(--surface)" strokeWidth={2} />}
              <circle cx={x(active)} cy={y(cur[active])} r={5} fill={m.color} stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>

        {active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-xs shadow-md print:hidden"
            style={{ left: `${Math.min(85, Math.max(15, tipLeft))}%` }}
          >
            <p className="mb-1 font-bold text-heading">
              {weekly && "Week of "}
              {dayLabel(current[active].date, { weekday: weekly ? undefined : "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink-soft">
                <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: m.color }} />
                {m.label}
              </span>
              <strong className="text-heading tabular-nums">{format(cur[active], m.money, currency)}</strong>
            </p>
            {hasPrev && previous[active] && (
              <p className="mt-0.5 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: "var(--chart-previous)" }} />
                  {dayLabel(previous[active].date, { day: "numeric", month: "short" })}
                </span>
                <span className="text-ink tabular-nums">{format(prev[active], m.money, currency)}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
