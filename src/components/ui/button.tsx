import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "inverse" | "inverseOutline";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-bold transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-sm",
  accent: "bg-teal text-[#08131f] hover:bg-[#2bc9b6] shadow-sm",
  secondary: "bg-surface text-heading ring-1 ring-inset ring-line-strong hover:ring-heading/40",
  ghost: "text-heading hover:bg-surface-2",
  inverse: "bg-white text-navy hover:bg-white/90",
  inverseOutline: "text-on-inverse ring-1 ring-inset ring-white/30 hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonLinkProps = { variant?: Variant; size?: Size; children: ReactNode } & ComponentProps<typeof Link>;

export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

type ButtonProps = { variant?: Variant; size?: Size } & ComponentProps<"button">;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

/** Arrow that nudges right on hover of its parent button/link. */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={cn("size-4 transition-transform group-hover/btn:translate-x-0.5 group-hover:translate-x-0.5", className)}>
      <path d="M3 8h9m-3.5-4L12.5 8 8.5 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
