import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";
import { addDays, daysBetween, eachDay, isIsoDate, resolveRange } from "@/lib/google-ads/range";
import { byCampaign, change, dailySeries, impressionShare, projectMonthSpend, summarize, type CampaignDayRow } from "@/lib/google-ads/metrics";
import { buildRecommendations, type RecommendationInput } from "@/lib/google-ads/recommendations";
import { formatCustomerId, normalizeCustomerId } from "@/lib/google-ads/customer-id";
import { describeAdsError } from "@/lib/google-ads/client";
import { signOAuthState, verifyOAuthState } from "@/lib/google-ads/oauth-state";
import { adsAccountSchema, googleAdsAppSchema } from "@/lib/settings/schema";

const SECRET = "x".repeat(40);

function row(over: Partial<CampaignDayRow> = {}): CampaignDayRow {
  return {
    date: "2026-10-01",
    campaignId: "1",
    campaignName: "Search – Nairobi",
    campaignStatus: "ENABLED",
    channelType: "SEARCH",
    impressions: 1000,
    clicks: 50,
    cost: 5000,
    conversions: 5,
    conversionsValue: 0,
    searchImpressionShare: null,
    budgetLostShare: null,
    rankLostShare: null,
    ...over,
  };
}

describe("date ranges", () => {
  const today = "2026-10-13";

  it("defaults to the last 30 days ending yesterday, compared with the 30 before", () => {
    const r = resolveRange({}, today);
    expect(r).toMatchObject({ key: "30d", from: "2026-09-13", to: "2026-10-12", prevFrom: "2026-08-14", prevTo: "2026-09-12", days: 30 });
  });

  it("includes today for this month", () => {
    expect(resolveRange({ range: "mtd" }, today)).toMatchObject({ from: "2026-10-01", to: "2026-10-13", prevTo: "2026-09-30" });
  });

  it("compares last month with the whole month before", () => {
    expect(resolveRange({ range: "last_month" }, "2026-03-15")).toMatchObject({ from: "2026-02-01", to: "2026-02-28", prevFrom: "2026-01-01", prevTo: "2026-01-31" });
  });

  it("accepts, clamps and orders custom ranges", () => {
    expect(resolveRange({ range: "custom", from: "2026-10-10", to: "2026-10-01" }, today)).toMatchObject({ from: "2026-10-01", to: "2026-10-10", days: 10 });
    expect(resolveRange({ range: "custom", from: "2026-10-01", to: "2027-01-01" }, today).to).toBe(today);
  });

  it("ignores malformed custom dates", () => {
    expect(resolveRange({ range: "custom", from: "2026-02-30", to: "x" }, today).key).toBe("30d");
    expect(isIsoDate("2026-02-30")).toBe(false);
  });

  it("does date arithmetic across months and leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(365);
    expect(eachDay("2026-09-29", "2026-10-02")).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  });
});

describe("metrics", () => {
  it("derives rates from totals", () => {
    const p = summarize([row(), row({ clicks: 50, cost: 5000, conversions: 0, impressions: 1000 })]);
    expect(p).toMatchObject({ clicks: 100, cost: 10_000, conversions: 5, ctr: 0.05, cpc: 100, conversionRate: 0.05, costPerConversion: 2000, roas: null });
  });

  it("returns null rates instead of dividing by zero", () => {
    expect(summarize([])).toMatchObject({ ctr: null, cpc: null, costPerConversion: null });
    expect(change(5, 0)).toBeNull();
    expect(change(15, 10)).toBeCloseTo(0.5);
  });

  it("weights impression share by eligible impressions", () => {
    // 100 of 200 eligible, and 900 of 1000 eligible → 1000 of 1200.
    const s = impressionShare([
      { impressions: 100, searchImpressionShare: 0.5, budgetLostShare: 0.5, rankLostShare: 0 },
      { impressions: 900, searchImpressionShare: 0.9, budgetLostShare: 0, rankLostShare: 0.1 },
    ]);
    expect(s.impressionShare).toBeCloseTo(1000 / 1200);
    expect(s.budgetLostShare).toBeCloseTo(100 / 1200);
    expect(s.rankLostShare).toBeCloseTo(100 / 1200);
  });

  it("groups by campaign, biggest spend first, with the latest name", () => {
    const campaigns = byCampaign([
      row({ campaignId: "a", campaignName: "Old name", date: "2026-10-01", cost: 100 }),
      row({ campaignId: "a", campaignName: "New name", date: "2026-10-02", cost: 100 }),
      row({ campaignId: "b", cost: 600 }),
    ]);
    expect(campaigns.map((c) => c.campaignId)).toEqual(["b", "a"]);
    expect(campaigns[1]).toMatchObject({ name: "New name", cost: 200, shareOfSpend: 0.25 });
  });

  it("fills days without data with zeros", () => {
    const s = dailySeries([row({ date: "2026-10-02", cost: 10 })], "2026-10-01", "2026-10-03");
    expect(s.map((d) => d.cost)).toEqual([0, 10, 0]);
  });

  it("projects month-end spend", () => {
    expect(projectMonthSpend(10_000, 10, 31)).toBe(31_000);
  });
});

describe("recommendations", () => {
  const base = (over: Partial<RecommendationInput> = {}): RecommendationInput => {
    const rows = [row()];
    return {
      currency: "KES",
      current: summarize(rows),
      previous: summarize(rows),
      campaigns: byCampaign(rows),
      keywords: [],
      conversionActions: [{ name: "Calls from ads", category: "PHONE_CALL_LEAD", conversions: 5, value: 0 }],
      ...over,
    };
  };
  const ids = (input: RecommendationInput) => buildRecommendations(input).map((r) => r.id);

  it("flags missing conversion tracking when clicks don't convert", () => {
    const rows = [row({ clicks: 200, conversions: 0 })];
    expect(ids(base({ current: summarize(rows), campaigns: byCampaign(rows), conversionActions: [] }))[0]).toBe("no-conversions");
  });

  it("suggests raising budget on profitable budget-limited campaigns", () => {
    const rows = [row({ searchImpressionShare: 0.6, budgetLostShare: 0.3, rankLostShare: 0.1 })];
    const recs = buildRecommendations(base({ current: summarize(rows), campaigns: byCampaign(rows) }));
    const budget = recs.find((r) => r.id === "budget-limited");
    expect(budget?.priority).toBe("high");
    // 5 conversions × 0.3 lost ÷ 0.6 won ≈ 2.5 more.
    expect(budget?.detail).toMatch(/roughly 3 more conversions/);
  });

  it("calls out campaigns spending without converting", () => {
    const rows = [row({ campaignId: "a", conversions: 10, cost: 5000 }), row({ campaignId: "b", campaignName: "Display", conversions: 0, clicks: 80, cost: 4000 })];
    const recs = buildRecommendations(base({ current: summarize(rows), campaigns: byCampaign(rows) }));
    expect(recs.find((r) => r.id === "campaigns-no-conversions")?.detail).toContain("Display");
  });

  it("warns when conversions drop sharply", () => {
    const prev = summarize([row({ conversions: 20 })]);
    expect(ids(base({ previous: prev }))).toContain("conversions-dropped");
  });

  it("lists keywords that waste money", () => {
    const keywords = [{ text: "free software", matchType: "BROAD", campaignName: "c", adGroupName: "g", qualityScore: 3, impressions: 500, clicks: 40, cost: 4000, conversions: 0 }];
    const found = ids(base({ keywords }));
    expect(found).toContain("wasted-keywords");
    expect(found).toContain("low-quality-score");
  });

  it("suggests call tracking when no call conversion exists", () => {
    expect(ids(base({ conversionActions: [{ name: "Form", category: "SUBMIT_LEAD_FORM", conversions: 5, value: 0 }] }))).toContain("track-calls");
    expect(ids(base())).not.toContain("track-calls");
  });

  it("warns about overspending the monthly budget", () => {
    expect(ids(base({ monthlyBudget: 50_000, projectedMonthSpend: 70_000 }))).toContain("overspending");
  });

  it("explains an account with no activity", () => {
    const empty = summarize([]);
    expect(ids(base({ current: empty, campaigns: [] }))).toEqual(["no-activity"]);
  });

  it("orders by priority", () => {
    const rows = [row({ clicks: 200, conversions: 0 })];
    const recs = buildRecommendations(base({ current: summarize(rows), campaigns: byCampaign(rows), monthlyBudget: 100_000, projectedMonthSpend: 50_000 }));
    const order = { high: 0, medium: 1, low: 2 };
    expect(recs.map((r) => order[r.priority])).toEqual([...recs.map((r) => order[r.priority])].sort());
  });
});

describe("customer IDs and settings", () => {
  it("normalizes customer IDs", () => {
    expect(normalizeCustomerId("123-456-7890")).toBe("1234567890");
    expect(normalizeCustomerId("123 456 7890")).toBe("1234567890");
    expect(normalizeCustomerId("12345")).toBeNull();
    expect(formatCustomerId("1234567890")).toBe("123-456-7890");
  });

  it("validates new accounts", () => {
    expect(adsAccountSchema.parse({ name: "Acme", customerId: "123-456-7890", monthlyBudget: "50,000" })).toEqual({ name: "Acme", customerId: "1234567890", monthlyBudget: 50_000 });
    expect(adsAccountSchema.safeParse({ name: "Acme", customerId: "123", monthlyBudget: "" }).success).toBe(false);
    expect(adsAccountSchema.safeParse({ name: "Acme", customerId: "1234567890", monthlyBudget: "abc" }).success).toBe(false);
  });

  it("validates the API connection details", () => {
    expect(googleAdsAppSchema.parse({ clientId: "123-abc.apps.googleusercontent.com", loginCustomerId: "" })).toEqual({ clientId: "123-abc.apps.googleusercontent.com", loginCustomerId: undefined });
    expect(googleAdsAppSchema.safeParse({ clientId: "nope", loginCustomerId: "" }).success).toBe(false);
  });

  it("lets sales view reports but only admins manage them", () => {
    expect(can("sales", "ads:view")).toBe(true);
    expect(can("sales", "ads:manage")).toBe(false);
    expect(can("admin", "ads:manage")).toBe(true);
  });
});

describe("Google Ads API errors", () => {
  it("explains common failures", () => {
    const body = [{ error: { code: 403, details: [{ errors: [{ errorCode: { authorizationError: "DEVELOPER_TOKEN_NOT_APPROVED" }, message: "x" }] }] } }];
    expect(describeAdsError(body, 403).message).toMatch(/Basic access/);
    const denied = { error: { details: [{ errors: [{ errorCode: { authorizationError: "USER_PERMISSION_DENIED" } }] }] } };
    expect(describeAdsError(denied, 403, "1234567890").message).toContain("123-456-7890");
  });
});

describe("OAuth state", () => {
  it("round-trips and rejects tampering", async () => {
    const token = await signOAuthState({ sub: "u1", sid: "s1", nonce: "n1" }, SECRET);
    expect(await verifyOAuthState(token, SECRET)).toEqual({ sub: "u1", sid: "s1", nonce: "n1" });
    expect(await verifyOAuthState(token, "y".repeat(40))).toBeNull();
    expect(await verifyOAuthState(`${token}x`, SECRET)).toBeNull();
    expect(await verifyOAuthState(null, SECRET)).toBeNull();
  });
});
