/** Helpers for composing and threading email. Pure, so they're easy to test. */

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips line breaks and control characters so user input can't reshape a header. */
export function oneLine(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** "Re: Fwd: RE: Hello" → "hello" — used to match replies to their conversation. */
export function normalizeSubject(subject: string) {
  let s = oneLine(subject).toLowerCase();
  for (;;) {
    const next = s.replace(/^(re|fw|fwd|aw|sv|wg)\s*(\[\d+\])?\s*:\s*/i, "").replace(/^\[\d+\]\s*/, "");
    if (next === s) break;
    s = next;
  }
  return s.slice(0, 300) || "(no subject)";
}

export function replySubject(subject: string) {
  return /^re\s*:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`;
}

/** Parses `Name <a@b.c>` or `a@b.c`. Returns a lowercase address. */
export function parseAddress(value: string): { name: string | null; email: string } {
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: oneLine(m[1]) || null, email: m[2].trim().toLowerCase() };
  return { name: null, email: value.trim().toLowerCase() };
}

/** Formats a display-name address, quoting the name so commas etc. are safe. */
export function formatAddress(name: string | null | undefined, email: string) {
  const clean = name ? oneLine(name).replace(/["\\]/g, "") : "";
  return clean ? `"${clean}" <${email}>` : email;
}

/** Splits a comma/semicolon/newline-separated list of addresses. */
export function splitAddresses(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Plain text → simple, safe HTML paragraphs. */
export function textToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Wraps message HTML in a minimal, client-safe document. */
export function wrapHtml(inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:0"><div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:640px">${inner}</div></body></html>`;
}

/** Quoted original for replies, in both formats. */
export function quoteOriginal(original: { from: string; date: Date; text: string | null }, dateLabel: string) {
  const header = `On ${dateLabel}, ${original.from} wrote:`;
  const body = (original.text ?? "").trim();
  return {
    text: `\n\n${header}\n${body.split("\n").map((l) => `> ${l}`).join("\n")}`,
    html: `<div style="margin-top:24px;color:#667085;font-size:13px">${escapeHtml(header)}</div><blockquote style="margin:8px 0 0;padding:0 0 0 12px;border-left:3px solid #e6dfd3;color:#667085">${textToHtml(body)}</blockquote>`,
  };
}

/** Best-effort plain text from HTML, for previews and search when a message has no text part. */
export function htmlToText(html: string) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function snippet(text: string | null | undefined, length = 140) {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  return s.length > length ? `${s.slice(0, length - 1)}…` : s;
}

/** Parses a References / In-Reply-To header into message ids. */
export function parseMessageIds(value: string | null | undefined): string[] {
  return (value ?? "").match(/<[^<>\s]+>/g) ?? [];
}
