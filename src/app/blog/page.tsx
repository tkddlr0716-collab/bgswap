import Link from "next/link";

interface BlogMeta {
  title: string;
  description: string;
  date: string;
  slug: string;
}

// Same post map as [slug]/page.tsx — add new posts here
const POSTS: { slug: string; meta: BlogMeta }[] = [
  { slug: "how-to-remove-background-product-photo-free", meta: { title: "How to Remove Background from Product Photos for Free (2026)", description: "Step-by-step guide to removing backgrounds from product photos for free. Compare 5 methods.", date: "2026-04-05", slug: "how-to-remove-background-product-photo-free" } },
  { slug: "white-background-product-photo-guide", meta: { title: "White Background Product Photo — Complete Guide for E-commerce (2026)", description: "How to create perfect white background product photos for Amazon, eBay, Etsy, and Shopify.", date: "2026-04-07", slug: "white-background-product-photo-guide" } },
  { slug: "product-photos-with-phone", meta: { title: "How to Take Product Photos with Phone — Seller's Guide (2026)", description: "Take professional product photos with your phone camera. Setup, lighting, angles, and editing tips.", date: "2026-04-11", slug: "product-photos-with-phone" } },
  { slug: "etsy-product-photography-tips", meta: { title: "Etsy Product Photography Tips — What Actually Sells in 2026", description: "Practical Etsy product photography tips from top sellers. Backgrounds, lighting, styling.", date: "2026-04-13", slug: "etsy-product-photography-tips" } },
  { slug: "amazon-listing-suppressed-background-fix", meta: { title: "Amazon Listing Suppressed? How to Fix Your Product Photo Background", description: "Your Amazon listing got suppressed because of the background. Here's how to fix it fast.", date: "2026-04-09", slug: "amazon-listing-suppressed-background-fix" } },
  { slug: "product-photo-background-colors", meta: { title: "Best Product Photo Background Colors for E-commerce (2026)", description: "Which background colors sell best on Amazon, Etsy, and Shopify? Data-backed guide.", date: "2026-04-15", slug: "product-photo-background-colors" } },
  { slug: "shopify-product-image-size", meta: { title: "Shopify Product Image Size & Requirements (2026 Guide)", description: "Complete guide to Shopify product image sizes, formats, and optimization.", date: "2026-04-17", slug: "shopify-product-image-size" } },
  { slug: "diy-product-photography-at-home", meta: { title: "DIY Product Photography at Home — $10 Setup That Looks Professional", description: "Set up a home product photography studio for under $10. Step-by-step guide.", date: "2026-04-19", slug: "diy-product-photography-at-home" } },
  { slug: "amazon-product-photo-requirements", meta: { title: "Amazon Product Photo Requirements 2026 — Complete Guide", description: "Everything Amazon sellers need to know about product photo requirements.", date: "2026-04-03", slug: "amazon-product-photo-requirements" } },
  { slug: "batch-product-photo-editing", meta: { title: "Batch Product Photo Editing — 100 Photos in 16 Minutes", description: "How to edit product photos in bulk for e-commerce.", date: "2026-04-03", slug: "batch-product-photo-editing" } },
  { slug: "bgswap-vs-removebg-vs-photoroom", meta: { title: "BgSwap vs remove.bg vs PhotoRoom (2026) — Honest Comparison", description: "Comparing 3 product photo background tools for Amazon, Etsy, and Shopify sellers.", date: "2026-03-31", slug: "bgswap-vs-removebg-vs-photoroom" } },
];

export default function BlogIndex() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Blog</h1>
      <p className="text-gray-500 mb-10">Tips for e-commerce product photography and marketplace selling.</p>

      <div className="space-y-8">
        {POSTS.map((post) => (
          <article key={post.slug} className="border-b border-gray-100 pb-8">
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="text-xl font-bold group-hover:text-blue-600 transition">{post.meta.title}</h2>
              <p className="text-gray-600 mt-1">{post.meta.description}</p>
              <p className="text-sm text-gray-500 mt-2">{post.meta.date}</p>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
