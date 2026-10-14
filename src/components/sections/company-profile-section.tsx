import { companyProfile } from "@/content/company-profile";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { Flipbook } from "./flipbook";

/** The company profile brochure as a page-turning book. */
export function CompanyProfileSection({
  eyebrow = "Company profile",
  title = "Flip through our company profile",
  intro = "Who we are, what we build and how we work — all in one place. Click or swipe to turn the pages.",
  tone = "muted",
  headingId = "company-profile-heading",
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  tone?: "canvas" | "muted";
  headingId?: string;
}) {
  return (
    <Section tone={tone} labelledBy={headingId}>
      <SectionHeading id={headingId} eyebrow={eyebrow} title={title} intro={intro} align="center" />
      <Flipbook
        className="mt-10 lg:mt-14"
        pages={companyProfile.pages}
        pageWidth={companyProfile.pageWidth}
        pageHeight={companyProfile.pageHeight}
        title={companyProfile.title}
      />
    </Section>
  );
}
