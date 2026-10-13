"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireUser, revokeOtherSessions } from "@/lib/auth/session";
import { confirmPassword } from "@/lib/auth/reauth";
import { hashPassword, validatePasswordStrength } from "@/lib/security/password";
import { getClientIpHash } from "@/lib/security/request";
import { signatureSchema } from "@/lib/mail/signature";
import { sendMail } from "@/lib/mail/outbound";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export type FormState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string> };

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: z.string().max(200, "Use 200 characters or fewer"),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    const weak = validatePasswordStrength(v.newPassword);
    if (weak) ctx.addIssue({ code: "custom", path: ["newPassword"], message: weak });
    if (v.newPassword !== v.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "The passwords don't match" });
    if (v.newPassword && v.newPassword === v.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a password you haven't been using" });
    }
  });

function fieldErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "form");
    errors[key] ??= i.message;
  }
  return errors;
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error.issues) };

  const reauth = await confirmPassword(user.id, parsed.data.currentPassword);
  if (!reauth.ok) return { status: "error", errors: { currentPassword: reauth.error } };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db().user.update({ where: { id: user.id }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
  const revoked = await revokeOtherSessions(user.id, user.sessionId);
  await audit({ action: "password_changed", actorId: user.id, entityType: "user", entityId: user.id, metadata: { otherSessionsEnded: revoked }, ipHash: await getClientIpHash() });

  // Security notice, so an unexpected change gets noticed. Best effort.
  await sendMail({
    category: "account",
    to: [user.email],
    subject: `Your ${siteConfig.name} admin password was changed`,
    text: [
      `Hi ${user.name.split(" ")[0]},`,
      "",
      `The password for your ${siteConfig.name} admin account was changed on ${formatDate(new Date(), { dateStyle: "medium", timeStyle: "short" })} (Nairobi time).`,
      revoked ? `Your other ${revoked === 1 ? "session was" : `${revoked} sessions were`} signed out.` : "",
      "",
      "If this wasn't you, contact your administrator immediately.",
    ].join("\n"),
  }).catch(() => undefined);

  return {
    status: "success",
    message: revoked ? `Password changed. ${revoked === 1 ? "Your other session was" : `${revoked} other sessions were`} signed out.` : "Password changed.",
  };
}

export async function saveSignature(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = signatureSchema.safeParse(Object.fromEntries(["closing", "name", "title", "company", "phone", "email", "website"].map((k) => [k, formData.get(k) ?? ""])));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error.issues) };
  await db().user.update({ where: { id: user.id }, data: { signature: parsed.data as Prisma.InputJsonValue } });
  return { status: "success", message: "Signature saved." };
}
