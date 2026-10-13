import { z } from "zod";
import { escapeHtml } from "./format";

/** Structured signature, rendered consistently as HTML and plain text. */
export const signatureSchema = z.object({
  closing: z.string().trim().max(60).optional().default(""),
  name: z.string().trim().max(120).optional().default(""),
  title: z.string().trim().max(120).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.union([z.literal(""), z.email().max(254)]).optional().default(""),
  website: z
    .union([z.literal(""), z.url({ protocol: /^https?$/ }).max(200)])
    .optional()
    .default(""),
});

export type Signature = z.infer<typeof signatureSchema>;

export const emptySignature: Signature = { closing: "", name: "", title: "", company: "", phone: "", email: "", website: "" };

export function parseSignature(value: unknown): Signature {
  const parsed = signatureSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : emptySignature;
}

export function isSignatureEmpty(s: Signature) {
  return !s.name && !s.title && !s.company && !s.phone && !s.email && !s.website && !s.closing;
}

/** Plain-text version, separated from the body by the standard "-- " delimiter. */
export function signatureText(s: Signature): string {
  if (isSignatureEmpty(s)) return "";
  const lines = [s.closing, s.name, [s.title, s.company].filter(Boolean).join(", "), s.phone, s.email, s.website].filter(Boolean);
  return `\n\n-- \n${lines.join("\n")}`;
}

/** Email-client-safe HTML: inline styles and tables only. Every value is escaped. */
export function signatureHtml(s: Signature): string {
  if (isSignatureEmpty(s)) return "";
  const e = escapeHtml;
  const role = [s.title, s.company].filter(Boolean).map(e).join(" · ");
  const contact = [
    s.phone && `<a href="tel:${e(s.phone.replace(/[^\d+]/g, ""))}" style="color:#0a7569;text-decoration:none">${e(s.phone)}</a>`,
    s.email && `<a href="mailto:${e(s.email)}" style="color:#0a7569;text-decoration:none">${e(s.email)}</a>`,
    s.website && `<a href="${e(s.website)}" style="color:#0a7569;text-decoration:none">${e(s.website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>`,
  ].filter(Boolean);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3a4659">
${s.closing ? `<tr><td style="padding-bottom:12px">${e(s.closing)}</td></tr>` : ""}
<tr><td style="border-left:3px solid #18b6a4;padding-left:12px">
${s.name ? `<div style="font-weight:700;color:#0f1e36;font-size:15px">${e(s.name)}</div>` : ""}
${role ? `<div style="color:#667085">${role}</div>` : ""}
${contact.length ? `<div style="margin-top:4px">${contact.join(' <span style="color:#d4cbbc">|</span> ')}</div>` : ""}
</td></tr></table>`;
}
