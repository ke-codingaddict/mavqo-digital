export const enquiryTypeLabels = {
  contact: "Contact",
  demo: "Demo request",
  quote: "Quote request",
  marketing: "Marketing consultation",
  waitlist: "Early-access waitlist",
} as const;

export const leadStatusLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
} as const;

export type LeadStatusValue = keyof typeof leadStatusLabels;
export const LEAD_STATUSES = Object.keys(leadStatusLabels) as LeadStatusValue[];

/** Conversion event names sent to analytics (spec §12). */
export const conversionEvents = {
  contact: "contact_form_submitted",
  demo: "demo_request_submitted",
  quote: "quote_request_submitted",
  marketing: "quote_request_submitted",
  waitlist: "waitlist_joined",
} as const;
