import { demoProductOptions } from "@/content/form-options";
import { pageMetadata } from "@/lib/seo";
import { FormPageLayout } from "@/components/forms/form-page-layout";
import { QueryLeadForm } from "@/components/forms/query-lead-form";

export const metadata = pageMetadata({
  title: "Request a Software Demo",
  description:
    "Book a live demo of Mavqo Digital's school, hospital, restaurant, POS or inventory management software — tailored to your organization, with sample data.",
  path: "/request-demo/",
});

export default function RequestDemoPage() {
  return (
    <FormPageLayout
      crumbs={[{ name: "Request a Demo", path: "/request-demo/" }]}
      eyebrow="Live demo"
      title="See the software working for an organization like yours"
      intro="Tell us a little about your organization and we'll arrange a live walkthrough at a time that suits you."
      points={[
        "We'll contact you to confirm a convenient time.",
        "Your demo is tailored to your workflows, using sample data.",
        "You'll get a clear written quote afterwards — with no obligation.",
      ]}
    formTitle="Request your demo"
    >
      <QueryLeadForm param="product" type="demo" productOptions={demoProductOptions()} />
    </FormPageLayout>
  );
}
