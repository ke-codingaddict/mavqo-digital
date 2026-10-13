import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", ...opts }).format(new Date(iso));
}

/** Inbox-style timestamp: time today, weekday this week, otherwise the date (Nairobi time). */
export function formatInboxDate(date: Date, now = new Date()) {
  const ageMs = now.getTime() - date.getTime();
  const day = (d: Date) => formatDate(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  if (day(date) === day(now)) return formatDate(date, { timeStyle: "short" });
  if (ageMs < 6 * 86_400_000) return formatDate(date, { weekday: "short" });
  if (date.getFullYear() === now.getFullYear()) return formatDate(date, { day: "numeric", month: "short" });
  return formatDate(date, { dateStyle: "medium" });
}

/** Two-letter initials for avatars. */
export function initials(nameOrEmail: string) {
  const base = nameOrEmail.includes("@") && !nameOrEmail.includes(" ") ? nameOrEmail.split("@")[0].replace(/[._-]+/g, " ") : nameOrEmail;
  const parts = base.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? ""))).toUpperCase();
}
