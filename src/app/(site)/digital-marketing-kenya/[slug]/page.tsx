import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedServices, getService } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/services/service-page";

type Props = { params: Promise<{ slug: string }> };

function getMarketingService(slug: string) {
  const service = getService(slug);
  return service?.division === "digital_marketing" ? service : undefined;
}

export function generateStaticParams() {
  return getPublishedServices("digital_marketing").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getMarketingService((await params).slug);
  if (!service) return {};
  return pageMetadata({ title: service.seoTitle, description: service.seoDescription, path: service.href });
}

export default async function MarketingServicePage({ params }: Props) {
  const service = getMarketingService((await params).slug);
  if (!service) notFound();
  return (
    <ServicePage
      service={service}
      crumbs={[
        { name: "Digital Marketing", path: "/digital-marketing-kenya/" },
        { name: service.name, path: service.href },
      ]}
    />
  );
}
