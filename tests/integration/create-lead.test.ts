import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createLead, RATE_LIMIT } from "@/lib/leads/create-lead";
import { db } from "@/lib/db";

/** Runs against the test database (see .env.test / npm run db:test:setup). */

const valid = {
  enquiryType: "demo",
  name: "Test Principal",
  email: "principal@example.com",
  phone: "0712345678",
  organization: "Test Academy",
  productInterest: "school-management-system-kenya",
  consent: "on",
  utmSource: "google",
  utmCampaign: "school-launch",
};

beforeEach(async () => {
  await db().lead.deleteMany();
});

afterAll(async () => {
  await db().lead.deleteMany();
  await db().$disconnect();
});

describe("createLead", () => {
  it("stores a valid lead with reference, normalized phone and attribution", async () => {
    const result = await createLead(valid, { ipHash: "ip-a", fillMs: 9000 });
    expect(result.status).toBe("created");
    if (result.status !== "created") return;
    expect(result.reference).toMatch(/^MVQ-/);

    const stored = await db().lead.findUniqueOrThrow({ where: { id: result.leadId } });
    expect(stored).toMatchObject({
      enquiryType: "demo",
      status: "new",
      phone: "+254712345678",
      utmSource: "google",
      utmCampaign: "school-launch",
      consentGiven: true,
      ipHash: "ip-a",
    });
  });

  it("returns field errors and stores nothing for invalid input", async () => {
    const result = await createLead({ ...valid, email: "bad", phone: "" }, { ipHash: "ip-b" });
    expect(result.status).toBe("invalid");
    expect(await db().lead.count()).toBe(0);
  });

  it("silently drops honeypot and too-fast submissions", async () => {
    expect((await createLead(valid, { ipHash: "ip-c", honeypot: "http://spam" })).status).toBe("spam");
    expect((await createLead(valid, { ipHash: "ip-c", fillMs: 300 })).status).toBe("spam");
    expect(await db().lead.count()).toBe(0);
  });

  it("rate-limits repeated submissions from the same network", async () => {
    for (let i = 0; i < RATE_LIMIT.maxPerWindow; i++) {
      expect((await createLead(valid, { ipHash: "ip-d" })).status).toBe("created");
    }
    expect((await createLead(valid, { ipHash: "ip-d" })).status).toBe("rate_limited");
    // A different network is unaffected.
    expect((await createLead(valid, { ipHash: "ip-e" })).status).toBe("created");
  });
});
