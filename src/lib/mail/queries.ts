import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/** Conversations with at least one unread received message. */
export const unreadThreadWhere: Prisma.MailThreadWhereInput = {
  archivedAt: null,
  messages: { some: { direction: "inbound", readAt: null } },
};

export async function countUnreadThreads() {
  return db().mailThread.count({ where: unreadThreadWhere });
}
