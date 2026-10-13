import { Plus } from "lucide-react";
import type { FAQ } from "@/content/types";
import { SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

/** Native <details> accordion: accessible and works without JavaScript. */
export function FaqList({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="border-t border-line">
      {faqs.map((f) => (
        <details key={f.question} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left text-lg font-bold text-heading transition-colors hover:text-teal-ink [&::-webkit-details-marker]:hidden">
            {f.question}
            <span aria-hidden="true" className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-heading transition-transform group-open:rotate-45 group-open:bg-teal group-open:text-[#08131f]">
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
          </summary>
          <p className="-mt-2 max-w-3xl pb-6 pr-12 leading-relaxed text-ink">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({ faqs, title = "Questions people ask us", intro }: { faqs: FAQ[]; title?: string; intro?: string }) {
  if (!faqs.length) return null;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-20">
      <div>
        <SectionHeading id="faq-heading" eyebrow="FAQs" title={title} intro={intro ?? "Still have a question? We're happy to talk it through."} />
        <ButtonLink href="/contact/" variant="secondary" className="mt-8">
          Ask us anything
        </ButtonLink>
      </div>
      <FaqList faqs={faqs} />
    </div>
  );
}
