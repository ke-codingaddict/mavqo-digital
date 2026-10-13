import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { saveMailSecrets, saveMailSettings } from "@/lib/settings";
import { ingestReceivedEmail } from "@/lib/mail/inbound";
import { sendMail } from "@/lib/mail/outbound";

/** Runs against the test database; Resend's HTTP API is mocked. */

let userId: string;
const received = new Map<string, object>();
const sent: { body: Record<string, unknown>; idempotencyKey: string | null }[] = [];

function mockResend() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === "/emails" && init?.method === "POST") {
        sent.push({ body: JSON.parse(String(init.body)), idempotencyKey: new Headers(init.headers).get("Idempotency-Key") });
        return Response.json({ id: crypto.randomUUID() });
      }
      const m = path.match(/^\/emails\/receiving\/(.+)$/);
      if (m && received.has(m[1])) return Response.json(received.get(m[1]));
      return Response.json({ message: "not found" }, { status: 404 });
    }),
  );
}

function inbound(id: string, over: Record<string, unknown> = {}) {
  received.set(id, {
    id,
    from: "Jane Customer <jane@client.co.ke>",
    to: ["inbox@test.resend.app"],
    subject: "Pricing question",
    html: "<p>Hello <b>team</b></p>",
    text: "Hello team",
    headers: {},
    message_id: `<${id}@client.co.ke>`,
    created_at: new Date().toISOString(),
    ...over,
  });
}

async function clean() {
  await db().mailThread.deleteMany();
  await db().lead.deleteMany();
}

beforeAll(async () => {
  const user = await db().user.upsert({
    where: { email: "mail-test@example.com" },
    create: { email: "mail-test@example.com", name: "Mail Test", passwordHash: "x", role: "admin" },
    update: {},
  });
  userId = user.id;
  await saveMailSecrets({ apiKey: "re_test_key_1234567890" }, userId);
  await saveMailSettings(
    { fromName: "Mavqo", fromAddress: "hello@mavqo.test", replyTo: "inbox@test.resend.app", notificationEmails: ["team@mavqo.test"], autoReply: true, teamSignature: { closing: "", name: "", title: "", company: "", phone: "", email: "", website: "" } },
    userId,
  );
});

beforeEach(async () => {
  await clean();
  received.clear();
  sent.length = 0;
  mockResend();
});

afterEach(() => vi.unstubAllGlobals());

afterAll(async () => {
  await clean();
  await db().setting.deleteMany();
  await db().user.deleteMany({ where: { email: "mail-test@example.com" } });
  await db().$disconnect();
});

describe("inbound mail", () => {
  it("stores a received email in a new thread linked to the matching lead", async () => {
    const lead = await db().lead.create({ data: { reference: "MVQ-MAIL01", enquiryType: "contact", name: "Jane", email: "jane@client.co.ke" } });
    const id = crypto.randomUUID();
    inbound(id);

    expect(await ingestReceivedEmail(id)).toBe("stored");
    const thread = await db().mailThread.findFirstOrThrow({ include: { messages: true } });
    expect(thread).toMatchObject({ contactEmail: "jane@client.co.ke", contactName: "Jane Customer", leadId: lead.id, normalizedSubject: "pricing question" });
    expect(thread.messages[0]).toMatchObject({ direction: "inbound", text: "Hello team", readAt: null, resendId: id });
  });

  it("is idempotent when the webhook is retried", async () => {
    const id = crypto.randomUUID();
    inbound(id);
    expect(await ingestReceivedEmail(id)).toBe("stored");
    expect(await ingestReceivedEmail(id)).toBe("duplicate");
    expect(await db().mailMessage.count()).toBe(1);
  });

  it("throws when Resend can't provide the content, so the webhook is retried", async () => {
    await expect(ingestReceivedEmail(crypto.randomUUID())).rejects.toThrow();
  });
});

describe("replies and threading", () => {
  it("threads a customer's reply via In-Reply-To, even with a changed subject", async () => {
    const first = await sendMail({ category: "compose", to: ["jane@client.co.ke"], subject: "Your quote", text: "Hi Jane", sentById: userId, record: {} });
    expect(first.ok).toBe(true);
    const outbound = await db().mailMessage.findFirstOrThrow({ where: { direction: "outbound" } });
    expect(outbound.messageId).toMatch(/^<.+@mavqo\.test>$/);

    // The sent email carries our Message-ID and reply-to inbox.
    expect(sent[0].body).toMatchObject({ reply_to: "inbox@test.resend.app", headers: { "Message-ID": outbound.messageId } });

    const id = crypto.randomUUID();
    inbound(id, { subject: "Different subject entirely", headers: { "In-Reply-To": outbound.messageId!, References: outbound.messageId! } });
    await ingestReceivedEmail(id);

    expect(await db().mailThread.count()).toBe(1);
    const msgs = await db().mailMessage.findMany({ where: { threadId: first.ok ? first.threadId : "" } });
    expect(msgs).toHaveLength(2);
  });

  it("sends replies with threading headers and the idempotency key", async () => {
    const res = await sendMail({
      category: "reply",
      to: ["jane@client.co.ke"],
      subject: "Re: Pricing",
      text: "Thanks!",
      inReplyTo: { messageId: "<orig@client.co.ke>", references: ["<root@client.co.ke>"] },
      record: {},
      idempotencyKey: "reply-abc",
    });
    expect(res.ok).toBe(true);
    expect(sent[0].idempotencyKey).toBe("reply-abc");
    expect(sent[0].body.headers).toMatchObject({ "In-Reply-To": "<orig@client.co.ke>", References: "<root@client.co.ke> <orig@client.co.ke>" });
  });

  it("records failed sends instead of losing them", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Domain not verified" }, { status: 403 })));
    const res = await sendMail({ category: "compose", to: ["jane@client.co.ke"], subject: "Hello", text: "Hi", record: {} });
    expect(res.ok).toBe(false);
    const msg = await db().mailMessage.findFirstOrThrow();
    expect(msg).toMatchObject({ status: "failed", error: "Domain not verified" });
  });

  it("doesn't store internal lead notifications", async () => {
    await sendMail({ category: "lead_notification", to: ["team@mavqo.test"], subject: "New lead", text: "x", record: {} });
    expect(sent).toHaveLength(1);
    expect(await db().mailMessage.count()).toBe(0);
  });
});
