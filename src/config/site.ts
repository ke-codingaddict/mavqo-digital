/**
 * Central business details. Edit this file to change contact details,
 * social links and navigation across the whole site.
 *
 * Contact fields left as `null` are hidden everywhere (header, footer,
 * contact page, WhatsApp button, structured data), so nothing unverified
 * is ever published.
 */

export const siteConfig = {
  name: "Mavqo Digital",
  legalName: "Mavqo Digital", // TODO: replace with the registered business name
  tagline: "Build Smarter. Grow Faster.",
  description:
    "Business management software, website development and digital marketing services that help Kenyan organizations run better and grow online.",
  /** Canonical origin. Set APP_BASE_URL in production; this is only the fallback. */
  url: (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_KE",
  country: "Kenya",

  contact: {
    /** e.g. "hello@mavqodigital.co.ke" — only once the domain's mailbox is live */
    email: "sales@mavqo.ke" as string | null,
    /** International format, e.g. "+254712345678" */
    phone: "+254718701033" as string | null,
    /** How `phone` is shown to visitors (the raw `phone` is used for tel: links). */
    phoneDisplay: "+254 718 701 033",
    /** WhatsApp number in international format without "+", e.g. "254712345678" */
    whatsapp: "254718701033" as string | null,
    /** e.g. "Nairobi, Kenya" — only a location you actually operate from */
    location: null as string | null,
    businessHours: "Office visits Mon–Sat · Online support every day" as string | null,
  },

  social: {
    linkedin: null as string | null,
    facebook: null as string | null,
    instagram: null as string | null,
    x: null as string | null,
    youtube: null as string | null,
  },

  /** Only true if a free first consultation is genuinely offered (spec §4.3). */
  offersFreeConsultation: true,
} as const;

export type NavItem = { label: string; href: string; description?: string };
export type NavGroup = { label: string; href: string; items?: NavItem[] };

export const mainNav: NavGroup[] = [
  { label: "Software", href: "/software/" },
  { label: "Digital Marketing", href: "/digital-marketing-kenya/" },
  {
    label: "Web Development",
    href: "/website-design-kenya/",
    items: [
      { label: "Website Design", href: "/website-design-kenya/", description: "Fast, professional business websites" },
      { label: "E-commerce Development", href: "/ecommerce-website-development/", description: "Online stores that are easy to run" },
    ],
  },
  { label: "Industries", href: "/industries/" },
  { label: "Resources", href: "/blog/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
];

export function whatsappLink(message?: string): string | null {
  const number = siteConfig.contact.whatsapp;
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}
