import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Resend webhook (Svix scheme): HMAC-SHA256 over
 * "<svix-id>.<svix-timestamp>.<raw body>" with the base64 secret after "whsec_",
 * compared against each "v1,<base64>" entry in the svix-signature header.
 */
export const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

type Input = { id: string | null; timestamp: string | null; signature: string | null; body: string; secret: string; now?: number };

export function verifyWebhookSignature({ id, timestamp, signature, body, secret, now = Date.now() }: Input): boolean {
  if (!id || !timestamp || !signature || !secret.startsWith("whsec_")) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > WEBHOOK_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(" ").some((entry) => {
    const [version, value] = entry.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
