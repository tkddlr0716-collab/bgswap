import { withSentryConfig } from "@sentry/nextjs";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.google.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://pub-9028bb34984240329392fa064ac0cb4f.r2.dev data: blob:;
  font-src 'self';
  connect-src 'self' https://pub-9028bb34984240329392fa064ac0cb4f.r2.dev https://us.i.posthog.com https://api.polar.sh https://buy.polar.sh https://*.ingest.sentry.io;
  frame-src https://buy.polar.sh https://www.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader.replace(/\s{2,}/g, " ").trim(),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // camera=(self): upload page uses capture="environment" for mobile camera
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-9028bb34984240329392fa064ac0cb4f.r2.dev",
      },
    ],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withSentryConfig(withMDX(nextConfig), {
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
