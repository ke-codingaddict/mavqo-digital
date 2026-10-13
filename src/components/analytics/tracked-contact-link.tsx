"use client";

import type { ComponentProps } from "react";
import { track, type ConversionEvent } from "@/lib/analytics/events";

const events: Record<"phone" | "whatsapp" | "email", ConversionEvent> = {
  phone: "phone_contact_clicked",
  whatsapp: "whatsapp_contact_clicked",
  email: "email_contact_clicked",
};

export function TrackedContactLink({
  kind,
  onClick,
  ...props
}: { kind: keyof typeof events } & ComponentProps<"a">) {
  const external = kind === "whatsapp";
  return (
    <a
      {...props}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        track(events[kind], { location: typeof window !== "undefined" ? window.location.pathname : undefined });
        onClick?.(e);
      }}
    />
  );
}
