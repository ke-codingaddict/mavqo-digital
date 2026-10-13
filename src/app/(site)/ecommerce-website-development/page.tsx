import { notFound } from "next/navigation";
import { getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/services/service-page";

const SLUG = "ecommerce-website-development";
const service = getService(SLUG);

export const metadata = service
  ? pageMetadata({ title: service.seoTitle, description: service.seoDescription, path: service.href })
  : {};

export default function EcommercePage() {
  if (!service) notFound();
  return <ServicePage service={service} crumbs={[{ name: service.name, path: service.href }]} />;
}
