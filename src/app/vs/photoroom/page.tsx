import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BgSwap vs PhotoRoom (2026) — Pricing, Features & Honest Comparison",
  description:
    "Compare BgSwap and PhotoRoom for product photo editing. See pricing, batch processing, background options, and which tool is better for e-commerce sellers.",
  openGraph: {
    title: "BgSwap vs PhotoRoom — Which Is Better for Product Photos?",
    description:
      "Side-by-side comparison: pricing, features, and real cost for e-commerce sellers.",
    type: "article",
  },
};

const checks = "text-green-600 font-bold";
const cross = "text-gray-400";

export default function VsPhotoRoom() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-slate-900">
          BgSwap vs PhotoRoom
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          PhotoRoom is a full photo editing suite. BgSwap does one thing:
          product photo backgrounds at scale. Here&apos;s how they compare for
          e-commerce sellers.
        </p>
      </section>

      {/* Quick verdict */}
      <section className="bg-blue-50 rounded-2xl p-6 md:p-8 mb-12">
        <h2 className="text-xl font-bold mb-3">Quick Verdict</h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            <strong>Choose PhotoRoom</strong> if you need a full editing suite
            with AI-generated scenes, templates, and creative tools.
          </li>
          <li>
            <strong>Choose BgSwap</strong> if you need clean product photos with
            consistent backgrounds in bulk — without a monthly subscription.
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
                  PhotoRoom
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
                  "15 preset backgrounds per product",
                  ["✓ Automatic", checks],
                  ["✗ Manual per image", cross],
                ],
                [
                  "AI-generated custom scenes",
                  ["✗", cross],
                  ["✓", checks],
                ],
                [
                  "Batch processing (100+)",
                  ["✓ Built-in", checks],
                  ["✓ (Pro plan)", "text-yellow-600"],
                ],
                [
                  "Templates & creative tools",
                  ["✗ (backgrounds only)", cross],
                  ["✓ 1000+ templates", checks],
                ],
                [
                  "Drop shadows",
                  ["✓ Automatic", checks],
                  ["✓", checks],
                ],
                [
                  "Amazon-compliant white bg",
                  ["✓ #FFFFFF", checks],
                  ["✓", checks],
                ],
                [
                  "Subscription required",
                  ["No — one-time payment", checks],
                  ["Yes — $12.99-34.99/mo", cross],
                ],
                [
                  "API",
                  ["Not yet", cross],
                  ["✓ From $0.02/image", checks],
                ],
                [
                  "Mobile app",
                  ["Web only", cross],
                  ["✓ iOS & Android", checks],
                ],
                [
                  "Shopify integration",
                  ["Not yet", cross],
                  ["✓", checks],
                ],
              ].map(([feature, [bgswap, bgClass], [photoroom, prClass]]) => (
                <tr key={feature as string} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {feature as string}
                  </td>
                  <td className={`px-4 py-3 ${bgClass}`}>{bgswap}</td>
                  <td className={`px-4 py-3 ${prClass}`}>{photoroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pricing: What You Actually Pay</h2>
        <p className="text-gray-600 mb-6">
          PhotoRoom charges monthly subscriptions. BgSwap charges per batch. The
          cost difference depends on how many products you process.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Scenario
                </th>
                <th className="px-4 py-3 text-left font-bold text-blue-600">
                  BgSwap
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  PhotoRoom Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["10 products (one-time)", "$4.99", "$12.99/mo"],
                ["100 products (one-time)", "$29", "$12.99/mo"],
                ["100 products/month (12 months)", "$348/yr", "$155.88/yr"],
                ["One-time batch of 100, then nothing", "$29 total", "$12.99 + cancel"],
                ["Output per 100 products", "1,500 images (15 bg each)", "100 images (1 bg each)"],
              ].map(([scenario, bgswap, photoroom]) => (
                <tr key={scenario} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {scenario}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {bgswap}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{photoroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          <strong>Key difference:</strong> BgSwap includes 15 backgrounds per
          product in the price. With PhotoRoom, you&apos;d process each
          background separately — 15 backgrounds = 15x the work.
        </p>
      </section>

      {/* PhotoRoom strengths */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          Where PhotoRoom Wins
        </h2>
        <div className="bg-gray-50 rounded-xl p-6">
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Full editing suite</strong> — Templates, AI scene
              generation, text overlays, collages. If you need creative editing
              beyond backgrounds, PhotoRoom does more.
            </li>
            <li>
              <strong>Mobile app</strong> — Edit product photos directly on your
              phone. BgSwap is web-only.
            </li>
            <li>
              <strong>Shopify integration</strong> — Sync directly with your
              Shopify store. BgSwap requires manual upload.
            </li>
            <li>
              <strong>API</strong> — Automate workflows programmatically.
              BgSwap doesn&apos;t have an API yet.
            </li>
            <li>
              <strong>Regular monthly processing</strong> — If you process 100+
              products every month, PhotoRoom&apos;s subscription becomes
              cost-effective at scale.
            </li>
          </ul>
        </div>
      </section>

      {/* BgSwap strengths */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Where BgSwap Wins</h2>
        <div className="bg-blue-50 rounded-xl p-6">
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>15 backgrounds, automatically</strong> — Upload once, get
              white, dark, marble, gradients, and textures. No manual
              background selection needed.
            </li>
            <li>
              <strong>No subscription</strong> — Pay $29 once for 100 products.
              No recurring charges, no cancellation needed. PhotoRoom charges
              monthly whether you use it or not.
            </li>
            <li>
              <strong>Simpler workflow</strong> — Upload → wait → download ZIP.
              No learning curve, no templates to configure, no settings to
              tweak.
            </li>
            <li>
              <strong>Cost for occasional use</strong> — Need to process 100
              products once for a new catalog? $29 vs. subscribing to PhotoRoom
              and remembering to cancel.
            </li>
            <li>
              <strong>Marketplace-optimized output</strong> — Every background
              is designed for e-commerce: Amazon white, premium dark, lifestyle
              textures. Not generic AI scenes.
            </li>
          </ul>
        </div>
      </section>

      {/* PhotoRoom complaints */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          What PhotoRoom Users Complain About
        </h2>
        <p className="text-gray-600 mb-4">
          From Trustpilot and app store reviews:
        </p>
        <div className="bg-gray-50 rounded-xl p-6">
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Billing issues</strong> — Unexpected charges after free
              trials. Difficult cancellation process.
            </li>
            <li>
              <strong>Customer support</strong> — Automated bot responses.
              Slow resolution for billing disputes.
            </li>
            <li>
              <strong>Feature changes</strong> — Features moved to higher-priced
              tiers mid-subscription. Prepaid customers affected.
            </li>
            <li>
              <strong>Pricing complexity</strong> — Multiple tiers (Pro, Max,
              Enterprise) with confusing feature limits.
            </li>
          </ul>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          BgSwap has a simple model: $4.99 for 10 products, $29 for 100
          products. No tiers, no surprise charges, no subscription to cancel.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center py-12 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl text-white">
        <h2 className="text-3xl font-bold mb-3">Try It Yourself</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          Upload one product photo free. See how BgSwap compares to PhotoRoom
          — no account, no credit card.
        </p>
        <Link
          href="/upload"
          className="inline-block bg-amber-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-lg hover:bg-amber-300 transition shadow-lg"
        >
          Upload Your First Photo &rarr;
        </Link>
        <p className="text-slate-400 text-sm mt-3">
          1 free product &middot; 5 background previews &middot; No strings
          attached
        </p>
      </section>
    </main>
  );
}
