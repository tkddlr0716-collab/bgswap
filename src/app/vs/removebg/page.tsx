import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BgSwap vs remove.bg (2026) — Pricing, Features & Honest Comparison",
  description:
    "Compare BgSwap and remove.bg for product photo background removal. See pricing, features, batch processing, and which tool saves more for e-commerce sellers.",
  openGraph: {
    title: "BgSwap vs remove.bg — Which Is Better for Product Photos?",
    description:
      "Side-by-side comparison: pricing, features, and real cost for 100 product photos.",
    type: "article",
  },
};

const checks = "text-green-600 font-bold";
const cross = "text-gray-400";

export default function VsRemoveBg() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
          BgSwap vs remove.bg
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Both tools remove product photo backgrounds with AI. But they work
          very differently — and the cost difference is{" "}
          <strong>8-10x</strong> when you need multiple backgrounds.
        </p>
      </section>

      {/* Quick verdict */}
      <section className="bg-blue-50 rounded-2xl p-6 md:p-8 mb-12">
        <h2 className="text-xl font-bold mb-3">Quick Verdict</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <strong>Choose remove.bg</strong> if you need a transparent PNG for
            one image and will add backgrounds yourself in Photoshop.
          </li>
          <li>
            <strong>Choose BgSwap</strong> if you need marketplace-ready product
            photos with backgrounds included — especially in bulk.
          </li>
        </ul>
      </section>

      {/* Comparison table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-1/3">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-bold text-blue-600">
                  BgSwap
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  remove.bg
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Background removal",
                  ["✓", checks],
                  ["✓", checks],
                ],
                [
                  "Background replacement (15 options)",
                  ["✓ Included", checks],
                  ["✗ Manual in Photoshop", cross],
                ],
                [
                  "Batch upload (100 at once)",
                  ["✓", checks],
                  ["✓ (desktop app only)", "text-yellow-600"],
                ],
                [
                  "Drop shadows",
                  ["✓ Automatic", checks],
                  ["✗", cross],
                ],
                [
                  "Amazon white background",
                  ["✓ #FFFFFF compliant", checks],
                  ["✗ Transparent only", cross],
                ],
                [
                  "Output per product",
                  ["15 backgrounds", "font-semibold text-gray-900"],
                  ["1 transparent PNG", "text-gray-600"],
                ],
                [
                  "Subscription required",
                  ["No", checks],
                  ["Yes (or pay-per-image)", cross],
                ],
                [
                  "API available",
                  ["Not yet", cross],
                  ["✓", checks],
                ],
                [
                  "Free tier",
                  ["1 product (5 previews)", "text-gray-900"],
                  ["1 image/day (low res)", "text-gray-600"],
                ],
              ].map(([feature, [bgswap, bgClass], [removebg, rbClass]]) => (
                <tr key={feature as string} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {feature as string}
                  </td>
                  <td className={`px-4 py-3 ${bgClass}`}>{bgswap}</td>
                  <td className={`px-4 py-3 ${rbClass}`}>{removebg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">
          Real Cost: 100 Products, 15 Backgrounds Each
        </h2>
        <p className="text-gray-600 mb-6">
          A typical e-commerce seller needs multiple backgrounds per product:
          white for Amazon, dark for premium listings, textured for Shopify/Etsy.
          Here&apos;s what that actually costs.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* BgSwap */}
          <div className="border-2 border-blue-600 rounded-xl p-6 relative">
            <span className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              8-10x cheaper
            </span>
            <div className="text-2xl font-bold mb-1">$29</div>
            <div className="text-gray-500 mb-4">
              100 products &times; 15 backgrounds = 1,500 images
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>&#10003; $0.29 per product</li>
              <li>&#10003; $0.019 per image</li>
              <li>&#10003; Backgrounds included</li>
              <li>&#10003; One-time payment</li>
              <li>&#10003; Drop shadows included</li>
            </ul>
          </div>
          {/* remove.bg */}
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="text-2xl font-bold mb-1">$237–$2,985</div>
            <div className="text-gray-500 mb-4">
              1,500 images (you add backgrounds yourself)
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                $0.158/image (best subscription rate) = $237
              </li>
              <li>
                $1.99/image (pay-as-you-go) = $2,985
              </li>
              <li className="text-gray-400">
                + Your time adding 15 backgrounds per product in Photoshop
              </li>
              <li className="text-gray-400">+ Monthly subscription required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* When remove.bg is better */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">When remove.bg Is Better</h2>
        <div className="bg-gray-50 rounded-xl p-6">
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>You need transparent PNGs</strong> — remove.bg outputs
              transparent backgrounds. BgSwap outputs finished images with
              backgrounds applied.
            </li>
            <li>
              <strong>You need an API</strong> — remove.bg has a mature API for
              automated workflows. BgSwap doesn&apos;t have an API yet.
            </li>
            <li>
              <strong>You only need 1 background removed</strong> — For a single
              image, remove.bg&apos;s free tier works fine.
            </li>
            <li>
              <strong>You&apos;re a developer</strong> building a custom
              integration that needs programmatic background removal.
            </li>
          </ul>
        </div>
      </section>

      {/* When BgSwap is better */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">When BgSwap Is Better</h2>
        <div className="bg-blue-50 rounded-xl p-6">
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>You sell on marketplaces</strong> — BgSwap outputs
              Amazon-compliant white backgrounds, plus 14 other options for Etsy,
              Shopify, and eBay.
            </li>
            <li>
              <strong>You need multiple backgrounds</strong> — 15 backgrounds
              per product, included in the price. With remove.bg you&apos;d pay
              15x and still have to composite them yourself.
            </li>
            <li>
              <strong>You have 50+ products</strong> — Batch processing with
              consistent output. Upload once, download everything as a ZIP.
            </li>
            <li>
              <strong>You don&apos;t want a subscription</strong> — BgSwap is a
              one-time payment. Process and move on.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-12 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl text-white">
        <h2 className="text-3xl font-bold mb-3">See the Difference Yourself</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          Upload one product photo for free. Compare the output to remove.bg.
        </p>
        <Link
          href="/upload"
          className="inline-block bg-amber-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-lg hover:bg-amber-300 transition shadow-lg"
        >
          Try Free — No Credit Card &rarr;
        </Link>
        <p className="text-slate-400 text-sm mt-3">
          1 free product &middot; 5 background previews
        </p>
      </section>
    </main>
  );
}
