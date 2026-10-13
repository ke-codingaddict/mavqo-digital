import "server-only";

/**
 * Minimal typed client for the Resend HTTP API (https://resend.com/docs/api-reference).
 * Never logs payloads, which contain personal data, or the API key.
 */

const BASE = "https://api.resend.com";

export type ResendResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

async function request<T>(apiKey: string, method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<ResendResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
    if (!res.ok) {
      console.error(`[resend] ${method} ${path.split("/").slice(0, 2).join("/")} → ${res.status}`);
      return { ok: false, status: res.status, message: typeof json?.message === "string" ? json.message.slice(0, 200) : `Resend responded ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    console.error("[resend] request failed:", err instanceof Error ? err.name : "unknown");
    return { ok: false, status: 0, message: "Couldn't reach Resend. Check your connection and try again." };
  }
}

export type DomainRecord = { record: string; name: string; type: string; ttl?: string; status: string; value: string; priority?: number };
export type Domain = {
  id: string;
  name: string;
  status: string;
  region?: string;
  created_at?: string;
  capabilities?: { sending?: string; receiving?: string };
  records?: DomainRecord[];
};

export const listDomains = (key: string) => request<{ data: Domain[] }>(key, "GET", "/domains");
export const getDomain = (key: string, id: string) => request<Domain>(key, "GET", `/domains/${encodeURIComponent(id)}`);
export const verifyDomain = (key: string, id: string) => request<{ id: string }>(key, "POST", `/domains/${encodeURIComponent(id)}/verify`);

export const createWebhook = (key: string, endpoint: string, events: string[]) =>
  request<{ id: string; signing_secret: string }>(key, "POST", "/webhooks", { endpoint, events });
export const deleteWebhook = (key: string, id: string) => request<unknown>(key, "DELETE", `/webhooks/${encodeURIComponent(id)}`);

export type SendPayload = {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  reply_to?: string | string[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
};

export const sendEmail = (key: string, payload: SendPayload, idempotencyKey?: string) =>
  request<{ id: string }>(key, "POST", "/emails", payload, idempotencyKey);

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  reply_to?: string[];
  subject: string | null;
  html: string | null;
  text: string | null;
  headers?: Record<string, string>;
  message_id?: string | null;
  created_at: string;
  authentication?: { spf?: string; dkim?: string; dmarc?: string };
  attachments?: { id: string; filename: string; content_type: string; size?: number; content_disposition?: string | null }[];
};

/** Full content of a received email; webhooks only carry its metadata. */
export const getReceivedEmail = (key: string, id: string) =>
  request<ReceivedEmail>(key, "GET", `/emails/receiving/${encodeURIComponent(id)}?html_format=data_uri`);
