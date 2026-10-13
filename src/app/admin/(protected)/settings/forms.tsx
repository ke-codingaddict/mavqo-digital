"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { Field, FormMessage, SubmitButton, Switch, inputClass, useOnStateChange } from "@/components/admin/ui";
import { SignatureEditor } from "@/components/admin/signature-editor";
import type { Signature } from "@/lib/mail/signature";
import { cn } from "@/lib/utils";
import {
  checkDomain,
  connectGoogleAds,
  connectInbox,
  saveAnalytics,
  saveApiKey,
  saveGoogleAdsApp,
  saveMailPreferences,
  sendTestEmail,
  type FormState,
} from "./actions";

const idle: FormState = { status: "idle" };

/** Password confirmation for sensitive changes. */
function ConfirmPassword({ error }: { error?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface-2/60 p-4">
      <Field
        name="password"
        type="password"
        label="Confirm with your password"
        autoComplete="current-password"
        required
        error={error}
        hint={
          <span className="inline-flex items-center gap-1">
            <Lock aria-hidden="true" className="size-3" /> Required for changes to keys and connections.
          </span>
        }
      />
    </div>
  );
}

export function ApiKeyForm({ masked }: { masked: string | null }) {
  const [state, action] = useActionState(saveApiKey, idle);
  const [editing, setEditing] = useState(!masked);
  const ref = useRef<HTMLFormElement>(null);
  useOnStateChange(state, (s) => s.status === "success" && setEditing(false));
  useEffect(() => {
    if (state.status === "success") ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <FormMessage state={state} />
      {masked && !editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden="true" className="size-5 text-success" />
            <div>
              <p className="font-mono text-sm font-bold text-heading">{masked}</p>
              <p className="text-xs text-ink-soft">Encrypted at rest · never shown in full</p>
            </div>
          </div>
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-bold text-teal-ink hover:underline">
            Replace or remove
          </button>
        </div>
      ) : (
        <>
          <Field
            name="apiKey"
            label="Resend API key"
            placeholder="re_…"
            autoComplete="off"
            spellCheck={false}
            className="[&_input]:font-mono"
            error={state.errors?.apiKey}
            hint={
              <>
                Create one at{" "}
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="font-bold text-teal-ink underline">
                  resend.com/api-keys
                </a>{" "}
                with <strong>Full access</strong> — it&apos;s checked with Resend before it&apos;s saved.
              </>
            }
          />
          <ConfirmPassword error={state.errors?.password} />
          <div className="flex flex-wrap justify-end gap-2">
            {masked && (
              <>
                <button type="button" onClick={() => setEditing(false)} className="h-9 px-3 text-sm font-bold text-ink-soft hover:text-heading">
                  Cancel
                </button>
                <SubmitButton name="intent" value="remove" variant="ghost" className="text-danger" formNoValidate pendingLabel="Removing…">
                  Remove key
                </SubmitButton>
              </>
            )}
            <SubmitButton name="intent" value="save" pendingLabel="Verifying…">
              Verify &amp; save
            </SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

export function MailPreferencesForm({
  initial,
}: {
  initial: { fromName: string; fromAddress: string; replyTo: string; notificationEmails: string; autoReply: boolean; teamSignature: Signature };
}) {
  const [state, action] = useActionState(saveMailPreferences, idle);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="fromName" label="Sender name" defaultValue={initial.fromName} placeholder="Mavqo Digital" required error={e.fromName} />
        <Field
          name="fromAddress"
          label="Sender address"
          type="email"
          defaultValue={initial.fromAddress}
          placeholder="hello@yourdomain.co.ke"
          required
          error={e.fromAddress}
          hint="Must be on a domain verified in Resend."
        />
        <Field
          name="replyTo"
          label="Inbox address (reply-to)"
          type="email"
          optional
          defaultValue={initial.replyTo}
          placeholder="inbox@xxxx.resend.app"
          error={e.replyTo}
          hint="Where customers' replies go. Use your Resend receiving address so replies land in Mail."
        />
        <Field
          name="notificationEmails"
          label="New-lead alerts go to"
          defaultValue={initial.notificationEmails}
          placeholder="sales@company.co.ke, owner@company.co.ke"
          required
          error={e.notificationEmails}
          hint="Comma-separated, up to 10."
        />
      </div>
      <div className="rounded-[var(--radius-md)] border border-line p-4">
        <Switch
          name="autoReply"
          defaultChecked={initial.autoReply}
          label="Send customers a confirmation email"
          description="Confirms receipt with their reference number. Their reply lands in Mail, linked to the lead."
        />
      </div>
      <div>
        <h3 className="text-sm font-bold text-heading">Team signature</h3>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">Used on automatic emails such as confirmations. Each person sets their own for messages they send.</p>
        <SignatureEditor initial={initial.teamSignature} prefix="sig_" errors={Object.fromEntries(Object.entries(e).filter(([k]) => ["closing", "name", "title", "company", "phone", "email", "website"].includes(k)))} />
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save email settings</SubmitButton>
      </div>
    </form>
  );
}

export function DomainActions({ canVerify }: { canVerify: boolean }) {
  const [state, action] = useActionState(checkDomain, idle);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="refresh" variant="secondary" pendingLabel="Checking…">
          <RefreshCw aria-hidden="true" className="size-4" /> Refresh status
        </SubmitButton>
        {canVerify && (
          <SubmitButton name="intent" value="verify" pendingLabel="Verifying…">
            <ShieldCheck aria-hidden="true" className="size-4" /> Verify DNS now
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

export function InboxForm({ connected, canConnect }: { connected: boolean; canConnect: boolean }) {
  const [state, action] = useActionState(connectInbox, idle);
  const [open, setOpen] = useState(false);
  useOnStateChange(state, (s) => s.status === "success" && setOpen(false));
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {open ? (
        <>
          <ConfirmPassword error={state.errors?.password} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 text-sm font-bold text-ink-soft hover:text-heading">
              Cancel
            </button>
            {connected ? (
              <SubmitButton name="intent" value="disconnect" variant="secondary" className="text-danger" pendingLabel="Disconnecting…">
                Disconnect inbox
              </SubmitButton>
            ) : (
              <SubmitButton name="intent" value="connect" pendingLabel="Connecting…">
                Connect inbox
              </SubmitButton>
            )}
          </div>
        </>
      ) : (
        <div className="flex justify-end gap-2">
          {connected && (
            <button type="button" onClick={() => setOpen(true)} className="h-9 px-3 text-sm font-bold text-danger hover:underline">
              Disconnect
            </button>
          )}
          <button
            type="button"
            disabled={!canConnect}
            onClick={() => setOpen(true)}
            className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-bold", canConnect ? "bg-primary text-on-primary hover:bg-primary-hover" : "cursor-not-allowed bg-surface-2 text-ink-soft")}
          >
            {connected ? "Reconnect" : "Connect inbox"}
          </button>
        </div>
      )}
    </form>
  );
}

export function TestEmailForm({ defaultTo, disabled }: { defaultTo: string; disabled: boolean }) {
  const [state, action] = useActionState(sendTestEmail, idle);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="test-to" className="sr-only">Send test to</label>
        <input id="test-to" name="to" type="email" defaultValue={defaultTo} required className={cn(inputClass, "sm:flex-1")} />
        <SubmitButton disabled={disabled} pendingLabel="Sending…">Send test email</SubmitButton>
      </div>
    </form>
  );
}

export function AnalyticsForm({ initial }: { initial: { gaMeasurementId: string; googleAdsId: string; searchConsoleToken: string } }) {
  const [state, action] = useActionState(saveAnalytics, idle);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-5">
      <FormMessage state={state} />
      <Field
        name="gaMeasurementId"
        label="Google Analytics 4 measurement ID"
        optional
        placeholder="G-XXXXXXXXXX"
        defaultValue={initial.gaMeasurementId}
        className="[&_input]:font-mono"
        error={e.gaMeasurementId}
        hint="GA4 → Admin → Data streams → your web stream. Tags load only after a visitor accepts cookies."
      />
      <Field
        name="googleAdsId"
        label="Google Ads conversion ID"
        optional
        placeholder="AW-123456789"
        defaultValue={initial.googleAdsId}
        className="[&_input]:font-mono"
        error={e.googleAdsId}
        hint="Google Ads → Goals → Conversions → Tag setup."
      />
      <Field
        name="searchConsoleToken"
        label="Google Search Console verification"
        optional
        placeholder={'<meta name="google-site-verification" content="…" />'}
        defaultValue={initial.searchConsoleToken}
        className="[&_input]:font-mono"
        error={e.searchConsoleToken}
        hint="Search Console → Add property → URL prefix → HTML tag. Paste the tag or just its content value, save, then click Verify in Search Console."
      />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save &amp; publish</SubmitButton>
      </div>
    </form>
  );
}

/* ---------------- Google Ads ---------------- */

export function GoogleAdsAppForm({
  initial,
}: {
  initial: { clientId: string; loginCustomerId: string; maskedDeveloperToken: string | null; maskedClientSecret: string | null };
}) {
  const [state, action] = useActionState(saveGoogleAdsApp, idle);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") ref.current?.querySelectorAll<HTMLInputElement>("input[type=password]").forEach((i) => (i.value = ""));
  }, [state]);
  const e = state.errors ?? {};
  const keep = (masked: string | null) => (masked ? <>Saved ({masked}). Leave blank to keep it.</> : undefined);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="developerToken"
          type="password"
          label="Developer token"
          autoComplete="off"
          spellCheck={false}
          className="[&_input]:font-mono"
          placeholder={initial.maskedDeveloperToken ? "••••••••" : "From the manager account's API Center"}
          error={e.developerToken}
          hint={keep(initial.maskedDeveloperToken) ?? "Google Ads manager account → Admin → API Center."}
        />
        <Field
          name="loginCustomerId"
          label="Manager account ID"
          optional
          inputMode="numeric"
          defaultValue={initial.loginCustomerId}
          placeholder="123-456-7890"
          error={e.loginCustomerId}
          hint="Your MCC. Set it to reach every client account linked under it."
        />
        <Field
          name="clientId"
          label="OAuth client ID"
          defaultValue={initial.clientId}
          autoComplete="off"
          spellCheck={false}
          className="[&_input]:font-mono"
          placeholder="…apps.googleusercontent.com"
          required
          error={e.clientId}
        />
        <Field
          name="clientSecret"
          type="password"
          label="OAuth client secret"
          autoComplete="off"
          spellCheck={false}
          className="[&_input]:font-mono"
          placeholder={initial.maskedClientSecret ? "••••••••" : "GOCSPX-…"}
          error={e.clientSecret}
          hint={keep(initial.maskedClientSecret)}
        />
      </div>
      <ConfirmPassword error={e.password} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save API details</SubmitButton>
      </div>
    </form>
  );
}

export function GoogleAdsConnectForm({ connected, canConnect }: { connected: boolean; canConnect: boolean }) {
  const [state, action] = useActionState(connectGoogleAds, idle);
  const [intent, setIntent] = useState<"connect" | "disconnect" | null>(null);
  useOnStateChange(state, (s) => s.status === "success" && setIntent(null));
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {intent ? (
        <>
          <ConfirmPassword error={state.errors?.password} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIntent(null)} className="h-9 px-3 text-sm font-bold text-ink-soft hover:text-heading">
              Cancel
            </button>
            {intent === "disconnect" ? (
              <SubmitButton name="intent" value="disconnect" variant="secondary" className="text-danger" pendingLabel="Disconnecting…">
                Disconnect Google Ads
              </SubmitButton>
            ) : (
              <SubmitButton name="intent" value="connect" pendingLabel="Opening Google…">
                Continue to Google
              </SubmitButton>
            )}
          </div>
        </>
      ) : (
        <div className="flex justify-end gap-2">
          {connected && (
            <button type="button" onClick={() => setIntent("disconnect")} className="h-9 px-3 text-sm font-bold text-danger hover:underline">
              Disconnect
            </button>
          )}
          <button
            type="button"
            disabled={!canConnect}
            onClick={() => setIntent("connect")}
            className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-bold", canConnect ? "bg-primary text-on-primary hover:bg-primary-hover" : "cursor-not-allowed bg-surface-2 text-ink-soft")}
          >
            {connected ? "Reconnect Google account" : "Connect Google account"}
          </button>
        </div>
      )}
    </form>
  );
}
