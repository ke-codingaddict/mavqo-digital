import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { THEME_STORAGE_KEY } from "@/components/theme/constants";
import "./globals.css";


const isProduction = process.env.APP_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Business Software, Websites & Digital Marketing in Kenya`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // Staging and development are never indexed (spec §11.2).
  robots: isProduction ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a111d" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the saved (or system) theme before first paint, so pages stay static with no flash.
const themeScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
