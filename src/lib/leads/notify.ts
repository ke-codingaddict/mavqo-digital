import "server-only";
import { db } from "@/lib/db";
import { getServerEnv, isEmailConfigured } from "@/lib/env";
import { escapeHtml, sendEmail } from "@/lib/email/send";
import { enquiryTypeLabels } from "@/lib/leads/labels";
import { siteConfig } from "@/config/site";
import type { Lead } from "@/generated/prisma/client";

const fieldLabels: [keyof Lead, string][] = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["organization", "Organization"],
  ["preferredContact", "Preferred contact"],
  ["productInterest", "Product"],
  ["serviceInterest", "Service"],
  ["organizationSize", "Organization size"],
  ["websiteUrl", "Website"],
  ["objective", "Main objective"],
  ["budgetRange", "Budget"],
  ["timeline", "Timeline"],
  ["message", "Message"],
  ["sourcePage", "Submitted from"],
  ["utmSource", "UTM source"],
  ["utmMedium", "UTM medium"],
  ["utmCampaign", "UTM campaign"],
];

/** Strips line breaks and other control characters so user input can't reshape a subject line. */
function oneLine(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/**
 * Greeting for the auto-reply. The form lets anyone send this email to any
 * address, so the name must not be usable to carry links or spam text.
 */
export function greetingName(name: string) {
  const first = oneLine(name).split(" ")[0] ?? "";
  return first.length <= 30 && /^[\p{L}\p{M}'’-]+$/u.test(first) ? first : "there";
}

/**
 * Notifies the team about a stored lead and sends the enquirer a confirmation.
 * Runs after the response is sent; a failure here never loses the lead — the
 * lead simply stays un-notified (`notifiedAt = null`) and shows in the admin inbox.
 */
export async function notifyNewLead(lead: Lead) {
  const env = getServerEnv();
  if (!isEmailConfigured(env)) {
    console.warn(`[leads] ${lead.reference} stored; email notifications are not configured`);
    return;
  }

  const type = enquiryTypeLabels[lead.enquiryType];
  const rows = fieldLabels.filter(([key]) => lead[key]).map(([key, label]) => [label, String(lead[key])]);
  const adminUrl = `${env.APP_BASE_URL}/admin/leads/${lead.id}/`;

  const team = await sendEmail({
    to: env.LEAD_NOTIFICATION_EMAIL!.split(",").map((s) => s.trim()),
    subject: oneLine(`New ${type.toLowerCase()} — ${lead.name}${lead.organization ? ` (${lead.organization})` : ""} [${lead.reference}]`),
    replyTo: lead.email ?? undefined,
    text: [`${type} ${lead.reference}`, "", ...rows.map(([l, v]) => `${l}: ${v}`), "", `Open in admin: ${adminUrl}`].join("\n"),
    html: `<h2 style="font-family:sans-serif">${escapeHtml(type)} <small>${lead.reference}</small></h2>
<table style="font-family:sans-serif;border-collapse:collapse">${rows
      .map(([l, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555;vertical-align:top">${escapeHtml(l)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`)
      .join("")}</table>
<p style="font-family:sans-serif"><a href="${adminUrl}">Open in admin</a></p>`,
  });

  if (team.ok) {
    await db().lead.update({ where: { id: lead.id }, data: { notifiedAt: new Date() } });
  } else {
    console.error(`[leads] team notification failed for ${lead.reference} (${team.reason})`);
  }

  if (lead.email) {
    const firstName = greetingName(lead.name);
    await sendEmail({
      to: lead.email,
      subject: `We've received your enquiry — ${siteConfig.name}`,
      text: [
        `Hi ${firstName},`,
        "",
        `Thanks for contacting ${siteConfig.name}. We've received your ${type.toLowerCase()} and a member of our team will be in touch soon.`,
        "",
        `Your reference: ${lead.reference}`,
        "",
        `— The ${siteConfig.name} team`,
        siteConfig.url,
      ].join("\n"),
    });
  }
}
