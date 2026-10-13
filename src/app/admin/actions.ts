"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { endSession, getCurrentUser, requireUser } from "@/lib/auth/session";
import { LEAD_STATUSES } from "@/lib/leads/labels";
import { getClientIpHash } from "@/lib/security/request";

export type SaveState = { status: "idle" | "saved" | "error"; message?: string };

const updateSchema = z.object({
  leadId: z.uuid(),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
  internalNotes: z.string().max(10_000).optional(),
});

export async function updateLead(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const user = await requireUser("leads:update");
  const parsed = updateSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    internalNotes: formData.get("internalNotes") ?? undefined,
  });
  if (!parsed.success) return { status: "error", message: "Invalid update." };
  const { leadId, status, internalNotes } = parsed.data;

  const client = db();
  const existing = await client.lead.findUnique({ where: { id: leadId }, select: { status: true, firstContactedAt: true } });
  if (!existing) return { status: "error", message: "Lead not found." };

  await client.lead.update({
    where: { id: leadId },
    data: {
      status: status as (typeof LEAD_STATUSES)[number],
      internalNotes: internalNotes?.trim() || null,
      // Measures lead response time (spec §2.1).
      ...(existing.status === "new" && status !== "new" && !existing.firstContactedAt ? { firstContactedAt: new Date() } : {}),
    },
  });
  if (existing.status !== status) {
    await audit({ action: "lead_status_changed", actorId: user.id, entityType: "lead", entityId: leadId, metadata: { from: existing.status, to: status } });
  }
  return { status: "saved", message: "Changes saved." };
}

export async function deleteLead(formData: FormData) {
  const user = await requireUser("leads:delete");
  const leadId = z.uuid().safeParse(formData.get("leadId"));
  if (!leadId.success || formData.get("confirm") !== "yes") redirect("/admin/leads/");
  const lead = await db().lead.delete({ where: { id: leadId.data }, select: { reference: true } }).catch(() => null);
  if (lead) {
    await audit({ action: "lead_deleted", actorId: user.id, entityType: "lead", entityId: leadId.data, metadata: { reference: lead.reference } });
  }
  redirect("/admin/leads/?deleted=1");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await audit({ action: "logout", actorId: user.id, ipHash: await getClientIpHash() });
  await endSession();
  redirect("/admin/login/");
}

