import { pageMetadata } from "@/lib/seo";
import { companyProfile } from "@/content/company-profile";
import { Container } from "@/components/ui/primitives";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/sections/breadcrumbs";
import { Flipbook } from "@/components/sections/flipbook";

export const metadata = pageMetadata({
  title: "Company Profile",
  description:
    "Flip through the Mavqo Digital company profile: our business software, websites, digital marketing, integrations and how we work with Kenyan businesses.",
  path: "/company-profile/",
});

export default function CompanyProfilePage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <Container>
        <Breadcrumbs crumbs={[{ name: "Company profile", path: "/company-profile/" }]} />
        <div className="mx-auto mt-8 max-w-2xl text-center sm:mt-12">
          <p className="kicker justify-center">Company profile 2026</p>
          <h1 className="text-h1 mt-4">Get to know Mavqo Digital</h1>
          <p className="text-lead mt-5 text-ink-soft">
            Click or swipe to turn the pages, or use your arrow keys.
          </p>
        </div>

        <Flipbook
          className="mt-10 lg:mt-12"
          pages={companyProfile.pages}
          pageWidth={companyProfile.pageWidth}
          pageHeight={companyProfile.pageHeight}
          title={companyProfile.title}
        />

        <div className="mt-14 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/request-demo/" size="lg">
            Book a free demo <ArrowIcon />
          </ButtonLink>
          <ButtonLink href="/contact/" variant="secondary" size="lg">
            Contact us
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
