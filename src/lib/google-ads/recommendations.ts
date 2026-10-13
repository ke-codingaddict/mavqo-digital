import { channelLabel, formatMoney, formatNumber, formatPercent, type CampaignPerformance, type Performance } from "./metrics";

/**
 * Rule-based advice for getting more conversions from an account. Each rule
 * looks at the synced numbers, fires only with enough data behind it, and
 * says what to do — not just what's wrong. Pure, so every rule is testable.
 */

export type KeywordPerformance = {
  text: string;
  matchType: string;
  campaignName: string;
  adGroupName: string;
  qualityScore: number | null;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
};

export type ConversionActionSummary = { name: string; category: string; conversions: number; value: number };

export type RecommendationInput = {
  currency: string;
  current: Performance;
  previous: Performance;
  campaigns: CampaignPerformance[];
  /** Keywords over the last 30 days. */
  keywords: KeywordPerformance[];
  conversionActions: ConversionActionSummary[];
  /** Agreed monthly budget and projected month-end spend, when known. */
  monthlyBudget?: number | null;
  projectedMonthSpend?: number | null;
};

export type Priority = "high" | "medium" | "low";
export type RecommendationKind = "fix" | "opportunity" | "watch";

export type Recommendation = {
  id: string;
  priority: Priority;
  kind: RecommendationKind;
  title: string;
  /** Why this matters, with the numbers behind it. */
  detail: string;
  /** Concrete next steps. */
  actions: string[];
};

// Thresholds — tuned for small and mid-sized Kenyan accounts.
const MIN_CLICKS_FOR_RATES = 100;
const MIN_CAMPAIGN_CLICKS = 30;
const LOW_SEARCH_CTR = 0.03;
const LOW_CONVERSION_RATE = 0.02;
const HIGH_BUDGET_LOST = 0.15;
const HIGH_RANK_LOST = 0.3;
const LOW_QUALITY_SCORE = 4;
const SIGNIFICANT_CHANGE = 0.25;

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const list = (names: string[], max = 3) => {
  const shown = names.slice(0, max).map((n) => `“${n}”`);
  const more = names.length - shown.length;
  return more > 0 ? `${shown.join(", ")} and ${more} more` : shown.join(shown.length === 2 ? " and " : ", ");
};

export function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const { current: cur, previous: prev, campaigns, keywords, currency } = input;
  const money = (n: number | null) => formatMoney(n, currency);
  const out: Recommendation[] = [];
  const add = (r: Recommendation) => out.push(r);

  if (cur.cost <= 0 && cur.impressions <= 0) {
    return [
      {
        id: "no-activity",
        priority: "high",
        kind: "watch",
        title: "No ad activity in this period",
        detail: "The account didn't spend or show ads in this period. Campaigns may be paused, out of budget, or waiting on billing or ad approval.",
        actions: ["Check campaign status and billing in Google Ads.", "Check for disapproved ads or policy issues.", "Run a sync after making changes to refresh this report."],
      },
    ];
  }

  /* -------- Measurement first: without it, nothing else can be optimised -------- */

  if (cur.conversions === 0 && cur.clicks >= 50) {
    add({
      id: "no-conversions",
      priority: "high",
      kind: "fix",
      title: input.conversionActions.length ? "Clicks aren't turning into conversions" : "Conversion tracking looks missing",
      detail: `${formatNumber(cur.clicks)} clicks and ${money(cur.cost)} spent with no recorded conversions. Either tracking is broken or the landing page isn't converting — Google's bidding can't optimise without conversion data.`,
      actions: [
        "Confirm the Google tag fires on the thank-you / confirmation page (use Tag Assistant).",
        "Track calls from ads and the website, WhatsApp clicks, and form submissions as conversions.",
        "Test the landing page on a phone: load speed, a clear offer, and a short form or one-tap call button.",
      ],
    });
  } else if (cur.conversions > 0 && !input.conversionActions.some((a) => /call|phone|whatsapp/i.test(`${a.name} ${a.category}`))) {
    add({
      id: "track-calls",
      priority: "low",
      kind: "opportunity",
      title: "Count phone calls and WhatsApp chats as conversions",
      detail: "No call or WhatsApp conversion is being tracked. In Kenya many customers call or message instead of filling in a form, so real results are probably under-reported — and under-reported results make Google bid too cautiously.",
      actions: ["Add call assets with call reporting on.", "Track clicks on tel: and WhatsApp links as conversions.", "Import offline sales (closed deals) where possible."],
    });
  }

  /* ------------------------------ Trend alerts ------------------------------ */

  if (prev.conversions >= 5) {
    const drop = (prev.conversions - cur.conversions) / prev.conversions;
    if (drop >= SIGNIFICANT_CHANGE) {
      add({
        id: "conversions-dropped",
        priority: "high",
        kind: "watch",
        title: `Conversions fell ${formatPercent(drop, 0)} on the previous period`,
        detail: `${formatNumber(cur.conversions)} conversions versus ${formatNumber(prev.conversions)} before, while spend went ${cur.cost >= prev.cost ? "up" : "down"} to ${money(cur.cost)}.`,
        actions: [
          "Check the conversion tag still fires (site changes often break it).",
          "Look for paused campaigns, disapproved ads or budget changes in the change history.",
          "Compare search terms with the previous period for new irrelevant traffic.",
        ],
      });
    }
  }

  if (cur.costPerConversion !== null && prev.costPerConversion !== null && prev.conversions >= 5) {
    const rise = (cur.costPerConversion - prev.costPerConversion) / prev.costPerConversion;
    if (rise >= SIGNIFICANT_CHANGE) {
      add({
        id: "cpa-rising",
        priority: "medium",
        kind: "watch",
        title: `Cost per conversion is up ${formatPercent(rise, 0)}`,
        detail: `Each conversion now costs ${money(cur.costPerConversion)}, up from ${money(prev.costPerConversion)}.`,
        actions: [
          "Add negative keywords from the search terms report.",
          "Lower bids or set a target CPA on campaigns above the account average.",
          "Review ad schedule and locations — cut hours and areas that don't convert.",
        ],
      });
    }
  }

  /* ------------------------------ Campaign rules ----------------------------- */

  const accountCpa = cur.costPerConversion;
  const enabled = campaigns.filter((c) => c.cost > 0);

  const wasted = enabled.filter((c) => c.conversions === 0 && c.clicks >= MIN_CAMPAIGN_CLICKS && (accountCpa === null || c.cost >= accountCpa));
  if (wasted.length && cur.conversions > 0) {
    const spend = wasted.reduce((s, c) => s + c.cost, 0);
    add({
      id: "campaigns-no-conversions",
      priority: spend / cur.cost >= 0.2 ? "high" : "medium",
      kind: "fix",
      title: `${wasted.length === 1 ? "A campaign is" : `${wasted.length} campaigns are`} spending without converting`,
      detail: `${list(wasted.map((c) => c.name))} spent ${money(spend)} (${formatPercent(spend / cur.cost, 0)} of the budget) with no conversions.`,
      actions: [
        "Move that budget to campaigns that are converting.",
        "Check search terms and add negatives for irrelevant queries.",
        "If the campaign is for awareness, judge it on reach — otherwise pause or restructure it.",
      ],
    });
  }

  if (accountCpa !== null && cur.conversions >= 5) {
    const expensive = enabled.filter((c) => c.conversions >= 2 && c.costPerConversion !== null && c.costPerConversion >= accountCpa * 1.5);
    if (expensive.length) {
      add({
        id: "high-cpa-campaigns",
        priority: "medium",
        kind: "fix",
        title: "Some campaigns pay much more per conversion",
        detail: `${expensive.map((c) => `${c.name} (${money(c.costPerConversion)})`).join(", ")} — the account average is ${money(accountCpa)}.`,
        actions: ["Set a target CPA near the account average.", "Tighten match types and add negatives.", "Split out the best-performing keywords into their own ad group."],
      });
    }
  }

  const budgetLimited = enabled.filter(
    (c) => (c.budgetLostShare ?? 0) >= HIGH_BUDGET_LOST && c.conversions > 0 && (accountCpa === null || (c.costPerConversion ?? Infinity) <= accountCpa * 1.1),
  );
  if (budgetLimited.length) {
    const c = budgetLimited[0];
    // Missed conversions ≈ conversions × (lost share ÷ won share), if the extra traffic converts at today's rate.
    const missed = budgetLimited.reduce((s, x) => s + (x.impressionShare ? (x.conversions * (x.budgetLostShare ?? 0)) / x.impressionShare : 0), 0);
    add({
      id: "budget-limited",
      priority: "high",
      kind: "opportunity",
      title: "Profitable campaigns are running out of budget",
      detail: `${list(budgetLimited.map((x) => x.name))} ${budgetLimited.length === 1 ? "misses" : "miss"} ${formatPercent(c.budgetLostShare, 0)}${budgetLimited.length > 1 ? " or more" : ""} of possible impressions because the daily budget runs out — while converting at or below the account's average cost.${missed >= 1 ? ` That's roughly ${formatNumber(missed, { decimals: 0 })} more conversions available at the current rate.` : ""}`,
      actions: [
        "Raise the daily budget on these campaigns (try +20–30% and watch cost per conversion).",
        "Fund it by cutting campaigns that spend without converting.",
        "Check the ad schedule: if budget runs out by midday, the afternoon customers never see the ads.",
      ],
    });
  }

  const rankLimited = enabled.filter((c) => (c.rankLostShare ?? 0) >= HIGH_RANK_LOST && c.clicks >= MIN_CAMPAIGN_CLICKS);
  if (rankLimited.length) {
    add({
      id: "rank-limited",
      priority: "medium",
      kind: "opportunity",
      title: "Ads lose auctions on ad rank",
      detail: `${list(rankLimited.map((c) => `${c.name} (${formatPercent(c.rankLostShare, 0)} lost)`))} — ads aren't shown because of low bids or low quality, not budget.`,
      actions: [
        "Improve ad relevance: put the keyword in headlines and match the landing page to the search.",
        "Add sitelink, callout and call assets — they raise ad rank at no extra cost.",
        "Raise bids (or the target CPA) moderately on the best-converting keywords.",
      ],
    });
  }

  /* ---------------------------- Account-wide rates --------------------------- */

  const searchCampaigns = enabled.filter((c) => c.channelType === "SEARCH");
  const search = searchCampaigns.reduce((t, c) => ({ clicks: t.clicks + c.clicks, impressions: t.impressions + c.impressions }), { clicks: 0, impressions: 0 });
  const searchCtr = search.impressions > 0 ? search.clicks / search.impressions : null;
  if (searchCtr !== null && search.impressions >= 1000 && searchCtr < LOW_SEARCH_CTR) {
    add({
      id: "low-ctr",
      priority: "medium",
      kind: "fix",
      title: "Search ads get few clicks for their views",
      detail: `Search click-through rate is ${formatPercent(searchCtr)}; well-targeted search ads usually reach 4–8%.`,
      actions: [
        "Rewrite headlines around the customer's need, price or offer, with a clear call to action.",
        "Use all 15 headlines and 4 descriptions in responsive search ads.",
        "Remove broad keywords that trigger ads for loosely related searches.",
      ],
    });
  }

  if (cur.conversionRate !== null && cur.clicks >= MIN_CLICKS_FOR_RATES && cur.conversions > 0 && cur.conversionRate < LOW_CONVERSION_RATE) {
    add({
      id: "low-conversion-rate",
      priority: "medium",
      kind: "fix",
      title: "The landing page converts few visitors",
      detail: `Only ${formatPercent(cur.conversionRate)} of clicks become conversions. Improving the page is usually the cheapest way to get more conversions from the same spend.`,
      actions: [
        "Send each ad group to the most relevant page, not the home page.",
        "Make the page load in under 3 seconds on mobile data.",
        "Put the offer, trust signals (reviews, clients) and a one-tap call/WhatsApp button above the fold.",
        "Shorten forms to name, phone and one question.",
      ],
    });
  }

  /* ------------------------------ Keyword rules ------------------------------ */

  const wasteThreshold = accountCpa !== null ? accountCpa * 1.5 : null;
  const wastedKeywords = keywords
    .filter((k) => k.conversions === 0 && k.clicks >= 10 && (wasteThreshold === null ? k.cost > 0 : k.cost >= wasteThreshold))
    .sort((a, b) => b.cost - a.cost);
  if (wastedKeywords.length && cur.conversions > 0) {
    const spend = wastedKeywords.reduce((s, k) => s + k.cost, 0);
    add({
      id: "wasted-keywords",
      priority: spend >= cur.cost * 0.1 ? "high" : "medium",
      kind: "fix",
      title: `${wastedKeywords.length} keyword${wastedKeywords.length === 1 ? "" : "s"} spent ${money(spend)} with no conversions`,
      detail: `In the last 30 days: ${list(wastedKeywords.map((k) => `${k.text} – ${money(k.cost)}`))}.`,
      actions: ["Pause these keywords or lower their bids.", "Check their search terms for irrelevant queries and add negatives.", "Try a more specific phrase-match version instead."],
    });
  }

  const lowQuality = keywords.filter((k) => k.qualityScore !== null && k.qualityScore <= LOW_QUALITY_SCORE && k.impressions >= 100).sort((a, b) => b.cost - a.cost);
  if (lowQuality.length) {
    add({
      id: "low-quality-score",
      priority: "low",
      kind: "fix",
      title: `${lowQuality.length} keyword${lowQuality.length === 1 ? " has" : "s have"} a low Quality Score`,
      detail: `${list(lowQuality.map((k) => `${k.text} (${k.qualityScore}/10)`))}. Low Quality Score raises the cost of every click.`,
      actions: ["Group these keywords into tighter ad groups with ads that repeat the keyword.", "Make sure the landing page talks about exactly what was searched."],
    });
  }

  /* --------------------------- Budget & scaling --------------------------- */

  if (input.monthlyBudget && input.projectedMonthSpend) {
    const pace = input.projectedMonthSpend / input.monthlyBudget;
    if (pace >= 1.1) {
      add({
        id: "overspending",
        priority: "high",
        kind: "watch",
        title: "On track to overspend this month's budget",
        detail: `Projected spend is ${money(input.projectedMonthSpend)} against an agreed ${money(input.monthlyBudget)} (${formatPercent(pace, 0)}).`,
        actions: ["Lower daily budgets so the rest of the month fits the plan.", "Agree a revised budget with the client if results justify it."],
      });
    } else if (pace <= 0.8) {
      add({
        id: "underspending",
        priority: "low",
        kind: "opportunity",
        title: "This month's budget won't be fully used",
        detail: `Projected spend is ${money(input.projectedMonthSpend)} of ${money(input.monthlyBudget)} (${formatPercent(pace, 0)}).`,
        actions: ["Raise budgets on the campaigns with the best cost per conversion.", "Broaden reach with new keywords or locations that match converting ones."],
      });
    }
  }

  const winners = enabled
    .filter((c) => c.conversions >= 3 && accountCpa !== null && c.costPerConversion !== null && c.costPerConversion <= accountCpa * 0.8)
    .sort((a, b) => (a.costPerConversion ?? 0) - (b.costPerConversion ?? 0));
  if (winners.length && !budgetLimited.some((b) => b.campaignId === winners[0].campaignId)) {
    const w = winners[0];
    add({
      id: "scale-winner",
      priority: "low",
      kind: "opportunity",
      title: `Scale “${w.name}”`,
      detail: `This ${channelLabel(w.channelType)} campaign converts at ${money(w.costPerConversion)} — ${formatPercent(1 - (w.costPerConversion ?? 0) / (accountCpa ?? 1), 0)} cheaper than the account average.`,
      actions: ["Give it a bigger share of the budget.", "Add closely related keywords and test similar audiences.", "Reuse its best ad copy in other campaigns."],
    });
  }

  return out.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
