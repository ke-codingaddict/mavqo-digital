import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/mail/webhook-signature";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/security/crypto";
import {
  formatAddress,
  htmlToText,
  normalizeSubject,
  oneLine,
  parseAddress,
  parseMessageIds,
  quoteOriginal,
  replySubject,
  textToHtml,
} from "@/lib/mail/format";
import { parseSignature, signatureHtml, signatureText } from "@/lib/mail/signature";
import { analyticsSchema, mailSettingsSchema } from "@/lib/settings/schema";
import { can } from "@/lib/auth/permissions";

describe("webhook signatures (Svix scheme)", () => {
  // Test vector published in Svix's manual-verification docs.
  const vector = {
    id: "msg_loFOjxBNrRLzqYUf",
    timestamp: "1731705121",
    body: '{"event_type":"ping","data":{"success":true}}',
    secret: "whsec_plJ3nmyCDGBKInavdOK15jsl",
    signature: "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=",
  };
  const at = Number(vector.timestamp) * 1000;

  it("accepts the published test vector", () => {
    expect(verifyWebhookSignature({ ...vector, now: at })).toBe(true);
  });
  it("accepts when any of several signatures matches", () => {
    expect(verifyWebhookSignature({ ...vector, signature: `v1,AAAA ${vector.signature}`, now: at })).toBe(true);
  });
  it("rejects a tampered body, wrong secret or wrong id", () => {
    expect(verifyWebhookSignature({ ...vector, body: vector.body.replace("true", "false"), now: at })).toBe(false);
    expect(verifyWebhookSignature({ ...vector, secret: "whsec_c2VjcmV0", now: at })).toBe(false);
    expect(verifyWebhookSignature({ ...vector, id: "msg_other", now: at })).toBe(false);
  });
  it("rejects replays outside the 5-minute window", () => {
    expect(verifyWebhookSignature({ ...vector, now: at + 6 * 60_000 })).toBe(false);
    expect(verifyWebhookSignature({ ...vector, now: at - 6 * 60_000 })).toBe(false);
  });
  it("rejects missing headers and other signature versions", () => {
    expect(verifyWebhookSignature({ ...vector, signature: null, now: at })).toBe(false);
    expect(verifyWebhookSignature({ ...vector, signature: vector.signature.replace("v1,", "v2,"), now: at })).toBe(false);
  });
});

describe("secret encryption", () => {
  const key = "k".repeat(40);
  it("round-trips and uses a fresh IV each time", () => {
    const a = encryptSecret("re_live_secret", key);
    expect(a).not.toContain("re_live_secret");
    expect(a).not.toBe(encryptSecret("re_live_secret", key));
    expect(decryptSecret(a, key)).toBe("re_live_secret");
  });
  it("fails closed on a wrong key or tampering", () => {
    const sealed = encryptSecret("value", key);
    expect(decryptSecret(sealed, "x".repeat(40))).toBeNull();
    const [v, iv, tag, ct] = sealed.split(".");
    const flipped = Buffer.from(ct, "base64url");
    flipped[0] ^= 1;
    expect(decryptSecret([v, iv, tag, flipped.toString("base64url")].join("."), key)).toBeNull();
    expect(decryptSecret("garbage", key)).toBeNull();
  });
  it("masks secrets", () => {
    expect(maskSecret("re_abcdefghijklmnop")).toBe("re_••••mnop");
    expect(maskSecret("short")).toBe("••••");
  });
});

describe("mail formatting and threading", () => {
  it("normalizes reply/forward subject prefixes", () => {
    expect(normalizeSubject("Re: Fwd: RE: Quote request")).toBe("quote request");
    expect(normalizeSubject("AW: [2] Re:  Hello")).toBe("hello");
    expect(normalizeSubject("")).toBe("(no subject)");
    expect(replySubject("Re: Hello")).toBe("Re: Hello");
    expect(replySubject("Hello")).toBe("Re: Hello");
  });
  it("parses and formats addresses safely", () => {
    expect(parseAddress('"Jane W" <Jane@Example.com>')).toEqual({ name: "Jane W", email: "jane@example.com" });
    expect(parseAddress("bob@example.com")).toEqual({ name: null, email: "bob@example.com" });
    expect(formatAddress('Evil" <x@y>\r\nBcc: z@z', "a@b.co")).toBe('"Evil <x@y> Bcc: z@z" <a@b.co>');
  });
  it("strips control characters from header values", () => {
    expect(oneLine("Hi\r\nBcc: x@y.z")).toBe("Hi Bcc: x@y.z");
  });
  it("escapes text when rendering HTML", () => {
    expect(textToHtml("<script>alert(1)</script>\n\nok")).not.toContain("<script>");
    const q = quoteOriginal({ from: "A <a@b.c>", date: new Date(), text: "<b>hi</b>" }, "1 Jan");
    expect(q.html).not.toContain("<b>hi</b>");
    expect(q.text).toContain("> <b>hi</b>");
  });
  it("extracts text from HTML and message ids from headers", () => {
    expect(htmlToText("<style>p{}</style><p>Hello&nbsp;<b>there</b></p><p>Bye</p>")).toBe("Hello there\nBye");
    expect(parseMessageIds("<a@x> <b@y>\r\n <c@z>")).toEqual(["<a@x>", "<b@y>", "<c@z>"]);
  });
});

describe("signatures", () => {
  it("escapes every value and rejects unsafe links", () => {
    const sig = parseSignature({ name: '<img src=x onerror="alert(1)">', website: "javascript:alert(1)" });
    // Invalid website → whole signature falls back to empty (never partially trusted).
    expect(sig.website).toBe("");
    const ok = parseSignature({ name: '<img src=x onerror="alert(1)">', website: "https://example.com" });
    expect(signatureHtml(ok)).not.toContain("<img");
    expect(signatureHtml(ok)).toContain("&lt;img");
    expect(signatureText(ok)).toContain("\n-- \n");
  });
});

describe("settings validation", () => {
  it("accepts well-formed IDs and the full Search Console meta tag", () => {
    const r = analyticsSchema.parse({
      gaMeasurementId: "G-ABC123XYZ9",
      googleAdsId: "AW-123456789",
      searchConsoleToken: '<meta name="google-site-verification" content="abcDEF123_-abcDEF123_-xyz" />',
    });
    expect(r.searchConsoleToken).toBe("abcDEF123_-abcDEF123_-xyz");
  });
  it("rejects values that could break out of the gtag script", () => {
    expect(analyticsSchema.safeParse({ gaMeasurementId: "G-1');alert(1)//", googleAdsId: "", searchConsoleToken: "" }).success).toBe(false);
    expect(analyticsSchema.safeParse({ gaMeasurementId: "", googleAdsId: "AW-1x", searchConsoleToken: "" }).success).toBe(false);
  });
  it("treats blanks as unset", () => {
    expect(analyticsSchema.parse({ gaMeasurementId: " ", googleAdsId: "", searchConsoleToken: "" })).toEqual({
      gaMeasurementId: undefined,
      googleAdsId: undefined,
      searchConsoleToken: undefined,
    });
  });
  it("validates mail settings and dedupes notification emails", () => {
    const r = mailSettingsSchema.parse({
      fromName: "Mavqo",
      fromAddress: "Hello@Mavqo.co.ke",
      replyTo: "",
      notificationEmails: "a@x.co, A@x.co; b@x.co",
      autoReply: true,
      teamSignature: {},
    });
    expect(r.fromAddress).toBe("hello@mavqo.co.ke");
    expect(r.notificationEmails).toEqual(["a@x.co", "b@x.co"]);
    expect(mailSettingsSchema.safeParse({ ...r, notificationEmails: "not-an-email", teamSignature: {} }).success).toBe(false);
  });
});

describe("mail & settings permissions", () => {
  it("lets sales use mail but not change settings", () => {
    expect(can("sales", "mail:use")).toBe(true);
    expect(can("sales", "settings:manage")).toBe(false);
    expect(can("admin", "settings:manage")).toBe(true);
  });
});
