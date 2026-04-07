import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BgSwap - Product Photo Backgrounds",
    short_name: "BgSwap",
    description:
      "AI removes product photo backgrounds and generates 15 professional variations. Built for Amazon, Etsy & Shopify sellers.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    // TODO: add icon-192.png and icon-512.png to /public
    icons: [],
  };
}
