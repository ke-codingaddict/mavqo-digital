import type { BlogBlock } from "@/content/types";

/**
 * The plain-text format admins write articles in — a small, safe subset of
 * Markdown that maps onto the site's article blocks. It never produces HTML,
 * so nothing an author types can inject markup or script.
 *
 *   ## Heading          → section heading
 *   ### Subheading      → sub-heading
 *   - item  /  * item   → bulleted list (one item per line)
 *   1. item             → numbered list
 *   > text              → highlighted callout
 *   anything else       → paragraph (separate paragraphs with a blank line)
 */
export function parseArticle(source: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];
  // The block being built; only one kind is open at a time.
  const open: { para: string[]; list: { type: "ul" | "ol"; items: string[] } | null; callout: string[] } = { para: [], list: null, callout: [] };

  const flush = () => {
    if (open.para.length) blocks.push({ type: "p", text: open.para.join(" ") });
    if (open.list?.items.length) blocks.push(open.list);
    if (open.callout.length) blocks.push({ type: "callout", text: open.callout.join(" ") });
    open.para = [];
    open.list = null;
    open.callout = [];
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2].trim() });
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      const type = bullet ? "ul" : "ol";
      if (open.list?.type !== type) flush();
      open.list ??= { type, items: [] };
      open.list.items.push(item[1].trim());
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      if (!open.callout.length) flush();
      if (quote[1].trim()) open.callout.push(quote[1].trim());
      continue;
    }

    // A plain line continues the current paragraph; it also ends a list or callout.
    if (open.list || open.callout.length) flush();
    open.para.push(line);
  }
  flush();
  return blocks;
}

/** Estimated reading time at ~200 words a minute, never less than one minute. */
export function readingMinutes(source: string): number {
  const words = source.replace(/^[#>\-*•\d.)\s]+/gm, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** URL slug from a title: lower-case ASCII words joined by hyphens. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/, "");
}
