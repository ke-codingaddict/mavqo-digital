import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";
import { IDLE_TIMEOUT_SECONDS, isSessionLive, signSession, verifySession } from "@/lib/auth/session-token";
import { pickForwardedIp } from "@/lib/security/request";
import { greetingName } from "@/lib/leads/notify";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/security/password";
import { csvCell } from "@/lib/leads/csv";
import { generateLeadReference } from "@/lib/leads/reference";

const SECRET = "x".repeat(40);

describe("permissions", () => {
  it("lets sales view and update leads but not export or delete", () => {
    expect(can("sales", "leads:view")).toBe(true);
    expect(can("sales", "leads:update")).toBe(true);
    expect(can("sales", "leads:export")).toBe(false);
    expect(can("sales", "blog:manage")).toBe(false);
    expect(can("admin", "blog:manage")).toBe(true);
    expect(can("sales", "leads:delete")).toBe(false);
  });
  it("gives admins every permission", () => {
    expect(can("admin", "leads:export")).toBe(true);
    expect(can("admin", "leads:delete")).toBe(true);
  });
  it("denies everything without a role", () => {
    expect(can(null, "leads:view")).toBe(false);
    expect(can(undefined, "leads:view")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a valid session", async () => {
    const token = await signSession({ sub: "user-1", role: "sales", sid: "s-1" }, SECRET);
    expect(await verifySession(token, SECRET)).toEqual({ sub: "user-1", role: "sales", sid: "s-1" });
  });
  it("rejects tokens signed with another secret", async () => {
    const token = await signSession({ sub: "user-1", role: "admin", sid: "s-1" }, "y".repeat(40));
    expect(await verifySession(token, SECRET)).toBeNull();
  });
  it("rejects tampered tokens", async () => {
    const token = await signSession({ sub: "user-1", role: "sales", sid: "s-1" }, SECRET);
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "user-1", role: "admin", aud: "mavqo-admin", exp: 9999999999 })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`, SECRET)).toBeNull();
  });
  it("rejects missing and garbage tokens", async () => {
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession("not-a-jwt", SECRET)).toBeNull();
  });
});

describe("admin session inactivity", () => {
  const now = Date.UTC(2026, 9, 13, 12);
  const live = { lastSeenAt: new Date(now - 60_000), expiresAt: new Date(now + 3_600_000), revokedAt: null };
  it("is live within the idle window", () => {
    expect(isSessionLive(live, now)).toBe(true);
  });
  it("ends after 5 minutes without activity", () => {
    expect(IDLE_TIMEOUT_SECONDS).toBe(300);
    expect(isSessionLive({ ...live, lastSeenAt: new Date(now - 299_000) }, now)).toBe(true);
    expect(isSessionLive({ ...live, lastSeenAt: new Date(now - 300_000) }, now)).toBe(false);
  });
  it("ends when revoked or past its absolute expiry, however active", () => {
    expect(isSessionLive({ ...live, revokedAt: new Date(now - 1) }, now)).toBe(false);
    expect(isSessionLive({ ...live, lastSeenAt: new Date(now), expiresAt: new Date(now) }, now)).toBe(false);
  });
});

describe("client IP from X-Forwarded-For", () => {
  it("ignores entries a client can forge to the left of our proxy", () => {
    expect(pickForwardedIp("6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(pickForwardedIp("6.6.6.6, 203.0.113.9, 10.0.0.2", 2)).toBe("203.0.113.9");
  });
  it("handles a single entry and missing header", () => {
    expect(pickForwardedIp("203.0.113.9", 1)).toBe("203.0.113.9");
    expect(pickForwardedIp(null, 1)).toBeNull();
    expect(pickForwardedIp("203.0.113.9", 0)).toBeNull();
  });
});

describe("auto-reply greeting", () => {
  it("uses a plain first name", () => {
    expect(greetingName("Wanjiku Kamau")).toBe("Wanjiku");
    expect(greetingName("O'Brien")).toBe("O'Brien");
  });
  it("refuses names that could carry links or spam", () => {
    expect(greetingName("https://spam.example/win")).toBe("there");
    expect(greetingName("Visit.example.com now")).toBe("there");
    expect(greetingName("a".repeat(31))).toBe("there");
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("correct horse 42");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse 42", hash)).toBe(true);
    expect(await verifyPassword("wrong horse 42", hash)).toBe(false);
  });
  it("produces different hashes for the same password (salted)", async () => {
    expect(await hashPassword("same-password-1")).not.toBe(await hashPassword("same-password-1"));
  });
  it("enforces minimum strength", () => {
    expect(validatePasswordStrength("short1")).not.toBeNull();
    expect(validatePasswordStrength("onlyletterslong")).not.toBeNull();
    expect(validatePasswordStrength("letters-and-123")).toBeNull();
  });
});

describe("csvCell", () => {
  it("quotes values and escapes quotes", () => {
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvCell(null)).toBe("");
  });
  it("neutralizes spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+254712345678")).toBe('"\'+254712345678"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
  });
});

describe("lead references", () => {
  it("are readable and avoid ambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(generateLeadReference()).toMatch(/^MVQ-[2-9A-HJKMNP-Z]{6}$/);
  });
});
