import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChartColumn, CircleAlert, CircleCheck, Globe, Inbox, KeyRound, Link2, Mail, Megaphone, Send } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getAnalyticsSettings, getMailConfig, getSavedAnalytics } from "@/lib/settings";
import { maskSecret } from "@/lib/security/crypto";
import { getDomain, type Domain } from "@/lib/mail/resend";
import { formatDate, cn } from "@/lib/utils";
import { AdminPageFallback } from "@/components/admin/page-fallback";
import { Card, CopyButton, PageHeader, StatusPill } from "@/components/admin/ui";
import { AnalyticsForm, ApiKeyForm, DomainActions, GoogleAdsAppForm, GoogleAdsConnectForm, InboxForm, MailPreferencesForm, TestEmailForm } from "./forms";
import { getGoogleAdsConfig, oauthRedirectUri } from "@/lib/google-ads/config";
import { formatCustomerId } from "@/lib/google-ads/customer-id";
import { GOOGLE_ADS_CONNECT_ERRORS } from "@/lib/settings/schema";

export const metadata: Metadata = { title: "Settings" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

const tabs = [
  { key: "email", label: "Email", icon: Mail },
  { key: "analytics", label: "Analytics & SEO", icon: ChartColumn },
  { key: "google-ads", label: "Google Ads", icon: Megaphone },
] as const;

async function Settings({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("settings:manage");
  const params = await searchParams;
  const tabParam = params.tab;
  const tab = tabs.find((t) => t.key === tabParam)?.key ?? "email";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Settings" description="Connect email, verify your domain and manage the tracking IDs used across the website." />
      <nav aria-label="Settings sections" className="flex gap-1 border-b border-line">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin/settings/?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
              tab === key ? "border-teal text-heading" : "border-transparent text-ink-soft hover:text-heading",
            )}
          >
            <Icon aria-hidden="true" className="size-4" /> {label}
          </Link>
        ))}
      </nav>
      {tab === "email" ? (
        <EmailSettings userEmail={user.email} />
      ) : tab === "analytics" ? (
        <AnalyticsSettings />
      ) : (
        <GoogleAdsSettings connected={params.connected === "1"} error={typeof params.error === "string" ? params.error : undefined} />
      )}
    </div>
  );
}

/* ---------------------------------- Email ---------------------------------- */

function domainTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "verified") return "success";
  if (status === "failed" || status === "temporary_failure") return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

async function EmailSettings({ userEmail }: { userEmail: string }) {
  const config = await getMailConfig();
  const saved = config.saved;
  const fromDomain = config.fromAddress?.split("@")[1] ?? null;

  let domain: Domain | null = null;
  let domainError: string | null = null;
  if (config.apiKey && saved?.domainId) {
    const res = await getDomain(config.apiKey, saved.domainId);
    if (res.ok) domain = res.data;
    else domainError = res.message;
  }
  const lastInbound = await db().mailMessage.findFirst({ where: { direction: "inbound" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  const baseUrl = getServerEnv().APP_BASE_URL.replace(/\/$/, "");
  const inboxConnected = Boolean(saved?.webhookId && config.webhookSecret);

  const steps: { label: string; done: boolean; detail: string }[] = [
    { label: "API key", done: Boolean(config.apiKey), detail: config.apiKey ? "Connected" : "Not added" },
    { label: "Sender", done: Boolean(config.fromAddress && config.notificationEmails.length), detail: config.fromAddress ?? "Not set" },
    { label: "Domain", done: domain?.status === "verified", detail: domain ? statusLabel(domain.status) : fromDomain ? "Not checked" : "—" },
    { label: "Inbox", done: inboxConnected, detail: inboxConnected ? "Receiving" : "Not connected" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {config.secretsUnreadable && (
        <p role="alert" className="flex gap-2 rounded-[var(--radius-md)] bg-danger-wash p-4 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
          Saved keys can&apos;t be decrypted — SETTINGS_ENCRYPTION_KEY has changed. Re-enter the API key and reconnect the inbox.
        </p>
      )}
      {config.source === "env" && (
        <p className="rounded-[var(--radius-md)] bg-warning-wash p-4 text-sm font-medium text-warning">
          Email currently uses server environment variables. Saving settings here takes over from them.
        </p>
      )}

      <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-bold text-heading">Email setup</h2>
          <span className="text-sm font-bold text-ink-soft">{doneCount} of {steps.length} complete</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-start gap-2.5">
              {s.done ? (
                <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <span aria-hidden="true" className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-line-strong text-[0.625rem] font-black text-ink-soft">{i + 1}</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-heading">{s.label}<span className="sr-only">{s.done ? " (done)" : " (to do)"}</span></p>
                <p className="truncate text-xs text-ink-soft">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Card
        id="connection"
        title="Resend connection"
        description="Sends and receives email for the website and Mail."
        icon={<KeyRound />}
        aside={config.apiKey ? <StatusPill tone="success">Connected</StatusPill> : <StatusPill tone="neutral">Not connected</StatusPill>}
      >
        <ApiKeyForm masked={config.apiKey && config.source === "admin" ? maskSecret(config.apiKey) : null} />
      </Card>

      <Card id="sender" title="Sender & notifications" description="Who emails come from, where replies go, and who hears about new leads." icon={<Send />}>
        <MailPreferencesForm
          initial={{
            fromName: config.fromName,
            fromAddress: config.fromAddress ?? "",
            replyTo: config.replyTo ?? "",
            notificationEmails: config.notificationEmails.join(", "),
            autoReply: config.autoReply,
            teamSignature: config.teamSignature,
          }}
        />
      </Card>

      <Card
        id="domain"
        title="Domain verification"
        description={fromDomain ? <>SPF and DKIM records prove emails from <strong>{fromDomain}</strong> are genuine, so they reach the inbox, not spam.</> : "Save a sender address to check its domain."}
        icon={<Globe />}
        aside={domain ? <StatusPill tone={domainTone(domain.status)}>{statusLabel(domain.status)}</StatusPill> : undefined}
      >
        {!config.apiKey ? (
          <p className="text-sm text-ink-soft">Add your Resend API key first.</p>
        ) : !fromDomain ? (
          <p className="text-sm text-ink-soft">Save a sender address above.</p>
        ) : (
          <div className="space-y-5">
            {domainError && <p className="text-sm font-medium text-danger">{domainError}</p>}
            {domain?.records?.length ? (
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th scope="col" className="px-3 py-2.5 font-bold">Purpose</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Type</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Name</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Value</th>
                      <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {domain.records.map((r, i) => (
                      <tr key={`${r.record}-${r.name}-${i}`} className="align-top">
                        <td className="px-3 py-2.5 font-bold text-heading">{r.record}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{r.type}{r.priority !== undefined ? ` · ${r.priority}` : ""}</td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-start gap-1 font-mono text-xs break-all">{r.name}<CopyButton value={r.name} label="Copy name" /></span>
                        </td>
                        <td className="max-w-[18rem] px-3 py-2.5">
                          <span className="flex items-start gap-1 font-mono text-xs break-all">
                            <span className="line-clamp-3">{r.value}</span>
                            <CopyButton value={r.value} label="Copy value" />
                          </span>
                        </td>
                        <td className="px-3 py-2.5"><StatusPill tone={domainTone(r.status)}>{statusLabel(r.status)}</StatusPill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">Check {fromDomain} to see the DNS records it needs and whether they&apos;re in place.</p>
            )}
            {domain && domain.status !== "verified" && (
              <p className="text-sm text-ink">
                Add the records above at your DNS provider (where you bought the domain), then click <strong>Verify DNS now</strong>.
              </p>
            )}
            <DomainActions canVerify={Boolean(domain && domain.status !== "verified")} />
          </div>
        )}
      </Card>

      <Card
        id="inbox"
        title="Inbox (receiving)"
        description="Brings customer emails and replies into Mail."
        icon={<Inbox />}
        aside={inboxConnected ? <StatusPill tone="success">Receiving</StatusPill> : <StatusPill tone="neutral">Not connected</StatusPill>}
      >
        <div className="space-y-4 text-sm text-ink">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              In Resend → <strong>Emails → Receiving</strong>, copy your receiving address (e.g. <code className="rounded bg-surface-2 px-1">inbox@xxxx.resend.app</code>), or add an MX record so your own domain receives mail.
            </li>
            <li>Enter that address as <strong>Inbox address (reply-to)</strong> above, so customers&apos; replies come here.</li>
            <li>Connect below — this registers a signed webhook with Resend for you.</li>
          </ol>
          {inboxConnected && (
            <dl className="grid gap-3 rounded-[var(--radius-md)] bg-surface-2/60 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Webhook</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-mono text-xs break-all">{saved?.webhookEndpoint}<CopyButton value={saved?.webhookEndpoint ?? ""} /></dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Last email received</dt>
                <dd className="mt-0.5 font-bold text-heading">{lastInbound ? formatDate(lastInbound.createdAt, { dateStyle: "medium", timeStyle: "short" }) : "None yet — send a test to your inbox address"}</dd>
              </div>
            </dl>
          )}
          {!baseUrl.startsWith("https://") && <p className="text-warning">The inbox can be connected only on the deployed (https) site.</p>}
          <InboxForm connected={inboxConnected} canConnect={Boolean(config.apiKey) && baseUrl.startsWith("https://")} />
        </div>
      </Card>

      <Card id="test" title="Send a test email" description="Checks sending end to end. Reply to it to check receiving." icon={<Mail />}>
        <TestEmailForm defaultTo={userEmail} disabled={!config.from} />
        {!config.from && <p className="mt-2 text-xs text-ink-soft">Add an API key and sender address first.</p>}
      </Card>
    </div>
  );
}

/* ------------------------------ Analytics & SEO ----------------------------- */

async function AnalyticsSettings() {
  const [saved, live] = await Promise.all([getSavedAnalytics(), getAnalyticsSettings()]);
  const rows: { label: string; value?: string; note: ReactNode }[] = [
    { label: "Google Analytics 4", value: live.gaMeasurementId, note: "Loads after cookie consent" },
    { label: "Google Ads", value: live.googleAdsId, note: "Conversion tracking" },
    { label: "Search Console", value: live.searchConsoleToken ? "Verification tag published" : undefined, note: "google-site-verification meta tag" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <Card id="analytics" title="Tracking & verification" description="Changes go live on the website as soon as you save — no redeploy." icon={<ChartColumn />}>
        <AnalyticsForm
          initial={{
            gaMeasurementId: saved?.gaMeasurementId ?? "",
            googleAdsId: saved?.googleAdsId ?? "",
            searchConsoleToken: saved?.searchConsoleToken ?? "",
          }}
        />
      </Card>
      <Card title="Live on the website">
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.label} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-heading">{r.label}</p>
                <p className="truncate font-mono text-xs text-ink-soft">{r.value ?? r.note}</p>
              </div>
              {r.value ? <StatusPill tone="success">Active</StatusPill> : <StatusPill tone="neutral">Off</StatusPill>}
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-line pt-4 text-xs text-ink-soft">
          Staging and development sites are never indexed, whatever is set here.
        </p>
      </Card>
    </div>
  );
}

/* -------------------------------- Google Ads -------------------------------- */

async function GoogleAdsSettings({ connected: justConnected, error }: { connected: boolean; error?: string }) {
  const config = await getGoogleAdsConfig();
  const saved = config.saved;
  const redirectUri = oauthRedirectUri();
  const connected = Boolean(config.refreshToken);
  const errorMessage = error === "exchange" ? saved?.lastConnectError : error ? GOOGLE_ADS_CONNECT_ERRORS[error] : undefined;
  const steps = [
    { label: "API details", done: Boolean(config.developerToken && config.clientId && config.clientSecret) },
    { label: "Google account", done: connected },
  ];

  return (
    <div className="space-y-6">
      {justConnected && !error && (
        <p role="status" className="flex gap-2 rounded-[var(--radius-md)] bg-success-wash p-4 text-sm font-medium text-success">
          <CircleCheck aria-hidden="true" className="size-5 shrink-0" /> Google Ads connected. Add client accounts under Google Ads.
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="flex gap-2 rounded-[var(--radius-md)] bg-danger-wash p-4 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0" /> {errorMessage}
        </p>
      )}
      {config.secretsUnreadable && (
        <p role="alert" className="flex gap-2 rounded-[var(--radius-md)] bg-danger-wash p-4 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
          Saved Google Ads secrets can&apos;t be decrypted — SETTINGS_ENCRYPTION_KEY has changed. Re-enter them and reconnect.
        </p>
      )}

      <Card
        id="google-ads-setup"
        title="How the connection works"
        description="One-time setup. After it, client reports update daily without anyone signing in to Google Ads."
        icon={<Megaphone />}
        aside={<span className="text-sm font-bold text-ink-soft">{steps.filter((s) => s.done).length} of {steps.length} complete</span>}
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
          <li>
            In your Google Ads <strong>manager account</strong> (MCC), open <strong>Admin → API Center</strong> and copy the developer token. It needs{" "}
            <strong>Basic access</strong> to read real client accounts — test access only works with test accounts.
          </li>
          <li>
            In{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-bold text-teal-ink underline">
              Google Cloud Console
            </a>
            , enable the <strong>Google Ads API</strong>, then create an <strong>OAuth client ID</strong> (type: Web application) with this authorised redirect URI:
            <span className="mt-1.5 flex items-center gap-1 rounded-[var(--radius-sm)] bg-surface-2 px-2.5 py-1.5 font-mono text-xs break-all">
              {redirectUri}
              <CopyButton value={redirectUri} label="Copy redirect URI" />
            </span>
          </li>
          <li>
            On the OAuth consent screen, set the publishing status to <strong>In production</strong>. In Testing mode Google expires access after 7 days.
          </li>
          <li>Save the details below, then connect the Google account that manages your clients&apos; ads.</li>
        </ol>
      </Card>

      <Card
        id="google-ads-api"
        title="API details"
        icon={<KeyRound />}
        aside={steps[0].done ? <StatusPill tone="success">Saved</StatusPill> : <StatusPill tone="neutral">Not set</StatusPill>}
      >
        <GoogleAdsAppForm
          initial={{
            clientId: saved?.clientId ?? "",
            loginCustomerId: saved?.loginCustomerId ? formatCustomerId(saved.loginCustomerId) : "",
            maskedDeveloperToken: config.developerToken ? maskSecret(config.developerToken) : null,
            maskedClientSecret: config.clientSecret ? maskSecret(config.clientSecret) : null,
          }}
        />
      </Card>

      <Card
        id="google-ads-account"
        title="Google account"
        description="Mavqo only reads reports through this connection — it never changes campaigns."
        icon={<Link2 />}
        aside={connected ? <StatusPill tone="success">Connected</StatusPill> : <StatusPill tone="neutral">Not connected</StatusPill>}
      >
        {connected && (
          <dl className="mb-4 grid gap-3 rounded-[var(--radius-md)] bg-surface-2/60 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Signed in as</dt>
              <dd className="mt-0.5 font-bold text-heading">{saved?.connectedEmail ?? "Google account"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Connected</dt>
              <dd className="mt-0.5 font-bold text-heading">{saved?.connectedAt ? formatDate(saved.connectedAt, { dateStyle: "medium", timeStyle: "short" }) : "—"}</dd>
            </div>
          </dl>
        )}
        <GoogleAdsConnectForm connected={connected} canConnect={steps[0].done} />
        {!steps[0].done && <p className="mt-2 text-right text-xs text-ink-soft">Save the API details first.</p>}
        <p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
          Reports sync every morning (06:00 Nairobi) when <code className="rounded bg-surface-2 px-1">CRON_SECRET</code> is set on the server, and whenever someone clicks <strong>Sync</strong>.
        </p>
      </Card>
    </div>
  );
}
