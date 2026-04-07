import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Product Photo - BgSwap",
  description:
    "Upload your product photo and get 15 professional backgrounds in seconds. Free preview, no credit card required.",
  openGraph: {
    title: "Upload Product Photo - BgSwap",
    description:
      "Upload your product photo and get 15 professional backgrounds in seconds.",
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
