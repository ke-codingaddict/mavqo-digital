import { describe, expect, it } from "vitest";
import { normalizePhone, validateLead } from "@/lib/validation/lead";

const base = { name: "Jane Wanjiku", email: "jane@school.co.ke", consent: "on" };

describe("normalizePhone", () => {
  it.each([
    ["0712 345 678", "+254712345678"],
    ["0112345678", "+254112345678"],
    ["712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["+254 712-345-678", "+254712345678"],
    ["00254712345678", "+254712345678"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["0812345678", "+2547123", "hello", "07123456789", ""])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("validateLead", () => {
  it("accepts a valid contact enquiry and trims/normalizes values", () => {
    const r = validateLead({ ...base, enquiryType: "contact", email: "  Jane@School.CO.KE ", message: "Hello", phone: "0712345678" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("jane@school.co.ke");
      expect(r.data.phone).toBe("+254712345678");
      expect(r.data.consent).toBe(true);
    }
  });

  it("requires an email or a phone number", () => {
    const r = validateLead({ name: "Jane", consent: "on", enquiryType: "contact", message: "Hi" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.email).toMatch(/email address or phone/);
  });

  it("requires consent", () => {
    const r = validateLead({ ...base, consent: undefined, enquiryType: "contact", message: "Hi" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.consent).toBeDefined();
  });

  it("requires product and organization for demo requests", () => {
    const r = validateLead({ ...base, enquiryType: "demo" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors.productInterest).toBeDefined();
      expect(r.errors.organization).toBeDefined();
    }
  });

  it("requires a service for quote requests", () => {
    const r = validateLead({ ...base, enquiryType: "quote" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.serviceInterest).toBeDefined();
  });

  it("requires a phone when WhatsApp is the preferred contact method", () => {
    const r = validateLead({ ...base, enquiryType: "contact", message: "Hi", preferredContact: "whatsapp" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.phone).toBeDefined();
  });

  it("rejects an invalid email and an invalid phone", () => {
    const r = validateLead({ ...base, enquiryType: "contact", message: "Hi", email: "nope", phone: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors.email).toMatch(/valid email/);
      expect(r.errors.phone).toMatch(/valid phone/);
    }
  });

  it("rejects unknown enquiry types and option values", () => {
    expect(validateLead({ ...base, enquiryType: "admin", message: "x" }).success).toBe(false);
    expect(validateLead({ ...base, enquiryType: "contact", message: "x", budgetRange: "1 billion" }).success).toBe(false);
  });

  it("adds https:// to bare website addresses", () => {
    const r = validateLead({ ...base, enquiryType: "quote", serviceInterest: "seo-services-kenya", websiteUrl: "example.co.ke" });
    expect(r.success && r.data.websiteUrl).toBe("https://example.co.ke");
  });

  it("enforces length limits", () => {
    const r = validateLead({ ...base, enquiryType: "contact", message: "x".repeat(5001) });
    expect(r.success).toBe(false);
  });
});
