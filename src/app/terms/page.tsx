export const metadata = { title: "Terms of Service - BgSwap" };

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: March 30, 2026</p>

      <h2>1. Service Description</h2>
      <p>
        BgSwap uses artificial intelligence to generate professional product
        photos by removing and replacing backgrounds from user-uploaded product images. Backgrounds are generated or composited by AI
        and may not perfectly replicate real photography.
      </p>

      <h2>2. Acceptable Use</h2>
      <p>You agree to:</p>
      <ul>
        <li>Upload only photos of <strong>products you own or have rights to</strong></li>
        <li>Not upload photos that infringe on others&apos; intellectual property</li>
        <li>Not use the service for impersonation, fraud, or any illegal purpose</li>
        <li>Not attempt to abuse the free sample feature (automated requests, fake emails, etc.)</li>
      </ul>

      <h2>3. Intellectual Property</h2>
      <ul>
        <li>You retain ownership of your uploaded photos.</li>
        <li>Generated products are <strong>yours to use</strong> for personal and commercial purposes.</li>
        <li>You grant us a temporary license to process your photos solely for product generation.</li>
      </ul>

      <h2>4. AI-Generated Content</h2>
      <p>
        All products produced by this service are AI-generated. Results may vary
        in quality and likeness. We do not guarantee that generated images will be
        suitable for any specific purpose. Generated images are labeled as
        AI-generated in their metadata.
      </p>
      <p>
        Images are processed using AI technology (via Replicate). The output images are
        derivative works of your original photos. You retain full commercial usage
        rights to the processed images. BgSwap does not claim ownership of your
        input or output images.
      </p>

      <h2>5. Payment</h2>
      <ul>
        <li>Starter: $4.99 USD for 10 products. Pro: $29 USD for 100 products. (one-time payment)</li>
        <li>Payments are processed by Polar.sh, our Merchant of Record.</li>
        <li>Applicable taxes are handled by Polar.sh.</li>
      </ul>

      <h2>6. Payment Processing</h2>
      <p>
        All payments are securely processed by Polar.sh (polar.sh). BgSwap does
        not store or have access to your credit card information.
      </p>

      <h2>7. License</h2>
      <p>
        Upon purchase, you receive a perpetual, non-exclusive, worldwide license
        to use the generated images for commercial purposes, including but not
        limited to marketplace listings, website product pages, and marketing
        materials.
      </p>

      <h2>8. Refunds</h2>
      <p>See our <a href="/refund">Refund Policy</a> for details.</p>

      <h2>9. Data Handling</h2>
      <p>
        All uploaded and generated images are automatically deleted after 7 days.
        See our <a href="/privacy">Privacy Policy</a> for full details.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        BgSwap is provided &quot;as is&quot; without warranties of any kind. We are not
        liable for any damages arising from the use of this service, including but
        not limited to dissatisfaction with generated results.
      </p>

      <h2>11. Termination</h2>
      <p>
        We reserve the right to refuse service or terminate access for violation
        of these terms, particularly for uploading infringing content or abusing
        the free sample feature.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These terms are governed by the laws of the Republic of Korea. Any
        disputes shall first be addressed through good faith negotiation. If
        unresolved within 30 days, disputes shall be submitted to the competent
        court in the Republic of Korea based on the company&apos;s registered business
        address.
      </p>

      <h2>13. Changes to Terms</h2>
      <p>
        We will notify users of material changes via email (if provided) and a
        prominent notice on our website at least 30 days before changes take
        effect. Continued use after changes constitutes acceptance.
      </p>

      <h2>14. Contact</h2>
      <p>Questions: <strong>support@bgswap.io</strong></p>
    </main>
  );
}
