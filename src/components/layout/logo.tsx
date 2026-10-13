import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#12233F" />
      <path d="M9 28V12.5l11 9.5 11-9.5V28" fill="none" stroke="#18B6A4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31" cy="12.5" r="2.6" fill="#F5B83D" />
    </svg>
  );
}

export function Logo({ className, onInverse }: { className?: string; onInverse?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md", className)} aria-label="Mavqo Digital — home">
      <LogoMark className={cn("size-9 rounded-[11px]", onInverse ? "ring-1 ring-white/20" : "dark:ring-1 dark:ring-white/15")} />
      <span className={cn("text-xl font-black tracking-tight", onInverse ? "text-on-inverse" : "text-heading")}>
        mavqo<span className={cn("font-normal", onInverse ? "text-on-inverse-soft" : "text-ink-soft")}>digital</span>
      </span>
    </Link>
  );
}
