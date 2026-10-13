import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social sharing image for every page. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #12233F 0%, #1a3157 60%, #0f4f55 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="10" fill="#0b1a31" />
            <path d="M9 28V12.5l11 9.5 11-9.5V28" fill="none" stroke="#18B6A4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="31" cy="12.5" r="2.6" fill="#fff" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            Mavqo<span style={{ color: "#18B6A4", marginLeft: 12 }}>Digital</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Build Smarter.</div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#18B6A4" }}>Grow Faster.</div>
        </div>
        <div style={{ fontSize: 30, color: "rgba(255,255,255,0.75)" }}>
          Business software · Websites · Digital marketing — Kenya
        </div>
      </div>
    ),
    size,
  );
}
