"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./constants";
type Preference = "light" | "dark" | "system";

const listeners = new Set<() => void>();
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function readPreference(): Preference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: Preference) {
  const dark = pref === "dark" || (pref === "system" && media().matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onSystem = () => {
    if (readPreference() === "system") apply("system");
    cb();
  };
  media().addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    media().removeEventListener("change", onSystem);
  };
}

function setPreference(pref: Preference) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Still applies for this visit.
  }
  apply(pref);
  listeners.forEach((l) => l());
}

const options: { value: Preference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Segmented light / dark / system switch. */
export function ThemeToggle({ className, onInverse }: { className?: string; onInverse?: boolean }) {
  const pref = useSyncExternalStore(subscribe, readPreference, () => "system" as Preference);
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full p-1",
        onInverse ? "bg-white/10" : "bg-surface-2 ring-1 ring-inset ring-line",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setPreference(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-colors",
              active
                ? onInverse
                  ? "bg-white text-navy"
                  : "bg-surface text-heading shadow-sm"
                : onInverse
                  ? "text-on-inverse-soft hover:text-on-inverse"
                  : "text-ink-soft hover:text-heading",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
