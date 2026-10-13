import { z } from "zod";
import { leadOptions } from "@/content/industries";

/**
 * Lead form validation, shared by the browser (instant feedback) and the
 * server (authoritative). Never trust the client result alone.
 */

export const ENQUIRY_TYPES = ["contact", "demo", "quote", "marketing", "waitlist"] as const;
export type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number];

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

/**
 * Normalize Kenyan and international phone numbers to E.164.
 * Accepts 0712 345 678, 0112345678, 254712345678, +254 712 345 678, and
 * other international numbers starting with "+".
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;
  let digits: string;
  if (cleaned.startsWith("+")) digits = cleaned.slice(1);
  else if (cleaned.startsWith("00")) digits = cleaned.slice(2);
  else if (/^0[17]\d{8}$/.test(cleaned)) digits = `254${cleaned.slice(1)}`;
  else if (/^[17]\d{8}$/.test(cleaned)) digits = `254${cleaned}`;
  else if (cleaned.startsWith("254")) digits = cleaned;
  else return null; // Local numbers must be Kenyan; others need a "+" country code.

  if (!/^[1-9]\d+$/.test(digits)) return null;
  if (digits.startsWith("254")) return /^254[17]\d{8}$/.test(digits) ? `+${digits}` : null;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalEnum = <T extends [string, ...string[]]>(vals: T) =>
  z
    .union([z.enum(vals), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined));

const attributionField = optionalText(300);

export const leadSchema = z
  .object({
    enquiryType: z.enum(ENQUIRY_TYPES),
    name: z.string().trim().min(2, "Please enter your name").max(160, "Name is too long"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.email("Please enter a valid email address").optional()),
    phone: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((v, ctx) => {
        if (!v) return undefined;
        const normalized = normalizePhone(v);
        if (!normalized) {
          ctx.addIssue({ code: "custom", message: "Please enter a valid phone number, e.g. 0712 345 678" });
          return z.NEVER;
        }
        return normalized;
      }),
    organization: optionalText(200),
    preferredContact: optionalEnum(values(leadOptions.preferredContact)),
    productInterest: optionalText(80),
    serviceInterest: optionalText(80),
    organizationSize: optionalEnum(values(leadOptions.organizationSize)),
    websiteUrl: z
      .string()
      .trim()
      .max(300)
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        return /^https?:\/\//i.test(v) ? v : `https://${v}`;
      })
      .pipe(z.url("Please enter a valid website address").optional()),
    objective: optionalText(300),
    budgetRange: optionalEnum(values(leadOptions.budgetRange)),
    timeline: optionalEnum(values(leadOptions.timeline)),
    message: optionalText(5000),
    consent: z
      .union([z.literal("on"), z.literal("true"), z.boolean()])
      .optional()
      .transform((v) => v === true || v === "on" || v === "true"),

    // Attribution (captured automatically, never shown to the user).
    sourcePage: attributionField,
    referrer: attributionField,
    utmSource: optionalText(100),
    utmMedium: optionalText(100),
    utmCampaign: optionalText(150),
    utmTerm: optionalText(150),
    utmContent: optionalText(150),
    gclid: optionalText(200),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Please give us an email address or phone number" });
    }
    if (data.preferredContact === "email" && !data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Please add your email so we can reply by email" });
    }
    if ((data.preferredContact === "phone" || data.preferredContact === "whatsapp") && !data.phone) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Please add your phone number so we can call or WhatsApp you" });
    }
    if ((data.enquiryType === "demo" || data.enquiryType === "waitlist") && !data.productInterest) {
      ctx.addIssue({ code: "custom", path: ["productInterest"], message: "Please choose a product" });
    }
    if (data.enquiryType === "demo" && !data.organization) {
      ctx.addIssue({ code: "custom", path: ["organization"], message: "Please enter your organization's name" });
    }
    if ((data.enquiryType === "quote" || data.enquiryType === "marketing") && !data.serviceInterest) {
      ctx.addIssue({ code: "custom", path: ["serviceInterest"], message: "Please choose what you need help with" });
    }
    if (data.enquiryType === "contact" && !data.message) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Please tell us how we can help" });
    }
    if (!data.consent) {
      ctx.addIssue({ code: "custom", path: ["consent"], message: "Please confirm we may contact you about your enquiry" });
    }
  });

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
export type FieldErrors = Partial<Record<keyof LeadInput, string>>;

export function validateLead(input: unknown):
  | { success: true; data: LeadData }
  | { success: false; errors: FieldErrors } {
  const result = leadSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = (issue.path[0] ?? "message") as keyof LeadInput;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
