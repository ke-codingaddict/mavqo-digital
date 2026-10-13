import Link from "next/link";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/sections/legal-page";

/*
 * ⚠️ DRAFT — have this reviewed by a qualified advisor before launch (spec §13.3).
 * It describes what this website actually does today. Update it whenever you add
 * a new tool, processor or purpose (e.g. a CRM, Meta Pixel or WhatsApp Business API).
 */

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects personal data submitted through this website.`,
  path: "/privacy-policy/",
});

export default function PrivacyPolicyPage() {
  const { email } = siteConfig.contact;
  const contact = email ? <a href={`mailto:${email}`}>{email}</a> : <Link href="/contact/">our contact form</Link>;

  return (
    <LegalPage title="Privacy Policy" updated="2026-10-13" crumbs={[{ name: "Privacy Policy", path: "/privacy-policy/" }]}>
      <p>
        {siteConfig.legalName} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what personal data we
        collect through this website, why we collect it, and the rights you have under Kenya&apos;s Data Protection Act, 2019.
      </p>

      <h2>Information we collect</h2>
      <h3>Information you give us</h3>
      <p>When you request a demo, a quote or a consultation, or send us a message, we collect the details you enter, such as:</p>
      <ul>
        <li>your name, email address and/or phone number;</li>
        <li>your organization&apos;s name and size;</li>
        <li>the products or services you&apos;re interested in, your website address, budget range and timeline;</li>
        <li>any message you choose to send us; and</li>
        <li>your preferred contact method.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Campaign information:</strong> if you arrive from an advert or link containing campaign tags (such as UTM
          parameters), we record those tags and the page you submitted a form from, so we know which marketing is working.
        </li>
        <li>
          <strong>Security information:</strong> we store a one-way, salted hash of your IP address with form submissions to
          prevent spam and abuse. We do not store your IP address itself.
        </li>
        <li>
          <strong>Analytics cookies (only with your consent):</strong> if you accept cookies, we use Google Analytics and
          Google Ads measurement to understand how visitors use the site and measure our advertising. If you decline, these
          tools do not set analytics or advertising cookies.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>to respond to your enquiry and arrange demos, consultations or quotes;</li>
        <li>to prepare proposals and, if you become a client, to deliver our services;</li>
        <li>to understand and improve our website and marketing; and</li>
        <li>to protect our website against spam and misuse.</li>
      </ul>
      <p>
        We rely on your consent (which you give when submitting a form) and our legitimate interest in responding to business
        enquiries and keeping our website secure. We do not sell your personal data, and we do not send names, contact
        details or messages to analytics or advertising platforms.
      </p>

      <h2>Who we share it with</h2>
      <p>We share personal data only with service providers who help us run this website and respond to you, such as:</p>
      <ul>
        <li>our website hosting and database providers;</li>
        <li>our email delivery provider, which sends enquiry notifications and confirmations; and</li>
        <li>Google, for analytics and advertising measurement, only if you accept cookies.</li>
      </ul>
      <p>
        Some of these providers may process data outside Kenya. Where this happens, we take steps to ensure appropriate
        safeguards are in place as required by the Data Protection Act.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiry records for as long as needed to respond to you and manage any resulting business relationship, and
        then delete or anonymize them in line with our retention schedule. If you would like your enquiry deleted sooner, contact us.
      </p>

      <h2>How we protect it</h2>
      <p>
        Data is encrypted in transit, access to enquiry records is restricted to authorized staff, and administrative actions
        are logged. No system is completely secure, but we work to protect your information.
      </p>

      <h2>Your rights</h2>
      <p>Under the Data Protection Act, 2019 you have the right to:</p>
      <ul>
        <li>be informed of how your data is used;</li>
        <li>access the personal data we hold about you;</li>
        <li>ask us to correct or delete inaccurate or unnecessary data;</li>
        <li>object to processing of your data; and</li>
        <li>withdraw consent at any time.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us via {contact}. If you are not satisfied with our response, you may lodge a
        complaint with the Office of the Data Protection Commissioner (ODPC).
      </p>

      <h2>Cookies</h2>
      <p>
        Analytics and advertising cookies are only used if you click &quot;Accept&quot; on our cookie banner. To change your
        choice, clear this site&apos;s data in your browser and the banner will appear again.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. The date at the top of this page shows when it was last changed.</p>
    </LegalPage>
  );
}
