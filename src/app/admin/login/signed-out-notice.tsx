"use client";

import { useSearchParams } from "next/navigation";

const notices: Record<string, string> = {
  idle: "You were signed out after 5 minutes of inactivity.",
  expired: "Your session has ended. Please sign in again.",
  signed_out: "You signed out in another tab.",
};

export function SignedOutNotice() {
  const notice = notices[useSearchParams().get("reason") ?? ""];
  if (!notice) return null;
  return (
    <p role="status" className="mb-5 rounded-[var(--radius-md)] bg-warning-wash p-3 text-sm font-medium text-warning">
      {notice}
    </p>
  );
}
