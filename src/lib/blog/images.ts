/** Blog cover images: pick a site photo, or upload one (stored in the database). */

export { sniffLogoType as sniffImageType } from "@/lib/google-ads/logo";

export const COVER_MAX_BYTES = 4 * 1024 * 1024;
export const COVER_ACCEPT = "image/png,image/jpeg,image/webp";

const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Photos already on the site (public/images) that work as article covers. */
export const SITE_IMAGES: { src: string; label: string; alt: string }[] = [
  { src: "/images/hero-team.webp", label: "Team at computers", alt: "Team of colleagues working together at computers in a modern office" },
  { src: "/images/about-team.webp", label: "Colleagues reviewing a plan", alt: "Two colleagues reviewing a business plan together at a desk" },
  { src: "/images/business.webp", label: "Small-business owner", alt: "Smiling small-business owner in an apron in her plant shop" },
  { src: "/images/seo.webp", label: "Analytics dashboard", alt: "Laptop showing a sales analytics dashboard on an office desk" },
  { src: "/images/google-ads.webp", label: "Campaign planning", alt: "Two colleagues planning a campaign with sticky notes on a glass wall" },
  { src: "/images/social.webp", label: "Laptop and smartphone", alt: "Two young professionals working together on a laptop and smartphone in a café" },
  { src: "/images/cro.webp", label: "Wireframe sketching", alt: "Designer sketching website wireframes on a whiteboard" },
  { src: "/images/web-design.webp", label: "Developer coding", alt: "Developer writing code at a desktop computer in a modern office" },
  { src: "/images/ecommerce.webp", label: "Online-shop owner", alt: "Smiling online-shop owner on a phone call, surrounded by parcels ready to ship" },
  { src: "/images/school-student.webp", label: "Student writing", alt: "Schoolgirl writing in her exercise book with a pencil at her desk" },
  { src: "/images/school-books.webp", label: "Graduation cap and books", alt: "Graduation cap on a stack of books with pencils, a diploma and an apple in front of a chalkboard" },
  { src: "/images/hospital-doctor.webp", label: "Clinic desk", alt: "Healthcare worker in scrubs and a face mask working on a laptop at a clinic desk" },
  { src: "/images/healthcare-nurse.webp", label: "Health worker", alt: "Health worker in scrubs, a face mask and gloves with a stethoscope around her neck, arms crossed" },
  { src: "/images/restaurant-barista.webp", label: "Café order on tablet", alt: "Smiling café worker in an apron entering an order on a tablet at the counter" },
  { src: "/images/pos-cashier.webp", label: "Cashier at POS", alt: "Smiling cashier at a POS terminal in a café, holding a receipt" },
  { src: "/images/retail-pos.webp", label: "POS terminal", alt: "Touchscreen POS terminal on a wooden counter showing a product menu and order total" },
  { src: "/images/inventory-tablet.webp", label: "Warehouse stock levels", alt: "Tablet showing warehouse shelves with stock-level labels such as ready, running out of stock and out of stock" },
];

export const isSiteImage = (src: string) => SITE_IMAGES.some((i) => i.src === src);

/**
 * Public URL of an uploaded cover. The version is in the path (not a query
 * string) so browsers and next/image can cache each upload forever.
 */
export function coverUrl(post: { id: string; imageType: string | null; imageUpdatedAt: Date | null }): string | null {
  const ext = post.imageType ? extensions[post.imageType] : undefined;
  if (!ext) return null;
  return `/media/blog/${post.id}-${post.imageUpdatedAt?.getTime() ?? 0}.${ext}`;
}

/** Parses a cover file name from coverUrl back into the post id. */
export function parseCoverFile(file: string): { id: string } | null {
  const m = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-\d+\.(?:png|jpg|webp)$/.exec(file);
  return m ? { id: m[1] } : null;
}
