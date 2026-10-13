import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";

/** Visible breadcrumbs + matching BreadcrumbList structured data. */
export function Breadcrumbs({ crumbs, onInverse }: { crumbs: Crumb[]; onInverse?: boolean }) {
  const all = [{ name: "Home", path: "/" }, ...crumbs];
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm", onInverse ? "text-on-inverse-soft" : "text-ink-soft")}>
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className={cn("font-bold", onInverse ? "text-on-inverse" : "text-heading")}>
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className={onInverse ? "hover:text-on-inverse" : "hover:text-heading"}>
                      {c.name}
                    </Link>
                    <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
