export const metadata = { title: "Refund Policy - BgSwap" };

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <h1>Refund Policy</h1>
      <p className="text-sm text-gray-500">Last updated: March 30, 2026</p>

      <h2>Try Before You Buy</h2>
      <p>
        We offer a <strong>free preview product photo</strong> before you pay. This
        lets you evaluate the quality of our AI generation before committing to a
        purchase. Because of this, our default stance is that purchases are final.
      </p>

      <h2>If You&apos;re Not Satisfied</h2>
      <p>We want you to be happy with your product photos. If you&apos;re not:</p>

      <h3>Step 1: Free Re-generation</h3>
      <p>
        Contact us within 7 days of purchase and we&apos;ll generate a new set
        of 10 product photos with different styles and settings — at no extra cost.
      </p>

      <h3>Step 2: Full Refund</h3>
      <p>
        If the re-generated product photos still don&apos;t meet your expectations,
        we&apos;ll issue a <strong>full refund within 7 days</strong> of your
        original purchase. No questions asked.
      </p>

      <h2>How to Request</h2>
      <p>
        Email <strong>support@bgswap.io</strong> with your order details.
        We aim to respond within 24 hours.
      </p>

      <h2>Refund Processing</h2>
      <p>
        Refunds are processed through Polar.sh (our payment processor) and
        typically appear on your statement within 5-10 business days.
      </p>
    </main>
  );
}
