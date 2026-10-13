import { siteConfig } from "@/config/site";
import { quoteServiceOptions } from "@/content/form-options";
import { pageMetadata } from "@/lib/seo";
import { FormPageLayout } from "@/components/forms/form-page-layout";
import { QueryLeadForm } from "@/components/forms/query-lead-form";

const free = siteConfig.offersFreeConsultation;

export const metadata = pageMetadata({
  title: free ? "Get a Quote or Free Consultation" : "Get a Quote",
  description:
    "Request a quote for business software, website development, SEO, Google Ads or social media marketing. Clear written proposals with no hidden costs.",
  path: "/request-quote/",
});

export default function RequestQuotePage() {
  return (
    <FormPageLayout
      crumbs={[{ name: "Get a Quote", path: "/request-quote/" }]}
      eyebrow={free ? "Quote & free consultation" : "Get a quote"}
      title="Tell us what you need — we'll recommend the best way forward"
      intro="Whether it's software, a new website or more leads from marketing, share a few details and we'll come back with practical recommendations."
      points={[
        "We review your request and may ask a few quick questions.",
        free ? "We talk through your goals in a free consultation." : "We talk through your goals and options.",
        "You receive a written proposal with scope, timelines and costs.",
      ]}
    formTitle="Request a quote"
    >
      <QueryLeadForm param="service" type="quote" serviceOptions={quoteServiceOptions()} />
    </FormPageLayout>
  );
}
