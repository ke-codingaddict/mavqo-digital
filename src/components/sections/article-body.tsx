import { Info } from "lucide-react";
import type { BlogBlock } from "@/content/types";

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className="flex gap-3 rounded-[var(--radius-md)] border-l-4 border-teal bg-teal-wash p-5 text-heading">
          <Info aria-hidden="true" className="mt-1 size-5 shrink-0 text-teal-ink" />
          <p>{block.text}</p>
        </aside>
      );
  }
}

/** An article's body, styled for reading. Shared by blog pages and the admin preview. */
export function ArticleBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="prose-mavqo">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
