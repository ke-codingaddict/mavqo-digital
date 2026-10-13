"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { sendMail } from "@/lib/mail/outbound";
import { parseSignature } from "@/lib/mail/signature";
import { formatAddress, quoteOriginal, replySubject, splitAddresses } from "@/lib/mail/format";
import { formatDate } from "@/lib/utils";

export type ComposeState = { status: "idle" | "error"; message?: string; errors?: Record<string, string> };

const addressList = (label: string, required: boolean) =>
  z
    .string()
    .transform((v) => [...new Set(splitAddresses(v).map((e) => e.toLowerCase()))])
    .pipe(
      z
        .array(z.email(`One of the ${label} addresses isn't valid`))
        .max(20, `Up to 20 ${label} recipients`)
        .refine((a) => !required || a.length > 0, `Add at least one recipient`),
    );

const composeSchema = z.object({
  to: addressList("To", true),
  cc: addressList("Cc", false),
  subject: z.string().trim().min(1, "Add a subject").max(250),
  body: z.string().trim().min(1, "Write a message").max(50_000),
  includeSignature: z.boolean(),
  leadId: z.uuid().optional(),
});

function errorsOf(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path[0] ?? "form")] ??= i.message;
  return errors;
}

async function signatureFor(userId: string) {
  const row = await db().user.findUnique({ where: { id: userId }, select: { signature: true } });
  return parseSignature(row?.signature);
}

export async function sendCompose(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const user = await requireUser("mail:use");
  const parsed = composeSchema.safeParse({
    to: formData.get("to") ?? "",
    cc: formData.get("cc") ?? "",
    subject: formData.get("subject") ?? "",
    body: formData.get("body") ?? "",
    includeSignature: formData.get("includeSignature") === "on",
    leadId: formData.get("leadId") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", errors: errorsOf(parsed.error.issues) };
  const { to, cc, subject, body, includeSignature, leadId } = parsed.data;

  const result = await sendMail({
    category: "compose",
    to,
    cc,
    subject,
    text: body,
    signature: includeSignature ? await signatureFor(user.id) : null,
    sentById: user.id,
    record: { leadId: leadId && (await db().lead.findUnique({ where: { id: leadId }, select: { id: true } })) ? leadId : undefined },
    idempotencyKey: String(formData.get("idempotencyKey") ?? "") || undefined,
  });
  await audit({ action: "mail_sent", actorId: user.id, entityType: "mail_thread", entityId: result.threadId, metadata: { ok: result.ok, recipients: to.length + cc.length } });
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/admin/mail/${result.threadId}/?sent=1`);
}

const replySchema = z.object({
  threadId: z.uuid(),
  body: z.string().trim().min(1, "Write a reply").max(50_000),
  cc: addressList("Cc", false),
  includeSignature: z.boolean(),
  includeQuote: z.boolean(),
});

export async function sendReply(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  const user = await requireUser("mail:use");
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body") ?? "",
    cc: formData.get("cc") ?? "",
    includeSignature: formData.get("includeSignature") === "on",
    includeQuote: formData.get("includeQuote") === "on",
  });
  if (!parsed.success) return { status: "error", message: "Please fix the highlighted fields.", errors: errorsOf(parsed.error.issues) };
  const { threadId, body, cc, includeSignature, includeQuote } = parsed.data;

  const thread = await db().mailThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      subject: true,
      contactEmail: true,
      contactName: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { messageId: true, references: true, fromAddress: true, fromName: true, text: true, createdAt: true } },
    },
  });
  if (!thread) return { status: "error", message: "This conversation no longer exists." };
  const last = thread.messages[0];

  const result = await sendMail({
    category: "reply",
    to: [thread.contactEmail],
    cc,
    subject: replySubject(thread.subject),
    text: body,
    signature: includeSignature ? await signatureFor(user.id) : null,
    quote:
      includeQuote && last
        ? quoteOriginal(
            { from: formatAddress(last.fromName, last.fromAddress), date: last.createdAt, text: last.text },
            formatDate(last.createdAt, { dateStyle: "medium", timeStyle: "short" }),
          )
        : undefined,
    inReplyTo: last ? { messageId: last.messageId, references: last.references } : undefined,
    sentById: user.id,
    record: { threadId: thread.id },
    idempotencyKey: String(formData.get("idempotencyKey") ?? "") || undefined,
  });
  await audit({ action: "mail_replied", actorId: user.id, entityType: "mail_thread", entityId: thread.id, metadata: { ok: result.ok } });
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/admin/mail/${thread.id}/?sent=1`);
}

const idSchema = z.uuid();

/** Marks every received message in the thread as read (called when it's opened). */
export async function markThreadRead(threadId: string) {
  await requireUser("mail:use");
  const id = idSchema.safeParse(threadId);
  if (!id.success) return;
  const { count } = await db().mailMessage.updateMany({ where: { threadId: id.data, direction: "inbound", readAt: null }, data: { readAt: new Date() } });
  if (count) refresh();
}

export async function setThreadState(formData: FormData) {
  const user = await requireUser("mail:use");
  const id = idSchema.safeParse(formData.get("threadId"));
  if (!id.success) redirect("/admin/mail/");
  const intent = formData.get("intent");
  const client = db();
  if (intent === "archive" || intent === "unarchive") {
    await client.mailThread.update({ where: { id: id.data }, data: { archivedAt: intent === "archive" ? new Date() : null } });
    await audit({ action: `mail_${intent}d`, actorId: user.id, entityType: "mail_thread", entityId: id.data });
    redirect(intent === "archive" ? "/admin/mail/?archived=1" : `/admin/mail/${id.data}/`);
  }
  if (intent === "unread") {
    const latest = await client.mailMessage.findFirst({ where: { threadId: id.data, direction: "inbound" }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (latest) await client.mailMessage.update({ where: { id: latest.id }, data: { readAt: null } });
    redirect("/admin/mail/");
  }
  redirect(`/admin/mail/${id.data}/`);
}
