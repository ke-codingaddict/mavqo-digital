import type { ReactNode } from "react";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholders shown while an admin page checks the session and loads its
 * data. Each mirrors the real page's layout so content swaps in without a jump.
 */

const panel = "rounded-[var(--radius-lg)] bg-surface shadow-md";
const card = "rounded-[var(--radius-lg)] border border-line bg-surface shadow-sm";

function repeat(n: number, render: (i: number) => ReactNode) {
  return Array.from({ length: n }, (_, i) => render(i));
}

// ── Building blocks ────────────────────────────────────────────────────────

function BackLink() {
  return <Skeleton className="h-4 w-28" />;
}

function Header({ actions = 0, description = true }: { actions?: number; description?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        {description && <Skeleton className="h-4 w-72 max-w-full" />}
      </div>
      {actions > 0 && <div className="flex gap-2">{repeat(actions, (i) => <Skeleton key={i} className="h-9 w-28" />)}</div>}
    </div>
  );
}

function Stats({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {repeat(count, (i) => (
        <div key={i} className={cn(panel, "space-y-3 p-5")}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function Table({ rows = 8, cols = 5, toolbar = true }: { rows?: number; cols?: number; toolbar?: boolean }) {
  return (
    <div className={panel}>
      {toolbar && (
        <div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">{repeat(5, (i) => <Skeleton key={i} className="h-8 w-20" />)}</div>
          <Skeleton className="h-9 w-full lg:w-80" />
        </div>
      )}
      <div className="flex gap-6 border-b border-line px-4 py-3.5">{repeat(cols, (i) => <Skeleton key={i} className="h-3 flex-1" />)}</div>
      <ul className="divide-y divide-line">
        {repeat(rows, (r) => (
          <li key={r} className="flex items-center gap-6 px-4 py-4">
            {repeat(cols, (c) => (
              <div key={c} className="flex-1 space-y-2">
                <Skeleton className={cn("h-3.5", c === 0 ? "w-4/5" : c % 2 ? "w-3/5" : "w-2/3")} />
                {c === 1 && <Skeleton className="h-3 w-2/5" />}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mirrors the admin `Card`: icon + title header over a body. */
function CardSkeleton({ lines = 3, className, children }: { lines?: number; className?: string; children?: ReactNode }) {
  return (
    <div className={cn(card, className)}>
      <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
        <Skeleton className="size-9 shrink-0 rounded-[var(--radius-md)]" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-64 max-w-full" />
        </div>
      </div>
      <div className="space-y-3 px-5 py-5 sm:px-6">
        {children ?? repeat(lines, (i) => <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />)}
      </div>
    </div>
  );
}

function Fields({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {repeat(count, (i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
        </div>
      ))}
    </div>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────

/** The admin chrome (top bar) around a page placeholder, for full page loads. */
export function AdminShellSkeleton() {
  return (
    <div className="min-h-dvh bg-surface-2">
      <div className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <Skeleton className="size-8 rounded-[10px]" />
            <Skeleton className="hidden h-5 w-28 sm:block" />
            <div className="hidden gap-2 md:flex">{repeat(5, (i) => <Skeleton key={i} className="h-8 w-20" />)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-8 w-36 lg:block" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
        <AdminPageSkeleton />
      </div>
    </div>
  );
}

/** Generic page: header and a content panel. */
export function AdminPageSkeleton() {
  return (
    <SkeletonRegion className="space-y-8">
      <Header actions={1} />
      <Table toolbar={false} rows={6} />
    </SkeletonRegion>
  );
}

// ── Pages ──────────────────────────────────────────────────────────────────

export function LeadsSkeleton() {
  return (
    <SkeletonRegion label="Loading leads" className="space-y-8">
      <Header actions={1} />
      <Stats />
      <Table cols={6} rows={10} />
    </SkeletonRegion>
  );
}

export function LeadDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading lead" className="space-y-6">
      <BackLink />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">{repeat(3, (i) => <Skeleton key={i} className="h-9 w-24" />)}</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className={cn(panel, "p-6")}>
          <Skeleton className="h-5 w-40" />
          <div className="mt-2 divide-y divide-line">
            {repeat(8, (i) => (
              <div key={i} className="grid gap-2 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className={cn("h-3.5", i % 3 === 2 ? "w-full" : "w-1/2")} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {repeat(2, (i) => (
            <div key={i} className={cn(panel, "space-y-4 p-6")}>
              <Skeleton className="h-5 w-32" />
              <Fields count={2} />
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Compose button, folders and the setup status box. */
export function MailSidebarSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      <Skeleton className="h-11 w-full" />
      <div className="flex gap-1 lg:flex-col">
        {repeat(3, (i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="hidden h-16 w-full rounded-[var(--radius-md)] lg:block" />
    </div>
  );
}

function MailLayout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SkeletonRegion label={label} className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <MailSidebarSkeleton />
      <div className="min-w-0 space-y-4">{children}</div>
    </SkeletonRegion>
  );
}

export function MailListSkeleton() {
  return (
    <MailLayout label="Loading mail">
      <div className={cn(card, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-full sm:w-72" />
        </div>
        <ul className="divide-y divide-line">
          {repeat(8, (i) => (
            <li key={i} className="flex gap-3 px-4 py-3.5">
              <Skeleton className="size-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex justify-between gap-3">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MailLayout>
  );
}

export function MailThreadSkeleton() {
  return (
    <MailLayout label="Loading conversation">
      <div className={cn(card, "flex items-start justify-between gap-4 px-5 py-4")}>
        <div className="space-y-2">
          <Skeleton className="h-6 w-72 max-w-full" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-9 w-24 shrink-0" />
      </div>
      {repeat(2, (i) => (
        <div key={i} className={cn(card, "space-y-4 p-5")}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="space-y-2.5">
            {repeat(4, (j) => <Skeleton key={j} className={cn("h-3.5", j === 3 ? "w-1/2" : "w-full")} />)}
          </div>
        </div>
      ))}
      <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
    </MailLayout>
  );
}

export function MailComposeSkeleton() {
  return (
    <MailLayout label="Loading composer">
      <div className={cn(card, "space-y-5 p-5 sm:p-6")}>
        <Skeleton className="h-6 w-40" />
        <Fields count={2} />
        <Skeleton className="h-64 w-full rounded-[var(--radius-md)]" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </MailLayout>
  );
}

export function AdsOverviewSkeleton() {
  return (
    <SkeletonRegion label="Loading Google Ads" className="space-y-8">
      <Header actions={2} />
      <CardSkeleton>
        <Stats className="[&>div]:shadow-none [&>div]:ring-1 [&>div]:ring-line" />
      </CardSkeleton>
      <Table toolbar={false} cols={6} rows={5} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton>
          <Fields count={2} />
        </CardSkeleton>
        <CardSkeleton lines={4} />
      </div>
    </SkeletonRegion>
  );
}

function Chart({ className }: { className?: string }) {
  return (
    <div className={cn(card, "space-y-4 p-5 sm:p-6", className)}>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-56 w-full rounded-[var(--radius-md)]" />
    </div>
  );
}

export function AdsAccountSkeleton() {
  return (
    <SkeletonRegion label="Loading account" className="space-y-6">
      <BackLink />
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] sm:w-24" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        </div>
        <div className="flex gap-2">{repeat(3, (i) => <Skeleton key={i} className="h-9 w-24" />)}</div>
      </div>
      <div className="flex flex-wrap gap-2">{repeat(5, (i) => <Skeleton key={i} className="h-8 w-24" />)}</div>
      <Stats count={8} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Chart className="xl:col-span-2" />
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Chart />
        <Chart />
      </div>
    </SkeletonRegion>
  );
}

/** The printable report: toolbar, letterhead and title block on white paper. */
export function AdsReportSkeleton() {
  return (
    <SkeletonRegion label="Loading report" className="mx-auto max-w-[56rem] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="paper overflow-hidden rounded-[var(--radius-md)] bg-white shadow-lg">
        <div className="h-[4.75rem] bg-navy" />
        <div className="h-1 bg-teal" />
        <div className="space-y-10 px-8 py-10 sm:px-12">
          <div className="flex justify-between gap-8">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="hidden h-20 w-40 rounded-[var(--radius-md)] sm:block" />
          </div>
          <div className="grid grid-cols-2 gap-6 border-y border-line py-5 sm:grid-cols-4">
            {repeat(4, (i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            {repeat(3, (i) => <Skeleton key={i} className={cn("h-4", i === 2 ? "w-2/3" : "w-full")} />)}
          </div>
          <Skeleton className="h-56 w-full rounded-[var(--radius-md)]" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function BlogListSkeleton() {
  return (
    <SkeletonRegion label="Loading articles" className="space-y-8">
      <Header actions={1} />
      <Table toolbar={false} cols={5} rows={8} />
    </SkeletonRegion>
  );
}

/** Article editor: writing area beside the publish/cover sidebar. */
export function BlogEditorSkeleton() {
  return (
    <SkeletonRegion label="Loading editor" className="space-y-6">
      <BackLink />
      <Header actions={1} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={cn(card, "space-y-5 p-5 sm:p-6")}>
          <Fields count={3} />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-96 w-full rounded-[var(--radius-md)]" />
        </div>
        <div className="space-y-6">
          <CardSkeleton>
            <Fields count={1} />
            <Skeleton className="h-10 w-full" />
          </CardSkeleton>
          <CardSkeleton>
            <Skeleton className="aspect-[16/9] w-full rounded-[var(--radius-md)]" />
          </CardSkeleton>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function SettingsSkeleton() {
  return (
    <SkeletonRegion label="Loading settings" className="mx-auto max-w-5xl space-y-6">
      <Header />
      <div className="flex gap-1 border-b border-line">
        {repeat(3, (i) => (
          <div key={i} className="px-4 py-3.5">
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <CardSkeleton>
        <div className="grid gap-3 sm:grid-cols-4">{repeat(4, (i) => <Skeleton key={i} className="h-16 rounded-[var(--radius-md)]" />)}</div>
      </CardSkeleton>
      <CardSkeleton>
        <Fields count={3} />
      </CardSkeleton>
    </SkeletonRegion>
  );
}

export function AccountSkeleton() {
  return (
    <SkeletonRegion label="Loading account" className="mx-auto max-w-5xl space-y-6">
      <Header />
      <div className="grid gap-4 sm:grid-cols-3">
        {repeat(3, (i) => (
          <div key={i} className={cn(card, "space-y-2.5 px-5 py-4")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <CardSkeleton>
          <Fields count={3} />
        </CardSkeleton>
        <CardSkeleton lines={4} />
      </div>
      <CardSkeleton>
        <Skeleton className="h-40 w-full rounded-[var(--radius-md)]" />
      </CardSkeleton>
    </SkeletonRegion>
  );
}
