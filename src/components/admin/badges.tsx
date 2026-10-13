import { Badge, type BadgeTone } from "@/components/ui/primitives";
import { enquiryTypeLabels, leadStatusLabels, type LeadStatusValue } from "@/lib/leads/labels";

const statusTones: Record<LeadStatusValue, BadgeTone> = {
  new: "amber",
  contacted: "navy",
  qualified: "teal",
  proposal_sent: "teal",
  won: "green",
  lost: "gray",
};

export function LeadStatusBadge({ status }: { status: LeadStatusValue }) {
  return <Badge tone={statusTones[status]}>{leadStatusLabels[status]}</Badge>;
}

export function EnquiryTypeLabel({ type }: { type: keyof typeof enquiryTypeLabels }) {
  return <span className="text-sm text-ink">{enquiryTypeLabels[type]}</span>;
}
