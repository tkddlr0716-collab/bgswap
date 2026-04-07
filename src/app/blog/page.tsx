import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product Photography Blog - BgSwap",
  description:
    "Tips and guides for e-commerce product photography. Amazon, Etsy, Shopify photo requirements, backgrounds, and editing.",
  openGraph: {
    title: "Product Photography Blog - BgSwap",
    description:
      "Tips and guides for e-commerce product photography.",
  },
};

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
  { slug: "background-removal-looks-fake-fix", meta: { title: "Product Photo Looks Fake After Background Removal? 7 Fixes", description: "Your background removal looks unnatural? Here are 7 practical fixes for clean, realistic product photos that actually sell.", date: "2026-04-07", slug: "background-removal-looks-fake-fix" } },
  { slug: "amazon-product-photo-rejected-fix", meta: { title: "Why Amazon Keeps Rejecting Your Product Photos (and How to Fix Every Error)", description: "Amazon rejected your product images? Here's every common reason and the exact fix for each.", date: "2026-04-07", slug: "amazon-product-photo-rejected-fix" } },
  { slug: "ebay-product-photo-requirements", meta: { title: "eBay Product Photo Requirements 2026 — Complete Seller Guide", description: "Everything eBay sellers need to know about product photo requirements in 2026.", date: "2026-04-07", slug: "ebay-product-photo-requirements" } },
  { slug: "dropshipping-product-photos", meta: { title: "Dropshipping Product Photos: How to Make Supplier Images Look Professional", description: "Turn low-quality supplier photos into professional product images for your dropshipping store.", date: "2026-04-07", slug: "dropshipping-product-photos" } },
  { slug: "background-removal-api-ecommerce", meta: { title: "Background Removal API for E-commerce: Shopify, WooCommerce & Custom Stores", description: "Compare background removal APIs for e-commerce automation. Pricing, integration, and scaling.", date: "2026-04-07", slug: "background-removal-api-ecommerce" } },
  { slug: "edit-100-product-photos-fast", meta: { title: "How to Edit 100 Product Photos in 15 Minutes (Real Workflow)", description: "A real step-by-step workflow for editing 100 product photos in under 15 minutes.", date: "2026-04-07", slug: "edit-100-product-photos-fast" } },
  { slug: "product-photo-editing-cost-comparison", meta: { title: "Product Photo Editing: DIY vs Outsource vs AI (Real Cost Breakdown)", description: "What does product photo editing actually cost in 2026? Real numbers for every option.", date: "2026-04-07", slug: "product-photo-editing-cost-comparison" } },
  { slug: "amazon-image-slots-strategy", meta: { title: "7 Amazon Image Slots: What to Put in Each One (Data-Backed Strategy)", description: "How to use all 7 Amazon product image slots strategically.", date: "2026-04-07", slug: "amazon-image-slots-strategy" } },
  { slug: "aliexpress-supplier-photos-fix", meta: { title: "AliExpress to Shopify: How to Fix Supplier Photos in Bulk", description: "Turn low-quality AliExpress supplier photos into professional Shopify product images.", date: "2026-04-07", slug: "aliexpress-supplier-photos-fix" } },
  { slug: "dropshipping-store-looks-fake", meta: { title: "Why Your Dropshipping Store Looks Fake (And How to Fix It)", description: "Your Shopify store isn't converting because it looks fake. Here's how to fix it.", date: "2026-04-07", slug: "dropshipping-store-looks-fake" } },
  { slug: "freelance-product-photo-editor-workflow", meta: { title: "Freelance Product Photo Editor? How to 10x Your Output with AI", description: "How freelance editors and VAs can handle 10x more clients with AI batch processing.", date: "2026-04-07", slug: "freelance-product-photo-editor-workflow" } },
  { slug: "product-photos-that-increase-sales", meta: { title: "Which Product Photos Actually Increase Sales? What the Data Says", description: "Data-backed guide on which product photo elements improve conversion rates.", date: "2026-04-07", slug: "product-photos-that-increase-sales" } },
  { slug: "product-photo-lighting-setup-free", meta: { title: "Product Photo Lighting with Zero Budget — Window Light Guide", description: "How to light product photos using only a window. Positioning, diffusion, and reflectors from household items.", date: "2026-04-08", slug: "product-photo-lighting-setup-free" } },
  { slug: "amazon-listing-optimization-images-checklist", meta: { title: "Amazon Listing Image Audit: The Checklist That Catches What You Missed", description: "A systematic checklist to audit every image in your Amazon listing.", date: "2026-04-08", slug: "amazon-listing-optimization-images-checklist" } },
  { slug: "product-photo-mistakes-that-kill-sales", meta: { title: "12 Product Photo Mistakes That Kill Your Sales (With Fixes)", description: "The most common product photography mistakes and exactly how to fix each one.", date: "2026-04-08", slug: "product-photo-mistakes-that-kill-sales" } },
  { slug: "sell-more-on-etsy-with-better-photos", meta: { title: "Etsy Photos That Actually Sell: What Top Shops Do Differently", description: "What makes Etsy top sellers' photos work? 8 patterns you can copy today.", date: "2026-04-08", slug: "sell-more-on-etsy-with-better-photos" } },
  { slug: "product-photography-for-beginners-complete-guide", meta: { title: "Product Photography for Beginners: Start Selling Today (2026 Guide)", description: "The complete beginner's guide to product photography with just a phone and a window.", date: "2026-04-08", slug: "product-photography-for-beginners-complete-guide" } },
  { slug: "how-to-photograph-small-products-jewelry-accessories", meta: { title: "How to Photograph Small Products: Jewelry, Accessories & Miniatures", description: "Photographing jewelry, earrings, rings, and small accessories for e-commerce.", date: "2026-04-08", slug: "how-to-photograph-small-products-jewelry-accessories" } },
  { slug: "ai-tools-ecommerce-sellers-2026", meta: { title: "15 AI Tools Every E-commerce Seller Should Know in 2026 (Honest Reviews)", description: "A practical guide to AI tools for e-commerce: product research, copywriting, customer service, analytics, and image editing.", date: "2026-04-08", slug: "ai-tools-ecommerce-sellers-2026" } },
  { slug: "amazon-fba-fees-save-margin-2026", meta: { title: "Amazon FBA Fee Increases 2026: 10 Ways to Protect Your Margins", description: "Amazon FBA fees went up again in 2026. Here are 10 practical ways sellers are cutting costs.", date: "2026-04-08", slug: "amazon-fba-fees-save-margin-2026" } },
  { slug: "multichannel-selling-image-guide", meta: { title: "Multichannel Selling: One Product, 4 Platforms, Different Image Rules", description: "A practical guide to managing product images across Amazon, Etsy, Shopify, and eBay.", date: "2026-04-08", slug: "multichannel-selling-image-guide" } },
  { slug: "new-seller-first-100-sales-checklist", meta: { title: "First 100 Sales Checklist: What to Do Before, During, and After Launch", description: "A data-backed checklist for new e-commerce sellers from product research to your 100th sale.", date: "2026-04-08", slug: "new-seller-first-100-sales-checklist" } },
  { slug: "product-listing-anatomy-8-elements", meta: { title: "Product Listing Anatomy: The 8 Elements That Actually Move Conversion Rates", description: "Break down every element of a product listing and learn which ones have the biggest impact on sales.", date: "2026-04-08", slug: "product-listing-anatomy-8-elements" } },
  { slug: "reduce-product-returns-with-better-images", meta: { title: "How Better Product Images Cut Returns by 30-50% (The Data Behind It)", description: "Product returns are killing your margins. Research shows image quality directly reduces return rates.", date: "2026-04-08", slug: "reduce-product-returns-with-better-images" } },
  { slug: "shopify-traffic-no-sales-fix", meta: { title: "Shopify Store Has Traffic But No Sales? 10 Causes and What to Fix First", description: "Your Shopify store gets visitors but nobody buys. Here are 10 data-backed causes and fixes.", date: "2026-04-08", slug: "shopify-traffic-no-sales-fix" } },
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
