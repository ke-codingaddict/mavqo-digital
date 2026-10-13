import { siteConfig, whatsappLink } from "@/config/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ContactWidgets } from "@/components/layout/contact-widgets";
import { Analytics } from "@/components/analytics/analytics";
import { JsonLd } from "@/components/seo/json-ld";

// Only well-formed tag IDs are ever interpolated into the gtag script.
const gaId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "")
  ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  : undefined;
const adsId = /^AW-\d+$/.test(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "") ? process.env.NEXT_PUBLIC_GOOGLE_ADS_ID : undefined;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="pb-16 lg:pb-0">
        {children}
      </main>
      <SiteFooter />
      <ContactWidgets
        whatsappHref={whatsappLink("Hi Mavqo Digital, I'd like to know more about your services.")}
        phone={siteConfig.contact.phone}
      />
      <Analytics measurementId={gaId} adsId={adsId} />
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
    </>
  );
}
