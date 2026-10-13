"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders an email's HTML in a sandboxed iframe: scripts, forms and plugins
 * are disabled (no allow-scripts / allow-forms), links open in a new tab, and
 * the page's Content-Security-Policy (inherited by srcdoc) blocks remote
 * images and trackers. allow-same-origin only lets us measure the height —
 * without scripts, nothing inside can use it.
 */
export function MessageBody({ html, text }: { html: string | null; text: string | null }) {
  const [view, setView] = useState<"html" | "text">(html ? "html" : "text");
  const [height, setHeight] = useState(240);
  const ref = useRef<HTMLIFrameElement>(null);

  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (doc) setHeight(Math.min(Math.max(doc.documentElement.scrollHeight, 80), 4000));
  }, []);

  const srcDoc = html
    ? `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;background:#fff}body{padding:16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#1f2937;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}blockquote{margin-left:0}</style></head><body>${html}</body></html>`
    : "";

  return (
    <div>
      {html && text && (
        <div className="mb-3 flex justify-end">
          <div role="group" aria-label="Message format" className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-bold">
            {(["html", "text"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn("rounded-full px-3 py-1", view === v ? "bg-surface text-heading shadow-sm" : "text-ink-soft hover:text-heading")}
              >
                {v === "html" ? "Formatted" : "Plain text"}
              </button>
            ))}
          </div>
        </div>
      )}
      {view === "html" && html ? (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-white">
          <iframe
            ref={ref}
            title="Email content"
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            srcDoc={srcDoc}
            onLoad={() => {
              measure();
              setTimeout(measure, 400);
            }}
            style={{ height }}
            className="block w-full"
          />
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words text-[0.9375rem] leading-relaxed text-heading">{text || <span className="italic text-ink-soft">(no content)</span>}</div>
      )}
    </div>
  );
}
