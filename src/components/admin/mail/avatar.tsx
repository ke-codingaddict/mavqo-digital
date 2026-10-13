import { cn, initials } from "@/lib/utils";

const palette = ["bg-teal-wash text-teal-ink", "bg-sun-wash text-heading", "bg-heading/[0.07] text-heading", "bg-success-wash text-success", "bg-warning-wash text-warning"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, email, className }: { name: string | null; email: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black", palette[hash(email) % palette.length], className)}
    >
      {initials(name || email)}
    </span>
  );
}
