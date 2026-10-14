import type { Service } from "./types";

/** Digital marketing & web development services (spec §7). */
export const services: Service[] = [
  {
    id: "svc_seo",
    name: "SEO Services",
    slug: "seo-services-kenya",
    href: "/digital-marketing-kenya/seo-services-kenya/",
    division: "digital_marketing",
    icon: "search",
    image: { src: "/images/seo.webp", alt: "Laptop showing a sales analytics dashboard on an office desk" },
    summary: "Get found by customers who are already searching for what you offer.",
    description:
      "Search engine optimization that starts with how your customers actually search, fixes what's holding your site back technically, and builds useful content that earns visibility over time.",
    benefits: [
      "More visibility for searches that lead to enquiries, not just traffic",
      "A technically healthy website that search engines can crawl and understand",
      "Content mapped to real customer questions and search intent",
      "Clear monthly reporting on impressions, clicks and leads",
    ],
    deliverables: [
      { title: "Technical SEO audit & fixes", description: "Crawlability, indexing, site speed, mobile usability and structured data." },
      { title: "Keyword & search-intent research", description: "The terms your customers use, mapped to the right pages." },
      { title: "On-page optimization", description: "Titles, descriptions, headings, internal links and content improvements." },
      { title: "Content planning", description: "A practical content calendar built around customer questions." },
      { title: "Local SEO", description: "Google Business Profile optimization and local visibility." },
      { title: "Performance monitoring", description: "Search Console tracking and monthly progress reports." },
    ],
    process: [
      { title: "Audit", description: "We review your site, competitors and current search performance." },
      { title: "Strategy", description: "We prioritize the fixes and content most likely to drive enquiries." },
      { title: "Implement", description: "We make the technical and on-page improvements and publish content." },
      { title: "Measure & refine", description: "We report monthly and adjust based on what the data shows." },
    ],
    notes: [
      "No one can honestly guarantee first-page rankings — and we won't. We focus on the work that improves your visibility and measure results transparently.",
    ],
    faqs: [
      { question: "How long does SEO take to show results?", answer: "It varies with your website's starting point, competition and how much work is needed. Technical fixes can help quickly; content and authority build over months. We'll set realistic expectations after the audit." },
      { question: "Do you guarantee first-page rankings?", answer: "No. Search engines control rankings, and anyone who guarantees them is overpromising. We commit to doing the right work and reporting honestly on progress." },
      { question: "Will you work on my existing website?", answer: "Yes. We work with most website platforms. If something can't be fixed on your current platform, we'll tell you and explain the options." },
    ],
    seoTitle: "SEO Services in Kenya",
    seoDescription:
      "SEO services for Kenyan businesses: technical SEO, keyword research, on-page optimization, local SEO and honest monthly reporting. Free consultation.",
    published: true,
  },
  {
    id: "svc_google_ads",
    name: "Google Ads Management",
    slug: "google-ads-management-kenya",
    href: "/digital-marketing-kenya/google-ads-management-kenya/",
    division: "digital_marketing",
    icon: "ads",
    image: { src: "/images/google-ads.webp", alt: "Two colleagues planning a campaign with sticky notes on a glass wall" },
    summary: "Pay-per-click campaigns built to generate leads, not just clicks.",
    description:
      "Google Ads and PPC management focused on qualified leads: tight targeting, compelling ads, landing pages that convert and conversion tracking that shows what your budget is really producing.",
    benefits: [
      "Ads shown to people actively searching for your services",
      "Conversion tracking so you know which campaigns produce leads",
      "Less wasted spend through search term and budget monitoring",
      "Transparent reporting you can understand",
    ],
    deliverables: [
      { title: "Campaign strategy", description: "Goals, targeting, budgets and campaign structure." },
      { title: "Keyword research", description: "High-intent keywords and negative keywords to cut waste." },
      { title: "Campaign set-up", description: "Search, Performance Max or other campaign types where appropriate." },
      { title: "Ad copywriting", description: "Clear, relevant ads with strong calls to action." },
      { title: "Landing page optimization", description: "Recommendations or builds that turn clicks into enquiries." },
      { title: "Conversion tracking", description: "Forms, calls and WhatsApp clicks tracked properly." },
      { title: "Search term analysis", description: "Ongoing review of what triggered your ads." },
      { title: "Performance reporting", description: "Monthly reports on spend, leads and cost per lead." },
    ],
    process: [
      { title: "Discover", description: "We learn your offer, margins, customers and goals." },
      { title: "Build", description: "We set up tracking first, then campaigns, ads and landing pages." },
      { title: "Launch", description: "Campaigns go live with close monitoring in the early weeks." },
      { title: "Optimize", description: "We refine keywords, ads, bids and budgets based on results." },
    ],
    notes: [
      "Our management fee is separate from your advertising spend. Ad spend is paid directly to Google from your own account, so you always own your account and data.",
    ],
    faqs: [
      { question: "How much should I spend on Google Ads?", answer: "It depends on your industry, location and goals. We'll recommend a starting budget after understanding your business, and you stay in control of spend." },
      { question: "Is your fee included in the ad budget?", answer: "No. Our management fee is separate from your ad spend, which is billed by Google directly to your account." },
      { question: "Who owns the Google Ads account?", answer: "You do. We work inside an account you own, so your data and history stay with your business." },
    ],
    seoTitle: "Google Ads Management in Kenya",
    seoDescription:
      "Google Ads and PPC management for Kenyan businesses: strategy, keyword research, ad copy, conversion tracking and transparent reporting.",
    published: true,
  },
  {
    id: "svc_social",
    name: "Social Media Marketing",
    slug: "social-media-marketing-kenya",
    href: "/digital-marketing-kenya/social-media-marketing-kenya/",
    division: "digital_marketing",
    icon: "social",
    image: { src: "/images/social.webp", alt: "Two young professionals working together on a laptop and smartphone in a café" },
    summary: "Consistent, on-brand social media that builds trust and drives enquiries.",
    description:
      "Social media marketing that combines a clear strategy, consistent content and targeted paid campaigns, so your brand stays visible to the right audience and turns attention into conversations.",
    benefits: [
      "A consistent, professional presence on the platforms your customers use",
      "Content planned in advance around your goals",
      "Paid campaigns that reach the right audience",
      "Reporting focused on enquiries, not just likes",
    ],
    deliverables: [
      { title: "Social media strategy", description: "Platforms, audiences, messaging and goals." },
      { title: "Content calendars", description: "Planned posts aligned with your business priorities." },
      { title: "Creative production", description: "Graphics and short-form content for your brand." },
      { title: "Copywriting", description: "Captions and messaging that sound like you." },
      { title: "Community management", description: "Timely responses to comments and messages." },
      { title: "Paid social campaigns", description: "Targeted ads on Facebook, Instagram, LinkedIn and TikTok." },
      { title: "Monthly reporting", description: "Reach, engagement and lead results with recommendations." },
    ],
    process: [
      { title: "Strategy", description: "We define your audience, platforms and content pillars." },
      { title: "Plan", description: "We prepare a monthly content calendar for your approval." },
      { title: "Create & publish", description: "We produce, schedule and publish content." },
      { title: "Engage & report", description: "We manage community and report on results monthly." },
    ],
    notes: [
      "As with Google Ads, any paid social ad spend is separate from our management fee.",
    ],
    faqs: [
      { question: "Which platforms do you manage?", answer: "We recommend platforms based on where your customers are — commonly Facebook, Instagram, LinkedIn, TikTok and X." },
      { question: "Do I approve content before it's posted?", answer: "Yes. We share a content calendar for approval before anything is published." },
    ],
    seoTitle: "Social Media Marketing in Kenya",
    seoDescription:
      "Social media marketing for Kenyan businesses: strategy, content calendars, creative, community management and paid campaigns that drive enquiries.",
    published: true,
  },
  {
    id: "svc_cro",
    name: "Conversion Rate Optimization",
    slug: "conversion-rate-optimization",
    href: "/digital-marketing-kenya/conversion-rate-optimization/",
    division: "digital_marketing",
    icon: "conversion",
    image: { src: "/images/cro.webp", alt: "Designer sketching website wireframes on a whiteboard" },
    summary: "Turn more of your existing website visitors into enquiries and sales.",
    description:
      "Conversion rate optimization (CRO) finds where visitors drop off and fixes it — through clearer messaging, better forms, faster pages and measured experiments — so your traffic and ad spend work harder.",
    benefits: [
      "More enquiries from the traffic you already have",
      "Better return on SEO and advertising spend",
      "Decisions based on analytics and testing, not guesswork",
    ],
    deliverables: [
      { title: "Analytics & tracking review", description: "Make sure conversions are measured accurately." },
      { title: "Conversion audit", description: "Identify friction in pages, forms and calls to action." },
      { title: "Landing page improvements", description: "Clearer messaging, structure and trust signals." },
      { title: "Form optimization", description: "Shorter, clearer forms that more people complete." },
      { title: "A/B testing", description: "Measured experiments where traffic allows." },
      { title: "Reporting", description: "Before-and-after results you can see." },
    ],
    process: [
      { title: "Measure", description: "We verify tracking and establish a baseline." },
      { title: "Diagnose", description: "We find where and why visitors drop off." },
      { title: "Improve", description: "We prioritize and implement high-impact changes." },
      { title: "Validate", description: "We measure the impact and keep iterating." },
    ],
    faqs: [
      { question: "How much traffic do I need for CRO?", answer: "Formal A/B tests need meaningful traffic, but every site benefits from fixing obvious friction. We'll recommend the right approach for your traffic levels." },
    ],
    seoTitle: "Conversion Rate Optimization (CRO) Services",
    seoDescription:
      "Conversion rate optimization services that turn more website visitors into leads: analytics review, landing page and form optimization, and A/B testing.",
    published: true,
  },
  {
    id: "svc_web_design",
    name: "Website Design & Development",
    slug: "website-design-kenya",
    href: "/website-design-kenya/",
    division: "web_development",
    icon: "web",
    image: { src: "/images/web-design.webp", alt: "Developer writing code at a desktop computer in a modern office" },
    summary: "Fast, professional websites designed to turn visitors into customers.",
    description:
      "We design and build business websites that load fast, look professional on every device, are easy for you to update and are built from day one to rank in search and generate enquiries.",
    benefits: [
      "A professional first impression that builds trust",
      "Fast, mobile-friendly pages built with SEO foundations",
      "Clear calls to action, enquiry forms and WhatsApp contact",
      "A website you can update yourself",
    ],
    deliverables: [
      { title: "Business websites", description: "Company websites that explain what you do and why customers should choose you." },
      { title: "Landing pages", description: "Focused pages for campaigns and promotions." },
      { title: "Website redesigns", description: "Modernize an outdated site without losing your search visibility." },
      { title: "CMS implementation", description: "Edit your own content without a developer." },
      { title: "Performance optimization", description: "Faster pages for better user experience and Core Web Vitals." },
      { title: "Maintenance & support", description: "Updates, backups, security and small changes." },
    ],
    process: [
      { title: "Discover", description: "We learn about your business, customers and goals." },
      { title: "Design", description: "We design the structure and look of your site for your approval." },
      { title: "Build", description: "We develop, add content, and set up SEO and analytics." },
      { title: "Launch & support", description: "We launch, verify everything works and stay on hand." },
    ],
    faqs: [
      { question: "How long does a website take?", answer: "It depends on the size of the site and how quickly content is ready. We'll give you a timeline in your quote." },
      { question: "Will I be able to update the website myself?", answer: "Yes. Where you need it, we set up a content management system and show you how to use it." },
      { question: "Do you redesign existing websites?", answer: "Yes. We plan redirects carefully during redesigns so you don't lose the search visibility you've already built." },
    ],
    seoTitle: "Website Design in Kenya",
    seoDescription:
      "Professional website design and development in Kenya: fast, mobile-friendly business websites, landing pages and redesigns built to generate enquiries.",
    published: true,
  },
  {
    id: "svc_ecommerce",
    name: "E-commerce Website Development",
    slug: "ecommerce-website-development",
    href: "/ecommerce-website-development/",
    division: "web_development",
    icon: "cart",
    image: { src: "/images/ecommerce.webp", alt: "Smiling online-shop owner on a phone call, surrounded by parcels ready to ship" },
    summary: "Online stores that are easy to manage and built to sell.",
    description:
      "We build e-commerce websites with clear product pages, smooth checkout and simple order management, so you can sell online with confidence.",
    benefits: [
      "Sell around the clock to customers across the country",
      "Product pages and checkout designed to convert",
      "Simple tools to manage products, stock and orders",
      "Built with SEO and analytics from day one",
    ],
    deliverables: [
      { title: "Store design & build", description: "A professional, mobile-first online store." },
      { title: "Product catalogue set-up", description: "Categories, products, variants and images." },
      { title: "Checkout & payments", description: "Payment options scoped and tested for your business." },
      { title: "Order management", description: "Track and fulfil orders easily." },
      { title: "SEO & analytics", description: "Search-friendly structure and e-commerce tracking." },
      { title: "Training & support", description: "We show your team how to run the store." },
    ],
    process: [
      { title: "Plan", description: "Products, payments, delivery and customer journey." },
      { title: "Design", description: "Store layout and branding for your approval." },
      { title: "Build & test", description: "Development, payment testing and content upload." },
      { title: "Launch & grow", description: "Go live, then optimize with marketing and CRO." },
    ],
    notes: [
      "Payment gateways are confirmed and tested for each store before launch — we never switch on a payment method that hasn't been verified end to end.",
    ],
    faqs: [
      { question: "Which payment methods can my store accept?", answer: "We agree payment options with you during planning and test each one end to end before launch." },
      { question: "Can it connect to my stock system?", answer: "If you use our Inventory or POS system, ask us about connecting them. Other integrations are scoped individually." },
    ],
    seoTitle: "E-commerce Website Development in Kenya",
    seoDescription:
      "E-commerce website development for Kenyan businesses: online stores with easy product management, tested checkout and built-in SEO.",
    published: true,
  },
];

export function getPublishedServices(division?: Service["division"]) {
  return services.filter((s) => s.published && (!division || s.division === division));
}

export function getService(slug: string) {
  return getPublishedServices().find((s) => s.slug === slug);
}
