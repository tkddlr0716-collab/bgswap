const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://bgswap.io";

const faqData = [
  { q: "How does it work?", a: "Upload a product photo. Our AI removes the background in seconds and places your product on 15 professional backgrounds — solids, gradients, and textures." },
  { q: "What kind of photos work?", a: "Any product photo — phone camera, supplier image, or existing listing. Works best when the product is clearly visible." },
  { q: "Does it modify my product?", a: "No. Your product stays pixel-perfect. We only remove and replace the background." },
  { q: "Will these pass Amazon requirements?", a: "Yes. Our white background output meets Amazon's pure white (#FFFFFF) requirement. Also works for Etsy, eBay, Shopify, and all other marketplaces." },
  { q: "How fast is it?", a: "Under 30 seconds per product. 100 products take about 10–15 minutes with parallel processing." },
  { q: "What if I'm not satisfied?", a: "We offer a free re-generation plus a full refund within 7 days. No questions asked." },
  { q: "Are my photos stored?", a: "All photos are automatically deleted after 7 days. We don't keep your data." },
];

export function LandingJsonLd() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BgSwap",
    description: "AI-powered product photo background removal and replacement for e-commerce sellers",
    url: BASE_URL,
    applicationCategory: "PhotographyApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "4.99",
        priceCurrency: "USD",
        description: "10 products, 15 backgrounds each",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "29",
        priceCurrency: "USD",
        description: "100 products, 15 backgrounds each",
      },
    ],
    featureList: [
      "AI background removal",
      "15 professional backgrounds per photo",
      "Amazon pure white (#FFFFFF) compliance",
      "Batch processing up to 100 products",
      "Realistic drop shadows",
      "ZIP download and email delivery",
      "No subscription required",
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BgSwap",
    url: BASE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@bgswap.io",
      contactType: "customer support",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </>
  );
}
