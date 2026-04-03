import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

interface BlogMeta {
  title: string;
  description: string;
  date: string;
}

// Explicitly map slugs to MDX imports (no dynamic require)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POSTS: Record<string, () => Promise<any>> = {
  "bgswap-vs-removebg-vs-photoroom": () => import("@/content/blog/bgswap-vs-removebg-vs-photoroom.mdx"),
  "amazon-product-photo-requirements": () => import("@/content/blog/amazon-product-photo-requirements.mdx"),
  "batch-product-photo-editing": () => import("@/content/blog/batch-product-photo-editing.mdx"),
  "how-to-remove-background-product-photo-free": () => import("@/content/blog/how-to-remove-background-product-photo-free.mdx"),
  "white-background-product-photo-guide": () => import("@/content/blog/white-background-product-photo-guide.mdx"),
  "product-photos-with-phone": () => import("@/content/blog/product-photos-with-phone.mdx"),
  "etsy-product-photography-tips": () => import("@/content/blog/etsy-product-photography-tips.mdx"),
  "amazon-listing-suppressed-background-fix": () => import("@/content/blog/amazon-listing-suppressed-background-fix.mdx"),
  "product-photo-background-colors": () => import("@/content/blog/product-photo-background-colors.mdx"),
  "shopify-product-image-size": () => import("@/content/blog/shopify-product-image-size.mdx"),
  "diy-product-photography-at-home": () => import("@/content/blog/diy-product-photography-at-home.mdx"),
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loader = POSTS[slug];
  if (!loader) return { title: "Not Found" };
  const mod = await loader();
  return {
    title: `${mod.meta.title} | BgSwap Blog`,
    description: mod.meta.description,
    openGraph: {
      title: mod.meta.title,
      description: mod.meta.description,
      type: "article",
      publishedTime: mod.meta.date,
      images: mod.meta.image ? [{ url: mod.meta.image }] : [{ url: "/og-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: mod.meta.title,
      description: mod.meta.description,
      images: mod.meta.image ? [mod.meta.image] : ["/og-image.png"],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loader = POSTS[slug];
  if (!loader) notFound();

  const { meta, default: Content } = await loader();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-blue-600 text-sm hover:underline mb-6 inline-block">
        &larr; Back to blog
      </Link>
      <article className="prose prose-gray max-w-none">
        <h1>{meta.title}</h1>
        <p className="text-gray-500 text-sm">{meta.date}</p>
        <Content />
      </article>
      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-600 mb-4">Ready to try it yourself?</p>
        <Link
          href="/upload"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Try BgSwap Free &rarr;
        </Link>
      </div>
    </main>
  );
}
