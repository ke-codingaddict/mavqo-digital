import { NextResponse, type NextRequest } from "next/server";
import { getMailConfig } from "@/lib/settings";
import { verifyWebhookSignature } from "@/lib/mail/webhook-signature";
import { ingestReceivedEmail } from "@/lib/mail/inbound";

/**
 * Resend "email.received" webhook. Rejects anything not signed with the
 * secret saved when the inbox was connected, and anything older than the
 * signature tolerance (replays). Returns 5xx on transient failures so Resend
 * retries; storing is idempotent on the email id.
 */
const MAX_BODY = 256 * 1024;

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (body.length > MAX_BODY) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const { webhookSecret } = await getMailConfig();
  if (!webhookSecret) return NextResponse.json({ error: "Inbox not connected" }, { status: 503 });

  const valid = verifyWebhookSignature({
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    body,
    secret: webhookSecret,
  });
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: { type?: string; data?: { email_id?: unknown } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (event.type !== "email.received") return NextResponse.json({ ok: true, ignored: event.type ?? null });

  const emailId = event.data?.email_id;
  if (typeof emailId !== "string" || !/^[0-9a-f-]{36}$/i.test(emailId)) {
    return NextResponse.json({ error: "Missing email id" }, { status: 400 });
  }

  try {
    const result = await ingestReceivedEmail(emailId);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[mail] inbound processing failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Temporary failure" }, { status: 500 });
  }
}
