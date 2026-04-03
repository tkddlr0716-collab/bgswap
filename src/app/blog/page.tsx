import Link from "next/link";

interface BlogMeta {
  title: string;
  description: string;
  date: string;
  slug: string;
}

// Same post map as [slug]/page.tsx — add new posts here
const POSTS: { slug: string; meta: BlogMeta }[] = [
  {
    slug: "amazon-product-photo-requirements",
    meta: {
      title: "Amazon Product Photo Requirements 2026 — Complete Guide",
      description: "Everything Amazon sellers need to know about product photo requirements: white background rules, image size, and how to avoid listing suppression.",
      date: "2026-04-03",
      slug: "amazon-product-photo-requirements",
    },
  },
  {
    slug: "batch-product-photo-editing",
    meta: {
      title: "Batch Product Photo Editing — 100 Photos in 16 Minutes",
      description: "How to edit product photos in bulk for e-commerce. Compare manual editing, Photoshop actions, and AI batch processing.",
      date: "2026-04-03",
      slug: "batch-product-photo-editing",
    },
  },
  {
    slug: "bgswap-vs-removebg-vs-photoroom",
    meta: {
      title: "BgSwap vs remove.bg vs PhotoRoom (2026) — Honest Comparison",
      description: "Comparing 3 product photo background tools for Amazon, Etsy, and Shopify sellers.",
      date: "2026-03-31",
      slug: "bgswap-vs-removebg-vs-photoroom",
    },
  },
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
