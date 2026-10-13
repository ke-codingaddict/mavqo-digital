# Mavqo Digital — Website & Lead Platform

Marketing website and lead-management platform for Mavqo Digital (business software, web development and digital marketing in Kenya).
The specification lives in [`MAVQO_DIGITAL_DEVELOPMENT_SPEC.md`](./MAVQO_DIGITAL_DEVELOPMENT_SPEC.md).

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Zod · Resend (email) · Vitest

## What's included

- **Public site** (statically prerendered): home, software catalogue + 6 product pages, digital marketing hub + 4 service pages, website design, e-commerce, industries, pricing, about, blog (3 articles), contact, request-demo, request-quote, thank-you, privacy policy, terms, custom 404.
- **Lead capture**: one reusable form for demo / quote / marketing / contact / waitlist enquiries with client and server validation, Kenyan phone normalization, honeypot + timing spam checks, per-network rate limiting, UTM / gclid / referrer attribution, team email notification and enquirer confirmation (via `after()`, so a failed email never loses a lead).
- **Conversion tooling**: sticky mobile CTA bar, WhatsApp button, product/service pre-selection from the URL (`/request-demo/?product=pos-system-kenya`), thank-you page with reference number, GA4 / Google Ads conversion events behind a consent banner (Consent Mode v2).
- **Admin lead inbox** (`/admin`): sign-in with lockout and rate limiting, role-based access (`admin`, `sales`), lead list with filters/search/KPIs (new leads, median first-response time, win rate), lead detail with status workflow, notes, history, quick call/WhatsApp/email, CSV export (admin only, formula-injection safe), deletion for data requests, audit log.
- **SEO**: unique titles/descriptions/canonicals, Open Graph image, sitemap, robots (staging/dev is never indexed), Organization / WebSite / BreadcrumbList / Service / SoftwareApplication / BlogPosting structured data, redirects for alternate URLs.
- **Security**: CSP and security headers, HSTS in production, httpOnly SameSite=strict signed sessions (8h), scrypt password hashing, server-side authorization on every admin page/action/route, hashed IPs only, config validated at startup.

## Getting started

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in DATABASE_URL, AUTH_SECRET, IP_HASH_SALT
npm run db:migrate               # create tables
npm run admin:create -- --email you@company.co.ke --name "Your Name"
npm run dev                      # http://localhost:3000  (admin: /admin)
```

## Editing content

| What | Where |
| --- | --- |
| Contact details, WhatsApp, socials, free-consultation flag | `src/config/site.ts` (fields left `null` are hidden everywhere) |
| Products (status, features, FAQs, SEO) | `src/content/products.ts` |
| Services | `src/content/services.ts` |
| Industries, home FAQs, form options | `src/content/industries.ts` |
| Blog posts | `src/content/blog/posts.ts` |

A product's `status` controls what visitors see: only `available_for_demo` / `available_for_sale` products get demo forms and features; `in_development` shows "Coming soon" with an early-access waitlist; `planned` is hidden.

## Design system

- **Font:** the native system font stack — SF Pro on iPhone/iPad/Mac, Segoe UI on Windows, Roboto on Android. No font files are downloaded, so text renders instantly. (Apple's SF Pro licence doesn't permit hosting it on a website.)
- **Colours:** brand navy `#12233F`, teal `#18B6A4` and a warm sun accent on a paper-white canvas. All colours are semantic tokens in `src/app/globals.css` (`canvas`, `surface`, `heading`, `ink`, `primary`, `inverse`…), each with light and dark values.
- **Dark mode:** light / dark / system toggle in the header, mobile menu and footer. The choice is saved in the browser and applied by an inline script before first paint, so there's no flash and pages stay statically rendered.
- **Homepage 3D banner:** a playable Three.js scene (`src/components/hero/`) — drag to spin, throw and flip product cards (tapping a flipped card opens its page), tap the M logo or the growth bars. three.js loads only after the page is idle, pauses off-screen, has a pause button, and stays still for visitors who prefer reduced motion. Cards are generated from the available products in `src/content/products.ts`.
- **Photos:** `public/images/` — free-to-use Unsplash and CC0 images, credited in `public/images/CREDITS.md`. Replace any file with your own photo of the same name; real photos of your team and clients will always convert better. Product pages also show real screenshots automatically once you add them to `screenshots` in `src/content/products.ts`.

## Tests

```bash
npm test                  # unit tests (validation, status rules, permissions, SEO, sessions, CSV)
npm run db:test:setup     # once: migrate the test database defined in .env.test
npm run test:integration  # lead creation, spam and rate limiting against Postgres
npm run lint && npm run typecheck
```

`.env.test` needs `DATABASE_URL` pointing at a separate test database plus test values for `AUTH_SECRET` and `IP_HASH_SALT`.

## Deployment

1. Provision PostgreSQL (e.g. Neon, Supabase, or managed Postgres) with automated backups.
2. Set the environment variables from `.env.example` — `APP_ENV=production` and an `https://` `APP_BASE_URL` on production only; use `APP_ENV=staging` elsewhere so it's never indexed.
   Always run behind a reverse proxy (Vercel, nginx, Caddy…) and set `TRUSTED_PROXY_HOPS` to the number of proxies in front of the app — sign-in throttling and form rate limits key on the client IP, which can be forged if this is wrong.
3. Build: `npm ci && npm run db:deploy && npm run build`, then `npm start` (or deploy to Vercel / any Node host).
4. Create the first admin with `npm run admin:create` against the production database.
5. Verify a Resend sending domain, then set `RESEND_API_KEY`, `EMAIL_FROM` and `LEAD_NOTIFICATION_EMAIL`.
6. After launch: submit the sitemap in Google Search Console, mark `demo_request_submitted` / `quote_request_submitted` / `contact_form_submitted` as key events in GA4, and import them into Google Ads.

**Rollback:** redeploy the previous build. Migrations are additive; if one must be reverted, restore from the pre-deploy database backup.
