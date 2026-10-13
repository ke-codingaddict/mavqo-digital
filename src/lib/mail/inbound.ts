import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getMailConfig } from "@/lib/settings";
import { getReceivedEmail } from "./resend";
import { htmlToText, oneLine, parseAddress, parseMessageIds } from "./format";
import { findOrCreateThread } from "./outbound";

const MAX_TEXT = 200_000;
const MAX_HTML = 1_000_000;

export type IngestResult = "stored" | "duplicate" | "not_configured";

function header(headers: Record<string, string> | undefined, name: string) {
  if (!headers) return null;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? String(headers[key]) : null;
}

/**
 * Stores a received email. Webhooks only carry metadata, so the content is
 * fetched from Resend. Threading prefers In-Reply-To/References (exact), then
 * falls back to the same contact + subject. Idempotent on Resend's email id.
 * Throws on provider errors so the webhook is retried.
 */
export async function ingestReceivedEmail(emailId: string): Promise<IngestResult> {
  const client = db();
  if (await client.mailMessage.findUnique({ where: { resendId: emailId }, select: { id: true } })) return "duplicate";

  const config = await getMailConfig();
  if (!config.apiKey) return "not_configured";
  const res = await getReceivedEmail(config.apiKey, emailId);
  if (!res.ok) throw new Error(`could not fetch received email (${res.status})`);
  const email = res.data;

  const sender = parseAddress(header(email.headers, "from") ?? email.from);
  const subject = oneLine(email.subject ?? "").slice(0, 300) || "(no subject)";
  const html = email.html ? email.html.slice(0, MAX_HTML) : null;
  const text = (email.text ?? (html ? htmlToText(html) : "")).slice(0, MAX_TEXT);
  const messageId = (email.message_id ?? header(email.headers, "message-id"))?.trim().slice(0, 300) || null;
  const inReplyTo = parseMessageIds(header(email.headers, "in-reply-to"))[0] ?? null;
  const references = parseMessageIds(header(email.headers, "references")).slice(-20);

  const knownIds = [inReplyTo, ...references].filter((v): v is string => Boolean(v));
  const parent = knownIds.length
    ? await client.mailMessage.findFirst({ where: { messageId: { in: knownIds } }, orderBy: { createdAt: "desc" }, select: { threadId: true } })
    : null;
  const threadId = parent?.threadId ?? (await findOrCreateThread(sender, subject));

  try {
    await client.mailMessage.create({
      data: {
        threadId,
        direction: "inbound",
        category: "received",
        status: "received",
        fromAddress: sender.email.slice(0, 254),
        fromName: sender.name?.slice(0, 200) ?? null,
        to: email.to ?? [],
        cc: email.cc ?? [],
        subject,
        text,
        html,
        messageId,
        inReplyTo,
        references,
        resendId: emailId,
        attachments: (email.attachments ?? []).map((a) => ({ filename: a.filename, contentType: a.content_type, size: a.size ?? null })),
        createdAt: new Date(email.created_at),
      },
    });
  } catch (err) {
    // A concurrent retry stored it first, or the sender reused a Message-ID.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = String(err.meta?.target ?? "");
      if (target.includes("resend")) return "duplicate";
      await client.mailMessage.create({
        data: {
          threadId, direction: "inbound", category: "received", status: "received",
          fromAddress: sender.email.slice(0, 254), fromName: sender.name?.slice(0, 200) ?? null,
          to: email.to ?? [], cc: email.cc ?? [], subject, text, html, messageId: null, inReplyTo, references, resendId: emailId,
        },
      });
    } else {
      throw err;
    }
  }

  await client.mailThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date(), archivedAt: null } });
  return "stored";
}
