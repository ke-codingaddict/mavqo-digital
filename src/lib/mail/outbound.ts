import "server-only";
import { randomUUID } from "node:crypto";
import type { MailCategory } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getMailConfig } from "@/lib/settings";
import { sendEmail } from "./resend";
import { formatAddress, normalizeSubject, oneLine, parseAddress, textToHtml, wrapHtml } from "./format";
import { signatureHtml, signatureText, type Signature } from "./signature";

export type OutboundMail = {
  to: string[];
  cc?: string[];
  subject: string;
  /** Message body as plain text; rendered to HTML. */
  text: string;
  /** Optional custom HTML body (used instead of rendering `text`). */
  html?: string;
  /** Stored category; "lead_notification" is internal and never recorded. */
  category: MailCategory | "lead_notification";
  sentById?: string | null;
  /** Sender display name for this message (defaults to the configured sender name). */
  fromName?: string;
  signature?: Signature | null;
  /** Quoted original appended below the signature, for replies. */
  quote?: { text: string; html: string };
  /** Overrides the configured Reply-To. */
  replyTo?: string;
  /** Threading for replies. */
  inReplyTo?: { messageId: string | null; references: string[] };
  /** Store the message in the mail inbox (customer-facing mail). Off for internal notifications. */
  record?: { threadId?: string; leadId?: string | null };
  idempotencyKey?: string;
};

export type SendOutcome =
  | { ok: true; messageId?: string; threadId?: string }
  | { ok: false; reason: "not_configured" | "provider_error"; message: string; messageId?: string; threadId?: string };

/** Finds the open conversation with this contact about this subject, or starts one. */
export async function findOrCreateThread(contact: { email: string; name: string | null }, subject: string, leadId?: string | null) {
  const client = db();
  const normalized = normalizeSubject(subject);
  const existing = await client.mailThread.findFirst({
    where: { contactEmail: contact.email, normalizedSubject: normalized, lastMessageAt: { gte: new Date(Date.now() - 90 * 86_400_000) } },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const lead =
    leadId !== undefined
      ? leadId
      : ((await client.lead.findFirst({ where: { email: contact.email }, orderBy: { createdAt: "desc" }, select: { id: true } }))?.id ?? null);
  const thread = await client.mailThread.create({
    data: { subject: oneLine(subject).slice(0, 300) || "(no subject)", normalizedSubject: normalized, contactEmail: contact.email, contactName: contact.name, leadId: lead },
    select: { id: true },
  });
  return thread.id;
}

/**
 * Sends an email through the configured provider. Customer-facing mail is
 * recorded in its conversation (including failures, so nothing is lost
 * silently); internal notifications are sent without being stored.
 */
export async function sendMail(mail: OutboundMail): Promise<SendOutcome> {
  const config = await getMailConfig();
  if (!config.apiKey || !config.from || !config.fromAddress) {
    return { ok: false, reason: "not_configured", message: "Email isn't set up yet. An admin can connect it in Settings → Email." };
  }

  const domain = config.fromAddress.split("@")[1];
  const messageId = `<${randomUUID()}@${domain}>`;
  const subject = oneLine(mail.subject).slice(0, 300);
  const sigText = mail.signature ? signatureText(mail.signature) : "";
  const sigHtml = mail.signature ? signatureHtml(mail.signature) : "";
  const text = `${mail.text.trim()}${sigText}${mail.quote?.text ?? ""}`;
  const html = wrapHtml(`${mail.html ?? textToHtml(mail.text)}${sigHtml}${mail.quote?.html ?? ""}`);

  const headers: Record<string, string> = { "Message-ID": messageId };
  if (mail.inReplyTo?.messageId) {
    headers["In-Reply-To"] = mail.inReplyTo.messageId;
    headers["References"] = [...mail.inReplyTo.references, mail.inReplyTo.messageId].slice(-20).join(" ");
  }

  const replyTo = mail.replyTo ?? config.replyTo ?? undefined;
  const result = await sendEmail(
    config.apiKey,
    {
      from: formatAddress(mail.fromName ?? config.fromName, config.fromAddress),
      to: mail.to,
      cc: mail.cc?.length ? mail.cc : undefined,
      subject,
      text,
      html,
      reply_to: replyTo,
      headers,
      tags: [{ name: "category", value: mail.category }],
    },
    mail.idempotencyKey,
  );

  if (!mail.record || mail.category === "lead_notification") {
    return result.ok ? { ok: true } : { ok: false, reason: "provider_error", message: result.message };
  }

  const contact = parseAddress(mail.to[0]);
  const threadId = mail.record.threadId ?? (await findOrCreateThread(contact, subject, mail.record.leadId));
  const now = new Date();
  const message = await db().mailMessage.create({
    data: {
      threadId,
      direction: "outbound",
      category: mail.category as MailCategory,
      status: result.ok ? "sent" : "failed",
      fromAddress: config.fromAddress,
      fromName: mail.fromName ?? config.fromName,
      to: mail.to,
      cc: mail.cc ?? [],
      subject,
      text,
      html,
      messageId,
      inReplyTo: mail.inReplyTo?.messageId ?? null,
      references: mail.inReplyTo ? [...mail.inReplyTo.references, ...(mail.inReplyTo.messageId ? [mail.inReplyTo.messageId] : [])] : [],
      resendId: result.ok ? result.data.id : null,
      error: result.ok ? null : result.message.slice(0, 300),
      sentById: mail.sentById ?? null,
      readAt: now,
    },
    select: { id: true },
  });
  await db().mailThread.update({ where: { id: threadId }, data: { lastMessageAt: now } });

  return result.ok
    ? { ok: true, messageId: message.id, threadId }
    : { ok: false, reason: "provider_error", message: result.message, messageId: message.id, threadId };
}
