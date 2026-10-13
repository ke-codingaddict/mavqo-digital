"use client";

import { useEffect } from "react";
import { markThreadRead } from "@/app/admin/(protected)/mail/actions";

/** Marks a conversation read once it's actually opened (never on prefetch). */
export function MarkRead({ threadId }: { threadId: string }) {
  useEffect(() => {
    void markThreadRead(threadId);
  }, [threadId]);
  return null;
}
