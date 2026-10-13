import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { generateLeadReference } from "@/lib/leads/reference";
import { validateLead, type FieldErrors, type LeadData } from "@/lib/validation/lead";

export const RATE_LIMIT = { maxPerWindow: 5, windowMinutes: 10 };
/** Forms completed faster than this are almost always bots. */
export const MIN_FILL_MS = 2500;

export type CreateLeadResult =
  | { status: "created"; reference: string; leadId: string; enquiryType: LeadData["enquiryType"] }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "rate_limited" }
  | { status: "spam" }
  | { status: "error" };

/** `fillMs` is measured in the browser, so client/server clock skew doesn't matter. */
type Meta = { ipHash: string | null; honeypot?: string; fillMs?: number; now?: number };

/**
 * Validates, spam-checks, rate-limits and stores a lead (spec §8.4).
 * Returns "created" only once the lead is safely in the database.
 */
export async function createLead(input: unknown, meta: Meta): Promise<CreateLeadResult> {
  const now = meta.now ?? Date.now();
  if (meta.honeypot) return { status: "spam" };
  if (meta.fillMs !== undefined && meta.fillMs < MIN_FILL_MS) return { status: "spam" };

  const parsed = validateLead(input);
  if (!parsed.success) return { status: "invalid", errors: parsed.errors };

  try {
    const client = db();
    if (meta.ipHash) {
      const since = new Date(now - RATE_LIMIT.windowMinutes * 60_000);
      const recent = await client.lead.count({ where: { ipHash: meta.ipHash, createdAt: { gte: since } } });
      if (recent >= RATE_LIMIT.maxPerWindow) return { status: "rate_limited" };
    }

    const { consent, ...data } = parsed.data;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const lead = await client.lead.create({
          data: { ...data, reference: generateLeadReference(), consentGiven: consent, ipHash: meta.ipHash },
        });
        return { status: "created", reference: lead.reference, leadId: lead.id, enquiryType: lead.enquiryType };
      } catch (err) {
        // Retry only on a reference collision.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
        throw err;
      }
    }
    return { status: "error" };
  } catch (err) {
    console.error("[leads] failed to store lead:", err instanceof Error ? err.message : "unknown error");
    return { status: "error" };
  }
}
