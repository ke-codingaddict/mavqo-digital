import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditEntry = {
  action: string;
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
};

/** Records administrative and security events (spec §10.1). Never throws. */
export async function audit(entry: AuditEntry) {
  try {
    await db().auditLog.create({ data: entry });
  } catch (err) {
    console.error("[audit] failed to record", entry.action, err instanceof Error ? err.message : "");
  }
}
