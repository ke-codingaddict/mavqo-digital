import Image from "next/image";
import { Compass, Eye, ShieldCheck, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { ArrowIcon, ButtonLink } from "@/components/ui/button";
import { Section, SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/sections/page-hero";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Mavqo Digital helps Kenyan organizations run better and grow online with business management software, website development and digital marketing.",
  path: "/about/",
});

// TODO: add your founding story, team photos and location once you're ready to publish them.
const values = [
  { icon: Eye, title: "Honesty first", text: "We only promise what we can deliver — and we'll tell you when something isn't the right fit." },
  { icon: Users, title: "Built for real people", text: "Software and websites only matter if people use them, so we design for the people doing the work." },
  { icon: ShieldCheck, title: "Respect for data", text: "We treat your information, and your customers', with care — in line with Kenya's Data Protection Act." },
  { icon: Compass, title: "Measured results", text: "We focus on outcomes you can see: time saved, enquiries generated, revenue grown." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: "About", path: "/about/" }]}
        eyebrow="About Mavqo Digital"
        title={
          <>
            Build smarter. <span className="highlight">Grow faster.</span>
          </>
        }
        intro="We're a technology company helping Kenyan organizations improve how they operate and grow online — with practical business software, professional websites and results-focused marketing."
        image={{ src: "/images/about-team.jpg", alt: "Two colleagues discussing a project at a desk" }}
      />
      <Section labelledBy="mission-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeading id="mission-heading" eyebrow="Why we exist" title="Two problems. One partner." />
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              Many organizations still run on paper, spreadsheets and disconnected tools — while their customers increasingly
              search, compare and buy online.
            </p>
            <p>
              <strong className="text-heading">On the operations side</strong>, our management systems help schools, healthcare
              facilities, restaurants and businesses replace manual processes with software that saves time and improves accuracy.
            </p>
            <p>
              <strong className="text-heading">On the growth side</strong>, our web and marketing services help the same
              organizations get found, make a strong first impression and turn interest into enquiries.
            </p>
          </div>
        </div>
      </Section>
      <Section tone="muted" labelledBy="values-heading">
        <SectionHeading id="values-heading" eyebrow="Our values" title="How we work" />
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: I, title, text }) => (
            <li key={title} className="border-t-2 border-heading pt-6">
              <I aria-hidden="true" className="size-6 text-teal-ink" />
              <h3 className="mt-4 text-lg font-bold text-heading">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section labelledBy="cta-heading">
        <div className="grid items-center gap-10 overflow-hidden rounded-[var(--radius-xl)] bg-inverse lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <h2 id="cta-heading" className="text-h2 !text-on-inverse">
              Let&apos;s build something that works for you
            </h2>
            <p className="text-lead mt-4 text-on-inverse-soft">
              {siteConfig.offersFreeConsultation ? "Start with a free, no-obligation conversation." : "Start with a short conversation about your goals."}
            </p>
            <ButtonLink href="/request-quote/" variant="accent" size="lg" className="mt-8">
              Talk to us <ArrowIcon />
            </ButtonLink>
          </div>
          <div className="relative hidden aspect-[4/3] h-full lg:block">
            <Image src="/images/social.jpg" alt="" fill sizes="45vw" className="object-cover" />
          </div>
        </div>
      </Section>
    </>
  );
}
