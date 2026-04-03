"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsConsent } from "./CookieConsent";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

async function capture(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  if (!hasAnalyticsConsent()) return;
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        properties: {
          ...properties,
          $current_url: window.location.href,
          $host: window.location.host,
          $pathname: window.location.pathname,
          $referrer: document.referrer,
          $device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          distinct_id: getDistinctId(),
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail analytics
  }
}

function getDistinctId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("ph_distinct_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ph_distinct_id", id);
  }
  return id;
}

export { capture };

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    capture("$pageview", {
      utm_source: new URLSearchParams(window.location.search).get("utm_source"),
      utm_medium: new URLSearchParams(window.location.search).get("utm_medium"),
      utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
    });
  }, [pathname]);

  return <>{children}</>;
}
