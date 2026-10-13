import { cn } from "@/lib/utils";

/** Numbered steps joined by a line — reads as a journey rather than a grid of boxes. */
export function ProcessSteps({ steps, className, inverse }: { steps: { title: string; description: string }[]; className?: string; inverse?: boolean }) {
  return (
    <ol className={cn("relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="relative">
          {i < steps.length - 1 && (
            <span aria-hidden="true" className={cn("absolute left-13 -right-6 top-5 hidden h-px lg:block", inverse ? "bg-white/20" : "bg-line-strong")} />
          )}
          <span
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-full text-sm font-black ring-4",
              inverse ? "bg-teal text-[#08131f] ring-inverse" : "bg-primary text-on-primary ring-canvas",
            )}
          >
            {i + 1}
          </span>
          <h3 className={cn("text-h3 mt-5", inverse && "!text-on-inverse")}>{step.title}</h3>
          <p className={cn("mt-2 leading-relaxed", inverse ? "text-on-inverse-soft" : "text-ink-soft")}>{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
