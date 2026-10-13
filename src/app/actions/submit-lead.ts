"use server";

import { after } from "next/server";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads/create-lead";
import { notifyNewLead } from "@/lib/leads/notify";
import { getClientIpHash } from "@/lib/security/request";
import type { FieldErrors } from "@/lib/validation/lead";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success"; reference: string; enquiryType: string }
  | { status: "error"; message: string; errors?: FieldErrors };

const FIELDS = [
  "enquiryType", "name", "email", "phone", "organization", "preferredContact",
  "productInterest", "serviceInterest", "organizationSize", "websiteUrl", "objective",
  "budgetRange", "timeline", "message", "consent", "sourcePage", "referrer",
  "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "gclid",
] as const;

export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const input: Record<string, string> = {};
  for (const key of FIELDS) {
    const value = formData.get(key);
    if (typeof value === "string") input[key] = value;
  }

  const result = await createLead(input, {
    ipHash: await getClientIpHash(),
    honeypot: (formData.get("company_website") as string | null) ?? undefined,
    fillMs: Number(formData.get("fill_ms")) || undefined,
  });

  switch (result.status) {
    case "created": {
      const { leadId } = result;
      after(async () => {
        const lead = await db().lead.findUnique({ where: { id: leadId } });
        if (lead) await notifyNewLead(lead);
      });
      return { status: "success", reference: result.reference, enquiryType: result.enquiryType };
    }
    case "spam":
      // Look successful to bots; nothing is stored.
      return { status: "success", reference: "", enquiryType: String(input.enquiryType ?? "contact") };
    case "invalid":
      return { status: "error", message: "Please check the highlighted fields.", errors: result.errors };
    case "rate_limited":
      return { status: "error", message: "We've received several requests from your network. Please wait a few minutes and try again, or contact us directly." };
    case "error":
      return { status: "error", message: "Something went wrong on our side and your request wasn't sent. Please try again, or contact us directly." };
  }
}
