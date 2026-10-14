/**
 * The company profile brochure, shown as a flipbook. The PDF itself is not published.
 *
 * Page images are rendered from the source PDF at 150 dpi (1242×1756 WebP). When the
 * brochure changes, re-export the pages with the same names and update the
 * alt text below so it still describes each page.
 */

export const companyProfile = {
  title: "Mavqo Digital Company Profile 2026",
  /** Intrinsic page size, used for the aspect ratio. */
  pageWidth: 1242,
  pageHeight: 1756,
  pages: [
    "Cover: Software, websites and marketing. Build smarter, grow faster — one partner for Kenyan schools, clinics, restaurants and shops.",
    "Who we are: one team for your systems, your website and your growth, with the company at a glance.",
    "About us: built for how Kenyan businesses really work — our mission, vision and four values.",
    "What we do: business software, websites and digital marketing, working on their own or together.",
    "Our software: school, hospital, restaurant, point of sale and inventory systems, each with a live demo.",
    "Integrations: M-Pesa, KRA eTIMS, SHA, card payments, bulk SMS, WhatsApp, email, Google and accounting export.",
    "Websites and digital marketing: sites that turn visitors into calls, and Google Ads managed every week.",
    "Who we serve and how we work: the sectors we help and our seven-step process from consultation to support.",
    "Why choose Mavqo Digital: seven reasons clients choose us, plus support and data care.",
    "Frequently asked questions about cost, setup time, equipment, data migration, training and integrations.",
    "Let's talk: book a free demo by phone, WhatsApp or email.",
  ].map((alt, i) => ({
    src: `/company-profile/page-${String(i + 1).padStart(2, "0")}.webp`,
    alt: `Page ${i + 1}. ${alt}`,
  })),
} as const;

export type ProfilePage = (typeof companyProfile.pages)[number];
