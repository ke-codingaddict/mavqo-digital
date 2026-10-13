import Link from "next/link";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/sections/legal-page";

/* ⚠️ DRAFT — have this reviewed by a qualified advisor before launch (spec §13.3). */

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: `Terms governing the use of the ${siteConfig.name} website.`,
  path: "/terms-of-service/",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-10-13" crumbs={[{ name: "Terms of Service", path: "/terms-of-service/" }]}>
      <p>
        These terms govern your use of the {siteConfig.name} website. By using this website you agree to them. Our software,
        website and marketing services are provided under separate written agreements, which take precedence over these terms
        for those services.
      </p>

      <h2>Information on this website</h2>
      <p>
        We work to keep the information on this website accurate and up to date. Product features, availability and service
        details are described in good faith but may change. The specific scope, deliverables and pricing of any engagement
        are set out in your written proposal or agreement.
      </p>

      <h2>No guaranteed results</h2>
      <p>
        Marketing results depend on many factors outside our control, including search engine and advertising platform
        algorithms, competition and market conditions. We do not guarantee specific rankings, traffic, leads or sales.
      </p>

      <h2>Enquiries and demos</h2>
      <p>
        Submitting an enquiry, requesting a quote or attending a demo does not create a contract or any obligation to buy.
        Demonstrations use sample data only.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the website for any unlawful purpose;</li>
        <li>submit false, misleading or spam enquiries;</li>
        <li>attempt to gain unauthorized access to any part of the website or its systems; or</li>
        <li>interfere with the website&apos;s security or operation.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The content, design, logos and software on this website belong to {siteConfig.legalName} or its licensors. You may not
        copy or reuse them without our written permission, except for personal, non-commercial reference.
      </p>

      <h2>Third-party links</h2>
      <p>This website may link to third-party websites. We are not responsible for their content or privacy practices.</p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of this
        website.
      </p>

      <h2>Privacy</h2>
      <p>
        Our use of personal data is described in our <Link href="/privacy-policy/">Privacy Policy</Link>.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya.</p>

      <h2>Changes</h2>
      <p>We may update these terms from time to time. The date at the top of this page shows when they were last changed.</p>
    </LegalPage>
  );
}
