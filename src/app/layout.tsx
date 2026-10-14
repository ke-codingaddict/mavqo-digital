import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { THEME_STORAGE_KEY } from "@/components/theme/constants";
import { getAnalyticsSettings } from "@/lib/settings";
import "./globals.css";


const isProduction = process.env.APP_ENV === "production";

export async function generateMetadata(): Promise<Metadata> {
  // Search Console token is managed in Admin → Settings (cached until changed).
  const { searchConsoleToken } = await getAnalyticsSettings();
  return { ...baseMetadata, verification: searchConsoleToken ? { google: searchConsoleToken } : undefined };
}

const baseMetadata: Metadata = {
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
};

export const viewport: Viewport = {
  themeColor: "#0a111d",
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before first paint, so pages stay static with no flash.
// Dark is the default until the visitor picks light or system.
const themeScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="light"?false:p==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches:true;document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
