"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { getClientIpHash } from "@/lib/security/request";
import { adsAccountSchema } from "@/lib/settings/schema";
import { formatCustomerId, normalizeCustomerId } from "@/lib/google-ads/customer-id";
import { getGoogleAdsConfig } from "@/lib/google-ads/config";
import { LOGO_MAX_BYTES, sniffLogoType } from "@/lib/google-ads/logo";
import { GoogleAdsError, listAccessibleAccounts, type AccessibleAccount } from "@/lib/google-ads/client";
import { syncAccount, syncAllAccounts } from "@/lib/google-ads/sync";

export type FormState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string> };

const ok = (message: string): FormState => ({ status: "success", message });
const fail = (message: string, errors?: Record<string, string>): FormState => ({ status: "error", message, errors });

function fieldErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path.at(-1) ?? "form")] ??= i.message;
  return errors;
}

const manager = () => requireUser("ads:manage");

/* ------------------------------ Add an account ------------------------------ */

export async function createAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await manager();
  const parsed = adsAccountSchema.safeParse({
    name: formData.get("name") ?? "",
    customerId: formData.get("customerId") ?? "",
    monthlyBudget: formData.get("monthlyBudget") ?? "",
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));

  const existing = await db().adsAccount.findUnique({ where: { customerId: parsed.data.customerId }, select: { id: true } });
  if (existing) return fail("That account is already added.", { customerId: "Already added" });

  const account = await db().adsAccount.create({ data: parsed.data, select: { id: true } });
  await audit({ action: "ads_account_created", actorId: user.id, entityType: "ads_account", entityId: account.id, metadata: { customerId: parsed.data.customerId } });
  // First sync backfills history so the dashboard has something to show straight away.
  await syncAccount(account.id);
  redirect(`/admin/ads/${account.id}/`);
}

/* ----------------------- Import from the manager account ---------------------- */

export type ImportState = FormState & { accounts?: (AccessibleAccount & { added: boolean })[] };

export async function findAccounts(): Promise<ImportState> {
  await manager();
  const config = await getGoogleAdsConfig();
  if (!config.ready) return fail("Connect Google Ads in Settings first.");
  try {
    const found = (await listAccessibleAccounts(config)).filter((a) => !a.manager);
    const added = new Set((await db().adsAccount.findMany({ select: { customerId: true } })).map((a) => a.customerId));
    if (!found.length) return fail("No client accounts found for this connection.");
    return { status: "idle", accounts: found.map((a) => ({ ...a, added: added.has(a.customerId) })) };
  } catch (err) {
    return fail(err instanceof GoogleAdsError ? err.message : "Couldn't list accounts. Try again shortly.");
  }
}

export async function importAccounts(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const user = await manager();
  const picked = formData
    .getAll("account")
    .map((v) => String(v).split("|"))
    .map(([id, ...name]) => ({ customerId: normalizeCustomerId(id), name: name.join("|").trim().slice(0, 160) || "Client account" }))
    .filter((a): a is { customerId: string; name: string } => Boolean(a.customerId))
    .slice(0, 50);
  if (!picked.length) return fail("Tick at least one account to import.");

  const { count } = await db().adsAccount.createMany({ data: picked, skipDuplicates: true });
  await audit({ action: "ads_accounts_imported", actorId: user.id, entityType: "ads_account", metadata: { count } });
  const { synced, failed } = await syncAllAccounts();
  refresh();
  return failed.length
    ? fail(`Imported ${count} account${count === 1 ? "" : "s"}. ${synced} synced; ${failed.length} failed: ${failed[0].error}`)
    : ok(`Imported ${count} account${count === 1 ? "" : "s"} and synced their data.`);
}

/* ---------------------------------- Sync ---------------------------------- */

export async function syncNow(_prev: FormState, formData: FormData): Promise<FormState> {
  await manager();
  const id = String(formData.get("accountId") ?? "");
  if (!z.uuid().safeParse(id).success) return fail("Unknown account.");
  const result = await syncAccount(id, { full: formData.get("full") === "1" });
  refresh();
  return result.ok ? ok("Synced with Google Ads.") : fail(result.error);
}

export async function syncEverything(): Promise<FormState> {
  await manager();
  const { synced, failed } = await syncAllAccounts();
  refresh();
  if (!failed.length) return ok(`Synced ${synced} account${synced === 1 ? "" : "s"}.`);
  return fail(`${synced} synced, ${failed.length} failed. ${failed[0].name}: ${failed[0].error}`);
}

/* ------------------------------ Edit / remove ------------------------------ */

export async function updateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await manager();
  const id = String(formData.get("accountId") ?? "");
  if (!z.uuid().safeParse(id).success) return fail("Unknown account.");
  const account = await db().adsAccount.findUnique({ where: { id }, select: { customerId: true } });
  if (!account) return fail("Unknown account.");

  const parsed = adsAccountSchema.safeParse({
    name: formData.get("name") ?? "",
    customerId: formatCustomerId(account.customerId),
    monthlyBudget: formData.get("monthlyBudget") ?? "",
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error.issues));

  await db().adsAccount.update({
    where: { id },
    data: { name: parsed.data.name, monthlyBudget: parsed.data.monthlyBudget ?? null, active: formData.get("active") === "on" },
  });
  await audit({ action: "ads_account_updated", actorId: user.id, entityType: "ads_account", entityId: id });
  refresh();
  return ok("Saved.");
}

export async function updateLogo(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await manager();
  const id = String(formData.get("accountId") ?? "");
  if (!z.uuid().safeParse(id).success) return fail("Unknown account.");

  if (formData.get("remove") === "1") {
    await db().adsAccount.update({ where: { id }, data: { logo: null, logoType: null, logoUpdatedAt: new Date() } }).catch(() => null);
    await audit({ action: "ads_account_logo_removed", actorId: user.id, entityType: "ads_account", entityId: id });
    refresh();
    return ok("Logo removed.");
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image to upload.");
  if (file.size > LOGO_MAX_BYTES) return fail("That image is over 512 KB — export a smaller PNG or JPEG.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffLogoType(bytes);
  if (!type) return fail("Use a PNG, JPEG or WebP image.");

  const updated = await db().adsAccount.update({ where: { id }, data: { logo: bytes, logoType: type, logoUpdatedAt: new Date() }, select: { id: true } }).catch(() => null);
  if (!updated) return fail("Unknown account.");
  await audit({ action: "ads_account_logo_updated", actorId: user.id, entityType: "ads_account", entityId: id, metadata: { bytes: bytes.length, type } });
  refresh();
  return ok("Logo updated.");
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await manager();
  const id = String(formData.get("accountId") ?? "");
  if (!z.uuid().safeParse(id).success) return fail("Unknown account.");
  if (formData.get("confirm") !== "on") return fail("Tick the box to confirm.");
  const removed = await db().adsAccount.delete({ where: { id }, select: { customerId: true, name: true } }).catch(() => null);
  if (!removed) return fail("Unknown account.");
  await audit({ action: "ads_account_deleted", actorId: user.id, entityType: "ads_account", entityId: id, metadata: { customerId: removed.customerId }, ipHash: await getClientIpHash() });
  redirect("/admin/ads/?removed=1");
}
