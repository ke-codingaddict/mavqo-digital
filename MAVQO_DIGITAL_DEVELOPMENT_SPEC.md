# Mavqo Digital — Web Development Specification

**Project:** Mavqo Digital Website and Business Software Platform\
**Document:** Technical Requirements and Implementation Blueprint\
**Market:** Kenya, with future East African and international expansion\
**Brand tagline:** Build Smarter. Grow Faster.\
**Proposed domain:** `mavqodigital.co.ke` — availability must be verified\
**Status:** Development specification\
**Version:** 1.0

---

# 1. Project Overview

## 1.1 Objective

Develop a professional, secure, responsive and SEO-optimized digital platform for Mavqo Digital, a technology company offering business management software, web development and digital marketing services.

The platform must support two main business functions:

1. Marketing and selling Mavqo Digital's products and services.
2. Providing a foundation for delivering, demonstrating and eventually managing its software products.

The platform must be designed for maintainability, accessibility, performance, security and future expansion.

## 1.2 Business divisions

### Division A: Business Software

- School Management System.
- Hospital and Clinic Management System.
- Hotel Management System.
- Point of Sale (POS) System.
- Inventory Management System.
- Business Management Software.
- Future accounting, HR, CRM and ERP solutions.

### Division B: Digital Marketing

- Search Engine Optimization (SEO).
- Google Ads management.
- Pay-Per-Click (PPC) advertising.
- Social media marketing.
- Conversion Rate Optimization (CRO).
- Digital analytics and reporting.

### Division C: Web Development

- Business websites.
- E-commerce websites.
- Landing pages.
- Website redesigns.
- Website maintenance.
- Custom web applications.

The website must present these divisions as parts of one company while giving each product and service a dedicated landing page.

## 1.3 Important product distinction

The public marketing website and the actual management systems are separate application concerns.

The marketing website must be launchable before every software product is complete.

A product must not be advertised as available, integrated, compliant or fully functional unless its capabilities have been implemented and verified.

Use clear product statuses internally:

- `planned`
- `in_development`
- `available_for_demo`
- `available_for_sale`
- `maintenance`

Only approved statuses should determine what customers see publicly.

---

# 2. Project Goals

The application must:

- Present Mavqo Digital professionally.
- Generate qualified business enquiries.
- Allow prospective customers to request software demonstrations.
- Allow businesses to request quotations for software and digital services.
- Publish SEO-friendly service and product pages.
- Support blog articles and educational resources.
- Provide a maintainable administrative content management system.
- Allow future integration with payments, CRM and messaging services.
- Provide secure foundations for future customer portals.
- Support Kenyan business requirements and future expansion.

## 2.1 Initial success metrics

Track:

- Qualified enquiries.
- Demo requests.
- Quote requests.
- Contact form completion rate.
- Organic search impressions and clicks.
- Search landing page conversions.
- Paid advertising leads.
- Lead response time.
- Website performance.
- Software trial or purchase conversions, once supported.

Do not assume rankings or sales are guaranteed by implementation alone.

---

# 3. Recommended Technology Stack

Use a modern, maintainable architecture.

## 3.1 Frontend

Recommended:

- Next.js with the App Router.
- TypeScript.
- React.
- Tailwind CSS.
- Accessible reusable UI components.
- Server-rendered or statically generated content pages where appropriate.

Use a consistent design system rather than creating separate visual styles for every page.

## 3.2 Backend

Recommended options:

- Next.js server-side functionality for a small initial marketing platform.
- A separate API service when application complexity justifies it.
- PostgreSQL for structured application data.
- A supported database access layer such as Prisma or Drizzle.
- A managed object-storage service for uploaded files where required.

Keep business logic outside presentation components.

Do not expose database credentials, payment secrets, email API keys or private environment variables to the browser.

## 3.3 Content management

Select one of these approaches:

**Option A: Integrated CMS**

Use the application's administrative interface for managing products, services, articles, FAQs and lead records.

**Option B: Headless CMS**

Use a headless CMS if editors need a richer publishing workflow and the team can maintain an additional service.

Avoid introducing unnecessary infrastructure during the initial launch.

## 3.4 Hosting

Choose a reliable hosting platform that supports:

- HTTPS.
- Environment variables.
- Automated deployment.
- Database connectivity.
- Backups.
- Error monitoring.
- Custom domains.
- Staging and production environments.

The final hosting decision must consider cost, team familiarity, performance, data residency requirements and the operational needs of the software products.

---

# 4. Website Information Architecture

## 4.1 Main navigation

- Home
- Software
- Digital Marketing
- Web Development
- Industries
- Resources
- About
- Contact

Primary navigation actions:

- Request a Demo.
- Get a Quote.

Use a mobile navigation menu with keyboard-accessible controls.

## 4.2 Required routes

```
/
├── about/
├── software/
│   ├── school-management-system-kenya/
│   ├── hospital-management-system-kenya/
│   ├── hotel-management-system-kenya/
│   ├── pos-system-kenya/
│   ├── inventory-management-software-kenya/
│   └── business-management-software-kenya/
├── digital-marketing-kenya/
│   ├── seo-services-kenya/
│   ├── google-ads-management-kenya/
│   ├── social-media-marketing-kenya/
│   └── conversion-rate-optimization/
├── website-design-kenya/
├── ecommerce-website-development/
├── pricing/
├── request-demo/
├── request-quote/
├── case-studies/
├── blog/
│   └── [slug]/
├── contact/
├── privacy-policy/
├── terms-of-service/
└── sitemap.xml
```

These routes are the proposed information architecture. Publish only pages with complete, accurate content.

## 4.3 Homepage requirements

The homepage must contain:

1. Responsive header.
2. Hero section.
3. Primary conversion actions.
4. Software overview.
5. Digital marketing overview.
6. Web development overview.
7. Industry-specific solutions.
8. Explanation of the company's process.
9. Genuine testimonials or case studies, when available.
10. FAQs.
11. Contact or consultation section.
12. Footer with navigation and legal links.

Suggested hero headline:

**Build Smarter. Grow Faster.**

Suggested supporting text:

"Business management software, website development and digital marketing services to help organizations improve operations and grow online."

Primary actions:

- Explore Our Software.
- Get a Free Consultation.

Only advertise a free consultation if it is genuinely offered.

---

# 5. Design System

## 5.1 Brand colors

Define colors as reusable design tokens.

```css
:root {
  --color-primary: #12233F;
  --color-accent: #18B6A4;
  --color-background: #FFFFFF;
  --color-background-muted: #F5F7FB;
  --color-text: #35445A;
  --color-border: #DCE3ED;
  --color-error: #B42318;
  --color-success: #16794B;

  --radius-small: 6px;
  --radius-medium: 12px;
  --radius-large: 20px;
}
```

Adjust the colors after contrast testing. Never rely on color alone to communicate errors or status.

## 5.2 Typography

Use a readable modern typeface such as Inter or Manrope.

Establish consistent sizes for:

- Page titles.
- Section headings.
- Body text.
- Captions.
- Form labels.
- Buttons.
- Metadata.

Use fluid typography where appropriate and avoid excessively large mobile headings.

## 5.3 Reusable components

Implement reusable components for:

- Header.
- Footer.
- Navigation.
- Hero sections.
- Service cards.
- Product cards.
- Feature lists.
- FAQ accordions.
- Testimonials.
- Pricing sections.
- Contact forms.
- Demo request forms.
- Quote request forms.
- Breadcrumbs.
- Blog cards.
- CTA sections.
- SEO metadata.
- Loading states.
- Error states.

Components must support consistent spacing, responsive layouts and accessible interactions.

---

# 6. Product Catalogue

Build a product catalogue backed by structured data rather than hardcoding every product card into the homepage.

## 6.1 Product model

Each product should have:

- Internal identifier.
- Product name.
- Slug.
- Short description.
- Detailed description.
- Industry.
- Product image or screenshots.
- Feature list.
- Availability status.
- Demo availability.
- Pricing model.
- SEO title.
- SEO description.
- Publication status.
- Created and updated timestamps.

Example TypeScript interface:

```ts
type ProductStatus =
  | "planned"
  | "in_development"
  | "available_for_demo"
  | "available_for_sale"
  | "maintenance";

type Product = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  features: string[];
  status: ProductStatus;
  demoAvailable: boolean;
  pricingModel:
    | "subscription"
    | "licence"
    | "custom_quote";
  seoTitle?: string;
  seoDescription?: string;
};
```

Validate all values on the server before saving them.

## 6.2 School Management System

Potential modules:

- Student admissions and records.
- Class and subject management.
- Attendance.
- Fee structures and invoices.
- Payment tracking.
- Examinations and grading.
- Academic reports.
- Parent communication.
- Staff records.
- Administrative reporting.

Future integrations may include M-Pesa and messaging services.

Integration support must not be displayed until it has been implemented, tested and approved.

## 6.3 Hospital Management System

Potential modules:

- Patient registration.
- Appointment scheduling.
- Queue management.
- Clinical documentation.
- Billing.
- Pharmacy workflows.
- Laboratory workflows.
- Insurance administration.
- Reporting.
- Audit logs.
- Role-based permissions.

Clinical modules must receive appropriate domain review before use in real healthcare settings.

Implement strict access control, secure authentication, audit trails, backups and appropriate encryption.

Do not use real patient data in development or demonstrations. Use synthetic data unless an approved, controlled testing process explicitly permits otherwise.

## 6.4 Hotel Management System

Potential modules:

- Room and property configuration.
- Reservations.
- Room availability.
- Check-in and check-out.
- Guest records.
- Invoicing.
- Housekeeping.
- Occupancy reports.
- Restaurant POS integration.
- Stock management.

Integrations with booking channels, payment providers or third-party systems must be implemented individually.

## 6.5 POS System

Potential modules:

- Product catalogue.
- Sales processing.
- Receipt generation.
- Stock updates.
- User permissions.
- Sales reports.
- Returns and adjustments.
- Multi-branch operations, if supported.

Consider offline functionality only if there is a clearly defined synchronization and conflict-resolution design.

## 6.6 Inventory Management System

Potential modules:

- Product records.
- Stock levels.
- Goods received.
- Goods issued.
- Suppliers.
- Stock adjustments.
- Reorder alerts.
- Inventory reporting.
- Multiple locations, if supported.

Use appropriate validation and transaction handling for stock movements.

## 6.7 Product page template

Every product page must include:

1. Product title.
2. Clear explanation of its intended users.
3. Problems the software addresses.
4. Verified features.
5. Screenshots or a product demonstration.
6. Implementation or onboarding information.
7. Support details.
8. Pricing approach.
9. Relevant FAQs.
10. Request Demo CTA.
11. Related products.
12. Unique SEO metadata.

---

# 7. Digital Marketing Service Catalogue

Build service pages from reusable templates backed by structured service content.

## 7.1 SEO services

Route: `/seo-services-kenya/`

Content areas:

- Technical SEO.
- On-page SEO.
- Keyword research.
- Search-intent analysis.
- Content planning.
- Internal linking.
- Local SEO.
- Search performance monitoring.

Do not promise guaranteed first-page rankings.

## 7.2 Google Ads and PPC

Route: `/google-ads-management-kenya/`

Content areas:

- Campaign strategy.
- Keyword research.
- Campaign configuration.
- Ad copy.
- Landing page optimization.
- Conversion tracking.
- Budget monitoring.
- Search term analysis.
- Performance reporting.

Clearly distinguish management fees from advertising spend.

## 7.3 Social media marketing

Route: `/social-media-marketing-kenya/`

Content areas:

- Strategy.
- Content calendars.
- Creative production.
- Copywriting.
- Community management.
- Paid campaigns.
- Reporting.

## 7.4 Web development

Routes:

- `/website-design-kenya/`
- `/ecommerce-website-development/`

Content areas:

- Business websites.
- E-commerce.
- Landing pages.
- Website redesigns.
- CMS implementation.
- Maintenance.
- Performance optimization.

## 7.5 Service data model

```ts
type Service = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  benefits: string[];
  deliverables: string[];
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
};
```

Keep public content separate from internal pricing calculations and customer-specific contract data.

---

# 8. Lead Generation System

## 8.1 Required forms

Implement:

- Contact form.
- Software demo request.
- Marketing consultation request.
- Quote request.

Each form should validate inputs on both the client and server.

## 8.2 Demo request fields

Recommended fields:

- Name.
- Business email or preferred contact information.
- Organization.
- Product of interest.
- Organization size, if relevant.
- Preferred contact method.
- Optional message.

## 8.3 Marketing enquiry fields

Recommended fields:

- Name.
- Business name.
- Email.
- Website URL, where applicable.
- Service requested.
- Main objective.
- Optional budget range.
- Preferred contact method.
- Optional message.

Collect only information needed for the stated purpose.

## 8.4 Lead handling

The server should:

1. Validate the submitted data.
2. Apply spam prevention and rate limiting.
3. Store the enquiry securely.
4. Generate a unique lead identifier.
5. Send a notification through a configured provider.
6. Return a success response only after the required operation succeeds.
7. Log operational failures without exposing personal data unnecessarily.

Email notification failures must not silently destroy a successfully stored enquiry.

## 8.5 Lead status

Use a controlled workflow:

- `new`
- `contacted`
- `qualified`
- `proposal_sent`
- `won`
- `lost`

Keep internal lead statuses separate from public website content.

---

# 9. Database Design

A PostgreSQL database is suitable if the application needs a persistent lead management system and content administration.

## 9.1 Suggested tables

### `products`

Stores product catalogue records.

### `services`

Stores marketing and web development service records.

### `leads`

Stores enquiries submitted by prospective customers.

### `blog_posts`

Stores editorial content and publication status.

### `users`

Stores administrative accounts and roles.

### `audit_logs`

Records relevant administrative and security actions.

Additional tables should be introduced only when needed by actual functionality.

## 9.2 Example lead schema

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(40),
    organization VARCHAR(200),
    enquiry_type VARCHAR(40) NOT NULL,
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Implementation requirements:

- Generate UUIDs securely.
- Validate `enquiry_type` against an approved set.
- Validate and normalize contact details.
- Use database transactions where appropriate.
- Apply retention policies.
- Restrict access to lead records.
- Avoid storing unnecessary sensitive information.

The example is a starting point, not a complete production migration.

---

# 10. Administrative Dashboard

The initial administrative interface should allow authorized staff to manage:

- Products.
- Services.
- Blog articles.
- FAQs.
- Enquiries.
- Publication status.
- SEO metadata.

## 10.1 Required security controls

- Authentication.
- Role-based authorization.
- Secure session handling.
- CSRF protection where applicable.
- Rate limiting.
- Input validation.
- Audit logging.
- Secure password handling through a maintained authentication solution.
- Multi-factor authentication where practical.
- Administrative session expiry.

Every administrative API endpoint must verify permissions on the server.

Hiding a button in the user interface is not a substitute for authorization.

---

# 11. SEO Implementation Requirements

SEO must be built into the application's page rendering, routing and content workflow.

## 11.1 Metadata

Every indexable page must have:

- A unique title.
- A suitable meta description.
- A canonical URL.
- A clear H1 heading.
- Relevant social sharing metadata.

Example:

```ts
export const metadata = {
  title: "School Management System in Kenya | Mavqo Digital",
  description:
    "Explore school management software for student records, fees, attendance and academic administration.",
  alternates: {
    canonical:
      "https://YOUR-VERIFIED-DOMAIN/school-management-system-kenya/",
  },
};
```

Replace `YOUR-VERIFIED-DOMAIN` with the actual registered domain. In production, centralize the site URL in validated configuration rather than repeating placeholders.

Use page-specific metadata rather than duplicating this example across all pages.

## 11.2 Search engine requirements

Implement:

- XML sitemap.
- Correct robots.txt.
- Canonical URLs.
- Appropriate HTTP status codes.
- Redirects for changed URLs.
- Useful 404 page.
- Server-rendered or pre-rendered indexable content.
- Descriptive internal links.
- Image alternative text.
- Structured data where appropriate.
- Search Console integration.

Prevent staging environments, administrative pages and private customer portals from being indexed.

Private data must be protected by authentication and authorization, not merely by `noindex`.

## 11.3 Structured data

Consider:

- Organization.
- WebSite.
- BreadcrumbList.
- Article or BlogPosting.
- Relevant service markup where appropriate.

Ensure that structured data accurately reflects the visible page.

Do not invent ratings, reviews, prices, certifications or business locations.

## 11.4 Performance targets

Aim for the following Core Web Vitals thresholds at the 75th percentile:

- LCP: no more than 2.5 seconds.
- INP: no more than 200 milliseconds.
- CLS: no more than 0.1.

Use optimized images, caching, code splitting, appropriate rendering strategies and minimized unnecessary JavaScript.

Verify performance using both laboratory testing and real-user measurements where available.

## 11.5 SEO content rules

- Write for actual customers.
- Map primary search intent to the correct page.
- Avoid keyword stuffing.
- Avoid thin or duplicated location pages.
- Use natural internal links.
- Publish accurate and useful content.
- Keep metadata unique.
- Do not guarantee rankings.
- Measure qualified leads in addition to search traffic.

---

# 12. Analytics and Advertising Integrations

Potential integrations:

- Google Search Console.
- Google Analytics.
- Google Ads conversion tracking.
- Google Tag Manager where appropriate.
- WhatsApp Business.
- Email delivery provider.
- CRM.
- Payment gateway.
- M-Pesa services.

All integrations must be configured using verified accounts and official provider documentation.

## Conversion events

Track meaningful actions such as:

- `demo_request_submitted`
- `quote_request_submitted`
- `contact_form_submitted`
- `phone_contact_clicked`
- `whatsapp_contact_clicked`

Track completed conversions rather than treating every button click as a successful lead.

Do not send passwords, payment details, patient data or other sensitive information to analytics or advertising platforms.

Apply suitable consent and privacy controls for the selected tools and jurisdictions.

---

# 13. Security and Data Protection

Security is a core requirement, not an optional enhancement.

## 13.1 Minimum security requirements

- HTTPS.
- Secure server-side secrets.
- Input validation.
- Output encoding.
- Protection against common web vulnerabilities.
- Authentication and authorization.
- Rate limiting.
- Secure session management.
- Dependency updates.
- Backups.
- Error monitoring.
- Access logging.
- Incident response procedures.

## 13.2 Healthcare data

The Hospital Management System may process highly sensitive personal and health information.

Before production deployment:

- Establish appropriate access controls.
- Encrypt data in transit and at rest where appropriate.
- Implement audit trails.
- Define retention and deletion rules.
- Document backup and recovery procedures.
- Assess third-party processors.
- Review applicable Kenyan privacy and healthcare obligations.
- Conduct security testing.
- Use synthetic test data during development.

Do not connect healthcare records to marketing analytics.

## 13.3 Privacy and compliance

Prepare appropriate privacy notices, terms and data handling procedures.

Review applicable Kenyan requirements, including the Data Protection Act, 2019 and relevant regulations.

Determine whether registration, sector-specific approvals, contracts or additional assessments are required for the actual services being provided.

Seek qualified advice where necessary.

---

# 14. Testing Requirements

## 14.1 Unit tests

Test:

- Form validation.
- Data transformation.
- Pricing calculations where applicable.
- Product and service status rules.
- SEO metadata generation.
- Access-control logic.

## 14.2 Integration tests

Test:

- Database writes.
- Lead creation.
- Email notification handling.
- Authentication.
- API authorization.
- CMS publishing.
- Payment integration in a test environment.

## 14.3 End-to-end tests

Verify that a user can:

1. Open the homepage.
2. Navigate to a product page.
3. Submit a demo request.
4. Receive appropriate confirmation.
5. Submit a marketing enquiry.
6. Navigate the website on a mobile screen.
7. Access relevant contact information.
8. Complete any implemented purchase workflow.

## 14.4 Accessibility tests

Test:

- Keyboard navigation.
- Focus visibility.
- Screen reader labels.
- Color contrast.
- Form error handling.
- Responsive layouts.
- Heading structure.

## 14.5 Security tests

Test:

- Unauthorized administrative access.
- Input validation.
- Rate limits.
- Session security.
- Access to private records.
- Secrets exposure.
- Dependency vulnerabilities.
- Backup restoration.

---

# 15. Deployment and Environments

Use separate environments:

- Development.
- Staging.
- Production.

## Deployment requirements

- Store source code in version control.
- Use environment-specific configuration.
- Keep secrets out of source control.
- Run automated tests before production deployment.
- Apply database migrations safely.
- Maintain backups.
- Monitor application errors.
- Document rollback procedures.
- Verify redirects and indexing after launch.

## Environment variables

Example names:

```
DATABASE_URL=
APP_BASE_URL=
AUTH_SECRET=
EMAIL_PROVIDER_API_KEY=
ANALYTICS_MEASUREMENT_ID=
```

These are variable names only. Do not commit actual secrets to source control.

Validate required configuration at application startup and fail safely when essential settings are missing.

---

# 16. Suggested Project Structure

A possible Next.js structure:

```
mavqo-digital/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── about/
│   │   ├── software/
│   │   ├── digital-marketing-kenya/
│   │   ├── website-design-kenya/
│   │   ├── blog/
│   │   ├── contact/
│   │   ├── request-demo/
│   │   ├── request-quote/
│   │   ├── privacy-policy/
│   │   ├── terms-of-service/
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── products/
│   │   ├── services/
│   │   ├── forms/
│   │   ├── blog/
│   │   └── seo/
│   ├── lib/
│   │   ├── database/
│   │   ├── validation/
│   │   ├── analytics/
│   │   ├── email/
│   │   └── security/
│   ├── content/
│   ├── types/
│   └── styles/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── prisma/
├── .env.example
├── package.json
├── README.md
└── MAVQO_DIGITAL_DEVELOPMENT_SPEC.md
```

Adapt this structure to the selected CMS, database library and hosting environment.

---

# 17. Implementation Phases

## Phase 1: Marketing website

Build:

- Homepage.
- About page.
- Product catalogue.
- Priority product pages.
- Digital marketing pages.
- Web development pages.
- Contact and enquiry forms.
- Blog.
- SEO foundation.
- Analytics.

## Phase 2: Administration

Build:

- Secure administrator login.
- Product and service management.
- Blog publishing.
- Lead management.
- SEO metadata management.
- Enquiry notifications.

## Phase 3: Product demonstrations

Build demo environments for software that is ready to demonstrate.

Use isolated environments and synthetic data.

Implement product-specific functionality rather than presenting non-functional mockups as finished products.

## Phase 4: Customer accounts

When commercially justified, add:

- Customer registration.
- Subscription or licence management.
- Customer support portal.
- Billing records.
- Product access controls.
- Account administration.

## Phase 5: Operational software

Develop the actual school, hospital, hotel, POS and inventory systems as separately scoped applications or well-isolated modules.

Each requires its own requirements, data model, security review, testing and deployment plan.

---

# 18. Acceptance Criteria

The initial platform is ready for launch when:

- The website is responsive.
- Navigation works correctly.
- All published product pages contain accurate information.
- All published service pages contain accurate information.
- Demo and enquiry forms work.
- Form submissions are stored securely.
- Notifications are configured and tested.
- SEO metadata is unique and accurate.
- Sitemap and robots.txt are available.
- Important pages are indexable.
- Private pages are appropriately protected.
- Analytics events are verified.
- HTTPS is enabled.
- Accessibility issues are addressed.
- Backups and monitoring are configured.
- Privacy and terms pages are published.
- No secrets are exposed to the client.
- Production deployment and rollback procedures are documented.

---

# 19. Instructions for the Development Team or AI Coding Agent

Build the application incrementally, using this specification as the source of truth.

Before implementing a feature:

1. Confirm its intended behavior.
2. Identify the relevant routes, components, data models and APIs.
3. Implement server-side validation and authorization where required.
4. Add responsive and accessible user interfaces.
5. Add appropriate tests.
6. Update documentation.
7. Verify SEO behavior and performance.
8. Report any assumptions or unavailable integrations.

Do not:

- Invent product capabilities.
- Fabricate customer testimonials.
- Claim that a domain or trademark is available without checking.
- Store secrets in frontend code.
- Expose sensitive records through public APIs.
- Promise first-page rankings.
- Mark unfinished integrations as complete.
- Build the entire platform as one unmaintainable component.

Prioritize working, tested features over visual mockups that cannot perform their advertised actions.

---

# 20. Final Development Priority

The recommended launch order is:

1. Responsive marketing website.
2. Software and digital marketing service pages.
3. SEO and analytics.
4. Lead capture and notifications.
5. Administrative content management.
6. Demonstrations of available software products.
7. Customer accounts and commercial integrations.
8. Full operational management systems.

The marketing website can launch while additional software is under development, provided its public content accurately describes what is available.

**End of specification.**
