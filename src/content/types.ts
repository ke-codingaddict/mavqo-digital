import type { IconName } from "@/components/ui/icon";

export type ProductStatus =
  | "planned"
  | "in_development"
  | "available_for_demo"
  | "available_for_sale"
  | "maintenance";

export type PricingModel = "subscription" | "licence" | "custom_quote";

export type FAQ = { question: string; answer: string };

export type Feature = { title: string; description: string };

export type Photo = { src: string; alt: string; /** CSS object-position focal point, e.g. "50% 30%" */ position?: string };

export type Product = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  icon: IconName;
  /** Hero/card photograph. */
  image: Photo;
  /** Optional different photo for the homepage product showcase. */
  showcaseImage?: Photo;
  industry: string;
  summary: string;
  description: string;
  /** Who the product is for (spec §6.7 item 2). */
  audience: string[];
  /** Problems it addresses (spec §6.7 item 3). */
  problems: string[];
  /** Verified features only (spec §6.7 item 4). */
  features: Feature[];
  /** Paths under /public. Empty → page invites visitors to a live demo instead. */
  screenshots: { src: string; alt: string }[];
  onboarding: string[];
  status: ProductStatus;
  demoAvailable: boolean;
  pricingModel: PricingModel;
  faqs: FAQ[];
  related: string[];
  seoTitle: string;
  seoDescription: string;
  published: boolean;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  /** Full path, since services live under different sections. */
  href: string;
  division: "digital_marketing" | "web_development";
  icon: IconName;
  image: Photo;
  summary: string;
  description: string;
  benefits: string[];
  deliverables: Feature[];
  process: { title: string; description: string }[];
  notes?: string[];
  faqs: FAQ[];
  seoTitle: string;
  seoDescription: string;
  published: boolean;
};

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: Photo;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  body: BlogBlock[];
  relatedHref: { label: string; href: string };
  seoTitle: string;
  seoDescription: string;
  published: boolean;
};
