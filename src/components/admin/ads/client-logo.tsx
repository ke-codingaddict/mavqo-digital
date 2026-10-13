import { cn, initials } from "@/lib/utils";

/**
 * The client's logo, or their initials when none is uploaded. The logo sits on
 * white whatever the theme, since most brand marks are drawn for a light page.
 */
export function ClientLogo({ name, src, className }: { name: string; src: string | null; className?: string }) {
  if (src) {
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-line bg-white p-1.5", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- served from an authenticated route */}
        <img src={src} alt={`${name} logo`} className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-2 font-bold tracking-tight text-ink-soft", className)}
    >
      {initials(name)}
    </span>
  );
}
