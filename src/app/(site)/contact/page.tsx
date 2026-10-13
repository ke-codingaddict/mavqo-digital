import { pageMetadata } from "@/lib/seo";
import { FormPageLayout } from "@/components/forms/form-page-layout";
import { LeadForm } from "@/components/forms/lead-form";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Mavqo Digital about business software, websites or digital marketing. We'll get back to you promptly.",
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <FormPageLayout
      crumbs={[{ name: "Contact", path: "/contact/" }]}
      eyebrow="Contact us"
      title="Let's talk"
      intro="Have a question about our software, websites or marketing services? Send us a message and the right person will get back to you."
      points={[
        "Your message goes straight to our team.",
        "We reply using your preferred contact method.",
        "Looking for a demo or quote? Use those forms for a faster response.",
      ]}
    formTitle="Send us a message"
    >
      <LeadForm type="contact" />
    </FormPageLayout>
  );
}
