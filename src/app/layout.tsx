import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import PostHogProvider from "@/components/PostHogProvider";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bgswap.io"),
  alternates: { canonical: "./" },
  title: "BgSwap - Studio-Quality Product Photos in Seconds",
  description:
    "Upload any product photo. AI removes the background and creates clean, professional images. $29 for 100 photos. No subscription.",
  openGraph: {
    title: "BgSwap - Studio-Quality Product Photos in Seconds",
    description: "Remove & replace product photo backgrounds instantly. $29/100 photos.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BgSwap - Product Photo Backgrounds in Seconds",
    description: "Remove & replace backgrounds. $29/100 photos.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
          Skip to main content
        </a>
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-gray-900">
              BgSwap
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
              <a href="#how-it-works" className="hover:text-gray-900 transition">How it works</a>
              <a href="#pricing" className="hover:text-gray-900 transition">Pricing</a>
              <Link href="/blog" className="hover:text-gray-900 transition">Blog</Link>
            </nav>
            <Link
              href="/upload"
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Try Free
            </Link>
          </div>
        </header>

        <PostHogProvider>
          <div id="main-content">
            {children}
          </div>
        </PostHogProvider>
        <CookieConsent />

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-semibold text-gray-700">BgSwap</div>
              <div className="flex gap-6 text-sm text-gray-500">
                <a href="/privacy" className="hover:text-gray-700 transition">Privacy</a>
                <a href="/terms" className="hover:text-gray-700 transition">Terms</a>
                <a href="/refund" className="hover:text-gray-700 transition">Refunds</a>
                <a href="mailto:support@bgswap.io" className="hover:text-gray-700 transition">Contact</a>
              </div>
              <div className="text-xs text-gray-600">
                &copy; {new Date().getFullYear()} BgSwap
              </div>
              <div className="text-xs text-gray-600 mt-2 sm:mt-0">Payments by <a href="https://polar.sh" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">Polar.sh</a></div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
