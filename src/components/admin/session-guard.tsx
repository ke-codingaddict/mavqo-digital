"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

/**
 * Admin inactivity timeout. Signs the admin out once `timeoutSeconds` pass
 * with no keyboard, pointer, scroll or touch input in any open admin tab, and
 * keeps the server-side session alive while they are active. The server
 * enforces the same window on its own, so this is the prompt, visible half.
 */

const ACTIVITY_KEY = "mavqo_admin_last_activity";
const SIGNED_OUT_KEY = "mavqo_admin_signed_out";
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;
/** At most one heartbeat per this interval while the admin is active. */
const HEARTBEAT_MS = 20_000;
const WARNING_MS = 60_000;

type Reason = "idle" | "expired" | "signed_out";

function readShared(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function writeShared(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: this tab still times out on its own.
  }
}

/** Tells other admin tabs to leave too. */
function broadcastSignOut(reason: Reason) {
  writeShared(SIGNED_OUT_KEY, `${reason}:${Date.now()}`);
}

export function SessionGuard({ timeoutSeconds }: { timeoutSeconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const timeoutMs = timeoutSeconds * 1000;
    let lastActivity = Date.now();
    let lastHeartbeat = 0;
    let pending = true; // loading the page counts as activity
    let leaving = false;

    // Hard navigation, so no admin data survives in the client router cache.
    const leave = async (reason: Reason, notifyServer: boolean) => {
      if (leaving) return;
      leaving = true;
      if (notifyServer) {
        broadcastSignOut(reason);
        await fetch("/admin/session/", { method: "DELETE", redirect: "manual" }).catch(() => {});
      }
      window.location.replace(`/admin/login/?reason=${reason}`);
    };

    const heartbeat = async () => {
      lastHeartbeat = Date.now();
      pending = false;
      try {
        const res = await fetch("/admin/session/", { method: "POST", redirect: "manual" });
        if (res.status === 401 || res.type === "opaqueredirect") void leave("expired", true);
      } catch {
        // Offline for a moment: the idle timer still decides.
      }
    };

    const tick = () => {
      if (leaving) return;
      const now = Date.now();
      const idleMs = now - Math.max(lastActivity, readShared(ACTIVITY_KEY));
      if (idleMs >= timeoutMs) {
        void leave("idle", true);
        return;
      }
      if (pending && now - lastHeartbeat >= HEARTBEAT_MS) void heartbeat();
      const left = timeoutMs - idleMs;
      setSecondsLeft(left <= WARNING_MS ? Math.ceil(left / 1000) : null);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 1000) return; // pointermove fires constantly
      lastActivity = now;
      pending = true;
      writeShared(ACTIVITY_KEY, String(now));
      tick();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === SIGNED_OUT_KEY && e.newValue) {
        const reason = e.newValue.split(":")[0] as Reason;
        void leave(reason === "idle" ? "idle" : "signed_out", false);
      }
    };

    // Background tabs throttle timers, so re-check as soon as the tab is visible again.
    const onVisible = () => document.visibilityState === "visible" && tick();

    writeShared(ACTIVITY_KEY, String(lastActivity));
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true, capture: true });
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    const timer = window.setInterval(tick, 1000);
    tick();

    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity, { capture: true });
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
      window.clearInterval(timer);
    };
  }, [timeoutSeconds]);

  if (secondsLeft === null) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-5 z-[60] mx-auto max-w-md rounded-[var(--radius-lg)] border border-line bg-surface p-4 text-sm text-heading shadow-lg"
    >
      <p className="font-bold">Signing you out in {secondsLeft}s</p>
      <p className="mt-1 text-ink-soft">You&apos;ve been inactive. Move the mouse or press any key to stay signed in.</p>
    </div>
  );
}

/** Sign-out button that also signs out the admin's other open tabs. */
export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} onSubmit={() => broadcastSignOut("signed_out")}>
      <button type="submit" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-bold text-heading hover:bg-surface-2">
        <LogOut aria-hidden="true" className="size-4" /> Sign out
      </button>
    </form>
  );
}
