import "server-only";
import { getServerEnv } from "@/lib/env";

type Email = { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string };

export type SendResult = { ok: true } | { ok: false; reason: "not_configured" | "provider_error" };

/**
 * Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * Swap this one function to change provider.
 */
export async function sendEmail(email: Email): Promise<SendResult> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { ok: false, reason: "not_configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        reply_to: email.replyTo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log status only — never the payload, which contains personal data.
      console.error(`[email] provider responded ${res.status}`);
      return { ok: false, reason: "provider_error" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] request failed:", err instanceof Error ? err.name : "unknown");
    return { ok: false, reason: "provider_error" };
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
