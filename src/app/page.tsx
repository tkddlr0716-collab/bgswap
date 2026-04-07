import Link from "next/link";
import Image from "next/image";
import { LandingJsonLd } from "@/components/JsonLd";
import PortfolioStrip from "@/components/PortfolioStrip";

export default function Home() {
  return (
    <main>
      <LandingJsonLd />
      {/* Hero — Clean light background, amber CTA accent */}
      <section className="px-4 pt-16 pb-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Built for Amazon, Etsy &amp; Shopify sellers
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-slate-900">
              Upload Once.<br />
              <span className="text-blue-600">Get 15 Backgrounds.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              AI removes the background and generates 15 professional product photos
              &mdash; solids, gradients, textures &mdash; in seconds.
            </p>
            <Link
              href="/upload"
              className="inline-block bg-amber-400 text-slate-900 text-lg font-bold px-8 py-4 rounded-lg hover:bg-amber-300 transition shadow-lg shadow-amber-400/25"
            >
              Try Free &mdash; No Credit Card &rarr;
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              From $0.29/product &middot; No subscription
            </p>
          </div>

          {/* Before → After showcase: two products */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Product 1: Mug */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <Image src="/showcase/mug-before.jpg" alt="Coffee mug original photo" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Before</span>
              </div>
              <div className="text-xl text-amber-500 font-bold">&rarr;</div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <Image src="/showcase/mug-white.jpg" alt="Mug on white background" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-gray-500">White &middot; <span className="text-blue-600 font-medium">Amazon</span></span>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <Image src="/showcase/mug-dark.jpg" alt="Mug on dark background" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-gray-500">Dark &middot; <span className="text-blue-600 font-medium">Premium</span></span>
              </div>
            </div>

            {/* Product 2: Backpack */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <Image src="/showcase/before-backpack.jpg" alt="Backpack original photo" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Before</span>
              </div>
              <div className="text-xl text-amber-500 font-bold">&rarr;</div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <Image src="/showcase/after-backpack-white.jpg" alt="Backpack on white background" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-gray-500">White &middot; <span className="text-blue-600 font-medium">Amazon</span></span>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <Image src="/showcase/after-backpack-dark.jpg" alt="Backpack on dark background" width={160} height={160} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-gray-500">Dark &middot; <span className="text-blue-600 font-medium">Premium</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-gray-50 px-4 py-6 border-y border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-base">&#10003;</span>
            <span>Amazon white background compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-base">&#10003;</span>
            <span>7-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-base">&#10003;</span>
            <span>Photos auto-deleted after 7 days</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-base">&#10003;</span>
            <span>No subscription, ever</span>
          </div>
        </div>
      </section>

      {/* Portfolio Filmstrip — Before/After showcase */}
      <PortfolioStrip />

      {/* 15 Backgrounds Preview */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">15 Backgrounds, Every Photo</h2>
          <p className="text-gray-600 mb-10 max-w-lg mx-auto">
            Each product gets 15 backgrounds automatically — solids, gradients, and textures.
            White for Amazon, marble for premium — pick what fits.
          </p>
          <div className="grid grid-cols-5 md:grid-cols-5 gap-2 md:gap-4 max-w-2xl mx-auto">
            {[
              { name: "White", tag: "Amazon", src: "/showcase/sneaker-white.jpg" },
              { name: "Dark", tag: "Premium", src: "/showcase/sneaker-dark.jpg" },
              { name: "Marble", tag: "Luxury", src: "/showcase/sneaker-marble.jpg" },
              { name: "Sunset", tag: "Lifestyle", src: "/showcase/sneaker-sunset.jpg" },
              { name: "Ocean", tag: "Fresh", src: "/showcase/sneaker-ocean.jpg" },
            ].map(({ name, tag, src }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="w-full aspect-square rounded-lg shadow-sm overflow-hidden relative border border-gray-100">
                  <Image
                    src={src}
                    alt={`Product on ${name.toLowerCase()} background`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{name}</span>
                <span className="text-[10px] text-blue-600 font-medium">{tag}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-6">+ 10 more backgrounds: gradients, textures, and your custom color</p>
        </div>
      </section>

      {/* How It Works — 3 Steps */}
      <section id="how-it-works" className="bg-gray-50 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">3 Steps. Under 1 Minute.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { step: "1", title: "Upload", desc: "Phone photo, supplier image — anything works.", icon: "📸" },
              { step: "2", title: "AI Does the Work", desc: "Background removed. Product placed on 15 backgrounds — solids, gradients & textures.", icon: "✨" },
              { step: "3", title: "Download & List", desc: "High-res images. Download as ZIP. Ready for any marketplace.", icon: "📥" },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
                <div className="inline-flex items-center justify-center bg-blue-600 text-white text-sm font-bold w-7 h-7 rounded-full mb-3">
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Compliance */}
      <section className="px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Marketplace-Ready. Always.</h2>
          <p className="text-gray-600 mb-10">
            Don&apos;t risk listing suppression. Our outputs meet platform image requirements.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Amazon", req: "Pure white #FFFFFF", icon: "🟠" },
              { name: "eBay", req: "White or light gray", icon: "🔴" },
              { name: "Etsy", req: "Clean background", icon: "🟤" },
              { name: "Shopify", req: "Professional look", icon: "🟢" },
            ].map(({ name, req, icon }) => (
              <div key={name} className="bg-gray-50 rounded-xl p-4">
                <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
                <div className="font-bold text-sm">{name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{req}</div>
                <div className="text-green-600 text-xs font-semibold mt-1">&#10003; Compliant</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Stop Paying for Studio Shoots</h2>
          <p className="text-center text-gray-500 mb-10">Save thousands on product photography.</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500"></th>
                  <th className="px-4 py-3 font-medium text-gray-600">Studio</th>
                  <th className="px-4 py-3 font-medium text-gray-600">DIY</th>
                  <th className="px-4 py-3 font-bold text-blue-600">BgSwap</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Cost / product", "$10–50", "Free (hours)", "$0.29"],
                  ["Turnaround", "1–3 days", "10 min each", "Under 30 sec"],
                  ["Backgrounds", "1 per shoot", "Manual edit", "15 automatic"],
                  ["Batch", "✗", "✗", "100 at once"],
                  ["Marketplace-ready", "Varies", "Varies", "✓ Always"],
                ].map(([label, studio, diy, us]) => (
                  <tr key={label} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                    <td className="px-4 py-3 text-gray-600">{studio}</td>
                    <td className="px-4 py-3 text-gray-600">{diy}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Simple, One-Time Pricing</h2>
          <p className="text-center text-gray-500 mb-10">No subscription. No hidden fees. Pay once.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 flex flex-col">
              <div className="text-2xl font-bold">$4.99</div>
              <div className="text-gray-500 mb-1">10 products</div>
              <div className="text-sm text-gray-500 mb-6">$0.50 / product &middot; 15 backgrounds each</div>
              <div className="mt-auto">
                <Link href="/upload" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition">
                  Get Started
                </Link>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">Good for testing</p>
            </div>
            {/* Pro */}
            <div className="bg-white rounded-xl p-6 border-2 border-blue-600 relative flex flex-col shadow-lg shadow-blue-100">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                BEST VALUE &mdash; Save 42%
              </span>
              <div className="text-2xl font-bold">$29</div>
              <div className="text-gray-500 mb-1">100 products</div>
              <div className="text-sm text-gray-500 mb-6">$0.29 / product &middot; 15 backgrounds each</div>
              <div className="mt-auto">
                <Link href="/upload" className="block w-full text-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition">
                  Get 100 Photos
                </Link>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">Most popular for sellers</p>
            </div>
          </div>
          <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
            <span>🔒 Secure payment</span>
            <span>↩ 7-day money-back guarantee</span>
            <span>📧 Instant download link</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div>
            {[
              { q: "How does it work?", a: "Upload a product photo. Our AI removes the background in seconds and places your product on 15 professional backgrounds — solids, gradients, and textures." },
              { q: "What kind of photos work?", a: "Any product photo — phone camera, supplier image, or existing listing. Works best when the product is clearly visible." },
              { q: "Does it modify my product?", a: "No. Your product stays pixel-perfect. We only remove and replace the background." },
              { q: "Will these pass Amazon requirements?", a: "Yes. Our white background output meets Amazon's pure white (#FFFFFF) requirement. Also works for Etsy, eBay, Shopify, and all other marketplaces." },
              { q: "How fast is it?", a: "Under 30 seconds per product. 100 products take about 10–15 minutes with parallel processing." },
              { q: "What if I'm not satisfied?", a: "We offer a free re-generation plus a full refund within 7 days. No questions asked." },
              { q: "Are my photos stored?", a: "All photos are automatically deleted after 7 days. We don't keep your data." },
            ].map(({ q, a }) => (
              <details key={q} className="border-b border-gray-200 group">
                <summary className="font-semibold cursor-pointer py-4 flex items-center justify-between">
                  <span>{q}</span>
                  <span className="text-gray-500 group-open:rotate-45 transition-transform text-xl ml-4 shrink-0">+</span>
                </summary>
                <p className="text-gray-600 pb-4 pr-8">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA — Navy + Amber */}
      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] px-4 py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">Better Photos. More Sales.</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          Stop wasting time on DIY edits. Try it free and see the quality yourself.
        </p>
        <Link
          href="/upload"
          className="inline-block bg-amber-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-lg hover:bg-amber-300 transition shadow-lg shadow-amber-400/25"
        >
          Upload Your First Photo &rarr;
        </Link>
        <p className="text-slate-400 text-sm mt-3">Free preview. No credit card.</p>
      </section>
    </main>
  );
}
