import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type Tone = "canvas" | "muted" | "surface" | "inverse";

const tones: Record<Tone, string> = {
  canvas: "",
  muted: "bg-surface-2",
  surface: "bg-surface",
  inverse: "bg-inverse text-on-inverse-soft [&_h2]:text-on-inverse [&_h3]:text-on-inverse",
};

export function Section({
  id,
  className,
  tone = "canvas",
  children,
  labelledBy,
  /** @deprecated use tone="muted" */
  muted,
}: {
  id?: string;
  className?: string;
  tone?: Tone;
  muted?: boolean;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-16 sm:py-20 lg:py-28", tones[muted ? "muted" : tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  className,
  inverse,
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className={cn("kicker mb-4", inverse && "!text-teal", align === "center" && "justify-center")}>{eyebrow}</p>}
      <h2 id={id} className={cn("text-h2", inverse && "!text-on-inverse")}>
        {title}
      </h2>
      {intro && <p className={cn("text-lead mt-5", inverse ? "text-on-inverse-soft" : "text-ink-soft")}>{intro}</p>}
    </div>
  );
}

const badgeTones = {
  teal: "bg-teal-wash text-teal-ink",
  navy: "bg-heading/[0.06] text-heading",
  sun: "bg-sun-wash text-heading",
  amber: "bg-warning-wash text-warning",
  gray: "bg-surface-2 text-ink-soft ring-1 ring-inset ring-line",
  green: "bg-success-wash text-success",
  red: "bg-danger-wash text-danger",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "teal", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function CheckList({
  items,
  className,
  tone = "teal",
  columns,
}: {
  items: ReactNode[];
  className?: string;
  tone?: "teal" | "light";
  columns?: boolean;
}) {
  return (
    <ul className={cn("grid gap-3", columns && "sm:grid-cols-2 sm:gap-x-8", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 inline-flex size-5.5 shrink-0 items-center justify-center rounded-full",
              tone === "teal" ? "bg-teal-wash text-teal-ink" : "bg-white/12 text-teal",
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
