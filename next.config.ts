import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is needed for Next.js inline bootstrapping and the gtag snippet.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com https://*.google.co.ke",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com",
  "frame-src https://*.googletagmanager.com https://td.doubleclick.net",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Routes in the spec use trailing slashes (e.g. /software/pos-system-kenya/).
  trailingSlash: true,
  poweredByHeader: false,
  experimental: {
    // Blog cover uploads (≤ 4 MB, src/lib/blog/images.ts) plus the article text and form overhead.
    serverActions: { bodySizeLimit: "5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async redirects() {
    // Spec §7 also names these short URLs; send them to the canonical nested pages.
    return [
      { source: "/seo-services-kenya", destination: "/digital-marketing-kenya/seo-services-kenya/", permanent: true },
      { source: "/google-ads-management-kenya", destination: "/digital-marketing-kenya/google-ads-management-kenya/", permanent: true },
      { source: "/social-media-marketing-kenya", destination: "/digital-marketing-kenya/social-media-marketing-kenya/", permanent: true },
      { source: "/conversion-rate-optimization", destination: "/digital-marketing-kenya/conversion-rate-optimization/", permanent: true },
      { source: "/resources", destination: "/blog/", permanent: true },
      // The hotel product was replaced by the restaurant system.
      { source: "/software/hotel-management-system-kenya", destination: "/software/restaurant-management-system-kenya/", permanent: true },
    ];
  },
};

export default nextConfig;
