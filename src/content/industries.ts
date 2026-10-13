import type { IconName } from "@/components/ui/icon";
import type { FAQ, Photo } from "./types";

export type Industry = {
  slug: string;
  name: string;
  icon: IconName;
  image: Photo;
  summary: string;
  challenges: string[];
  products: string[]; // product slugs
  services: string[]; // service slugs
};

export const industries: Industry[] = [
  {
    slug: "education",
    name: "Schools & Education",
    icon: "school",
    image: { src: "/images/school-books.webp", alt: "Graduation cap on a stack of books with pencils, a diploma and an apple in front of a chalkboard" },
    summary: "Run admissions, fees, assessments and parent communication for CBC schools — without the paperwork.",
    challenges: ["Fee collection and balances", "CBC assessment records", "Term-end learner reports", "Parent communication", "Enrolment marketing"],
    products: ["school-management-system-kenya"],
    services: ["website-design-kenya", "social-media-marketing-kenya"],
  },
  {
    slug: "healthcare",
    name: "Hospitals & Clinics",
    icon: "hospital",
    image: { src: "/images/healthcare-nurse.jpg", alt: "Smiling nurse in scrubs with a stethoscope" },
    summary: "Improve patient flow and billing while keeping health information secure.",
    challenges: ["Queues and patient flow", "Billing accuracy", "Pharmacy and lab coordination", "Access to sensitive records"],
    products: ["hospital-management-system-kenya", "inventory-management-software-kenya"],
    services: ["website-design-kenya", "seo-services-kenya"],
  },
  {
    slug: "hospitality",
    name: "Restaurants & Hospitality",
    icon: "restaurant",
    image: { src: "/images/restaurant-kitchen.jpg", alt: "Chef cooking over a flaming pan in a restaurant kitchen" },
    summary: "Take orders, bill accurately and close every shift with confidence.",
    challenges: ["Order mistakes", "Billing accuracy", "Cash-up at the end of a shift", "Getting found online"],
    products: ["restaurant-management-system-kenya", "pos-system-kenya"],
    services: ["social-media-marketing-kenya", "website-design-kenya"],
  },
  {
    slug: "retail",
    name: "Retail & Wholesale",
    icon: "pos",
    image: { src: "/images/retail.jpg", alt: "Supermarket aisle stocked with products" },
    summary: "Sell faster, control stock and grow online.",
    challenges: ["Checkout speed", "Stock accuracy and losses", "Reordering", "Selling online"],
    products: ["pos-system-kenya", "inventory-management-software-kenya"],
    services: ["ecommerce-website-development", "social-media-marketing-kenya"],
  },
  {
    slug: "smes",
    name: "SMEs & Professional Services",
    icon: "business",
    image: { src: "/images/hero-team.jpg", alt: "Team working together at computers" },
    summary: "Look professional online and generate a steady flow of enquiries.",
    challenges: ["Being found online", "Turning visitors into leads", "Running campaigns profitably"],
    products: ["business-management-software-kenya"],
    services: ["seo-services-kenya", "google-ads-management-kenya", "conversion-rate-optimization"],
  },
];

export const homeFaqs: FAQ[] = [
  {
    question: "What does Mavqo Digital do?",
    answer:
      "We help organizations run better and grow online. We provide business management software (for schools, hospitals and clinics, restaurants, retail and more), build websites and online stores, and run digital marketing such as SEO, Google Ads and social media.",
  },
  {
    question: "Can I see the software before buying?",
    answer:
      "Yes. Request a demo and we'll walk you through the system live, using sample data, focused on how your organization works.",
  },
  {
    question: "How much do your services cost?",
    answer:
      "Pricing depends on what you need — modules and users for software, scope for websites, and the level of ongoing work for marketing. Request a quote and we'll send a clear written proposal.",
  },
  {
    question: "Do you guarantee search rankings?",
    answer:
      "No. No one controls search engine rankings, so we don't make promises we can't keep. We focus on proven work and report transparently on the results, including the enquiries it generates.",
  },
  {
    question: "Do you work with businesses outside Nairobi?",
    answer:
      "Yes. We work with organizations across Kenya. Demos, consultations and much of our support can be done remotely.",
  },
];

/** Shared option lists used by forms, validation and the admin inbox. */
export const leadOptions = {
  preferredContact: [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone call" },
    { value: "whatsapp", label: "WhatsApp" },
  ],
  organizationSize: [
    { value: "1-10", label: "1–10 people" },
    { value: "11-50", label: "11–50 people" },
    { value: "51-200", label: "51–200 people" },
    { value: "201+", label: "201+ people" },
  ],
  budgetRange: [
    { value: "under-50k", label: "Under KES 50,000" },
    { value: "50k-150k", label: "KES 50,000 – 150,000" },
    { value: "150k-500k", label: "KES 150,000 – 500,000" },
    { value: "500k+", label: "Over KES 500,000" },
    { value: "not-sure", label: "Not sure yet" },
  ],
  timeline: [
    { value: "asap", label: "As soon as possible" },
    { value: "1-3-months", label: "Within 1–3 months" },
    { value: "3-6-months", label: "In 3–6 months" },
    { value: "exploring", label: "Just exploring" },
  ],
} as const;
