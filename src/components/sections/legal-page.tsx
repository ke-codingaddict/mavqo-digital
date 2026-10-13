import type { ReactNode } from "react";
import type { Crumb } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "./breadcrumbs";

export function LegalPage({ title, updated, crumbs, children }: { title: string; updated: string; crumbs: Crumb[]; children: ReactNode }) {
  return (
    <article>
      <header className="border-b border-line bg-surface-2">
        <Container className="max-w-3xl py-12">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="text-h1 mt-6">{title}</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Last updated: <time dateTime={updated}>{formatDate(updated, { dateStyle: "long" })}</time>
          </p>
        </Container>
      </header>
      <Container className="prose-mavqo max-w-3xl py-12">{children}</Container>
    </article>
  );
}
