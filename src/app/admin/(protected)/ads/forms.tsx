"use client";

import { useActionState, useState } from "react";
import { ImageUp, Printer, RefreshCw, Search } from "lucide-react";
import { Field, FormMessage, SubmitButton, Switch } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { LOGO_ACCEPT } from "@/lib/google-ads/logo";
import { ClientLogo } from "@/components/admin/ads/client-logo";
import {
  createAccount,
  deleteAccount,
  findAccounts,
  importAccounts,
  syncEverything,
  syncNow,
  updateAccount,
  updateLogo,
  type FormState,
  type ImportState,
} from "./actions";

const idle: FormState = { status: "idle" };

export function AddAccountForm() {
  const [state, action] = useActionState(createAccount, idle);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <Field name="name" label="Client name" placeholder="Acme Hardware Ltd" required error={e.name} />
      <Field
        name="customerId"
        label="Google Ads customer ID"
        placeholder="123-456-7890"
        inputMode="numeric"
        autoComplete="off"
        required
        error={e.customerId}
        hint="Top right of the client's Google Ads account."
      />
      <Field
        name="monthlyBudget"
        label="Agreed monthly budget"
        optional
        inputMode="decimal"
        placeholder="50,000"
        error={e.monthlyBudget}
        hint="In the account's currency. Used to track pacing."
      />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Adding & syncing…">Add & sync</SubmitButton>
      </div>
    </form>
  );
}

const importIdle: ImportState = { status: "idle" };

export function ImportAccounts() {
  const [found, find] = useActionState(findAccounts, importIdle);
  const [imported, doImport] = useActionState(importAccounts, importIdle);
  const accounts = found.accounts ?? [];
  const available = accounts.filter((a) => !a.added);
  return (
    <div className="space-y-4">
      <FormMessage state={imported.status !== "idle" ? imported : found} />
      {!accounts.length ? (
        <form action={find}>
          <SubmitButton variant="secondary" pendingLabel="Looking…">
            <Search aria-hidden="true" className="size-4" /> Find accounts
          </SubmitButton>
        </form>
      ) : (
        <form action={doImport} className="space-y-3">
          <fieldset>
            <legend className="sr-only">Accounts to import</legend>
            <ul className="max-h-72 divide-y divide-line overflow-auto rounded-[var(--radius-md)] border border-line">
              {accounts.map((a) => (
                <li key={a.customerId}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm has-[:disabled]:cursor-default has-[:disabled]:opacity-60">
                    <input type="checkbox" name="account" value={`${a.customerId}|${a.name}`} disabled={a.added} defaultChecked={!a.added} className="size-4 accent-teal" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-heading">{a.name}</span>
                      <span className="font-mono text-xs text-ink-soft">
                        {formatCustomerId(a.customerId)}
                        {a.currencyCode && ` · ${a.currencyCode}`}
                      </span>
                    </span>
                    {a.added && <span className="text-xs font-bold text-ink-soft">Added</span>}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="flex justify-end">
            <SubmitButton disabled={!available.length} pendingLabel="Importing & syncing…">
              Import selected
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

export function SyncButton({ accountId, full, label = "Sync now" }: { accountId: string; full?: boolean; label?: string }) {
  const [state, action] = useActionState(syncNow, idle);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="accountId" value={accountId} />
      {full && <input type="hidden" name="full" value="1" />}
      <SubmitButton variant="secondary" pendingLabel="Syncing…">
        <RefreshCw aria-hidden="true" className="size-4" /> {label}
      </SubmitButton>
      {state.status === "error" && <FormMessage state={state} />}
    </form>
  );
}

export function SyncAllButton() {
  const [state, action] = useActionState(syncEverything, idle);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <SubmitButton variant="secondary" pendingLabel="Syncing all…">
        <RefreshCw aria-hidden="true" className="size-4" /> Sync all
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function AccountSettingsForm({ account }: { account: { id: string; name: string; monthlyBudget: number | null; active: boolean } }) {
  const [state, action] = useActionState(updateAccount, idle);
  const [delState, del] = useActionState(deleteAccount, idle);
  const [confirming, setConfirming] = useState(false);
  const e = state.errors ?? {};
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <FormMessage state={state} />
        <input type="hidden" name="accountId" value={account.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Client name" defaultValue={account.name} required error={e.name} />
          <Field
            name="monthlyBudget"
            label="Agreed monthly budget"
            optional
            inputMode="decimal"
            defaultValue={account.monthlyBudget ?? ""}
            error={e.monthlyBudget}
            hint="Shows budget pacing and over/under-spend alerts."
          />
        </div>
        <Switch name="active" defaultChecked={account.active} label="Include in daily sync" description="Turn off for clients you no longer manage; their history stays." />
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </div>
      </form>

      <div className="border-t border-line pt-5">
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="text-sm font-bold text-danger hover:underline">
            Remove this account…
          </button>
        ) : (
          <form action={del} className="space-y-3 rounded-[var(--radius-md)] bg-danger-wash p-4">
            <FormMessage state={delState} />
            <input type="hidden" name="accountId" value={account.id} />
            <label className="flex items-start gap-2 text-sm text-danger">
              <input type="checkbox" name="confirm" className="mt-1 size-4 accent-current" required />
              Delete {account.name} and all its synced report data from Mavqo. Nothing changes in Google Ads.
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="h-9 px-3 text-sm font-bold text-ink-soft hover:text-heading">
                Cancel
              </button>
              <SubmitButton variant="primary" className="bg-danger hover:bg-danger" pendingLabel="Removing…">
                Remove account
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function LogoForm({ account }: { account: { id: string; name: string; logoSrc: string | null } }) {
  const [state, action] = useActionState(updateLogo, idle);
  // A picked file previews until the upload finishes (i.e. until the form state changes).
  const [picked, setPicked] = useState<{ url: string; for: FormState } | null>(null);
  const preview = picked?.for === state ? picked.url : null;
  const shown = preview ?? account.logoSrc;
  return (
    <div className="space-y-3">
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <ClientLogo name={account.name} src={shown} className="h-16 w-32 text-xl" />
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="accountId" value={account.id} />
          <label className={buttonClasses("secondary", "sm", "cursor-pointer")}>
            <ImageUp aria-hidden="true" className="size-4" /> {account.logoSrc ? "Replace logo" : "Choose logo"}
            <input
              type="file"
              name="logo"
              accept={LOGO_ACCEPT}
              required
              className="sr-only"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                setPicked(f ? { url: URL.createObjectURL(f), for: state } : null);
              }}
            />
          </label>
          {preview && <SubmitButton pendingLabel="Uploading…">Save logo</SubmitButton>}
        </form>
        {account.logoSrc && !preview && (
          <form action={action}>
            <input type="hidden" name="accountId" value={account.id} />
            <input type="hidden" name="remove" value="1" />
            <button type="submit" className="text-sm font-bold text-ink-soft hover:text-danger">
              Remove
            </button>
          </form>
        )}
      </div>
      <p className="text-xs text-ink-soft">PNG, JPEG or WebP up to 512 KB. A wide logo on a transparent or white background prints best. Shown on the dashboard and the client report.</p>
    </div>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses("primary", "sm")}>
      <Printer aria-hidden="true" className="size-4" /> Print / save as PDF
    </button>
  );
}
