export const metadata = { title: "Privacy Policy - BgSwap" };

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: March 30, 2026</p>

      <h2>1. What We Collect</h2>
      <ul>
        <li><strong>Email address</strong> — to send your download link</li>
        <li><strong>Uploaded photos</strong> — to generate product images</li>
        <li><strong>Generated images</strong> — your AI product images</li>
        <li><strong>IP address</strong> — for abuse prevention</li>
        <li><strong>Payment information</strong> — processed by Polar.sh (we never see your card details)</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>Generate AI product images from your uploaded photos</li>
        <li>Send you a download link via email</li>
        <li>Prevent abuse of the free sample feature</li>
      </ul>
      <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

      <h2>3. Third-Party Processors</h2>
      <p>We use the following services to operate:</p>
      <ul>
        <li><strong>Replicate</strong> — AI image generation (receives your uploaded photos)</li>
        <li><strong>Cloudflare R2</strong> — image storage</li>
        <li><strong>Polar.sh</strong> — payment processing</li>
        <li><strong>Resend</strong> — email delivery</li>
        <li><strong>Vercel</strong> — website hosting</li>
      </ul>

      <h2>4. Data Retention & Deletion</h2>
      <ul>
        <li>Uploaded photos and generated images are <strong>automatically deleted after 7 days</strong>.</li>
        <li>We do not create backups of your images.</li>
        <li>Server logs (IP, timestamps) are retained for 30 days, then deleted.</li>
        <li>Email addresses are retained for customer support purposes.</li>
      </ul>

      <h2>5. Applicable Laws</h2>
      <p>This policy complies with GDPR (EU), CCPA (California), and PIPA (Republic of Korea).</p>

      <h2>6. Your Rights (Data Subject Rights)</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Right to access your personal data</li>
        <li>Right to rectification</li>
        <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
        <li>Right to data portability</li>
        <li>Right to restrict processing</li>
        <li>Right to object to processing</li>
        <li>Request immediate deletion of your photos and generated images</li>
        <li>Request a copy of your personal data</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p><strong>For CCPA:</strong> Right to know, right to delete, right to opt-out of sale (we do not sell data).</p>
      <p>To exercise these rights, email us at <strong>support@bgswap.io</strong>.</p>

      <h2>7. Image Processing</h2>
      <p>
        Your product photos are processed solely to remove backgrounds and generate professional product images.
        By uploading photos and checking the consent box, you explicitly consent to
        this processing. Your photos are sent to our AI provider (Replicate) for
        generation and are not used for any other purpose.
      </p>

      <h2>8. Cookies</h2>
      <p>We use minimal cookies for essential site functionality. We do not use tracking cookies for advertising.</p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Type</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>cookie_consent</td>
            <td>Stores your cookie consent choice</td>
            <td>Essential</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>ph_distinct_id</td>
            <td>Anonymous analytics identifier</td>
            <td>Analytics (after consent)</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>Polar.sh session</td>
            <td>Payment processing</td>
            <td>Essential</td>
            <td>Session</td>
          </tr>
          <tr>
            <td>__cf_bm, __cflb</td>
            <td>Cloudflare bot protection/load balancing</td>
            <td>Essential (third-party)</td>
            <td>30 min</td>
          </tr>
        </tbody>
      </table>

      <h2>9. Data Processing</h2>
      <ul>
        <li><strong>Photos:</strong> Processed by AI (via Replicate). Automatically deleted after 7 days.</li>
        <li><strong>Payment:</strong> Processed by Polar.sh. We do not store credit card information.</li>
        <li><strong>Email:</strong> Used only to send download links via Resend. Not shared with third parties.</li>
        <li><strong>Analytics:</strong> PostHog (only with consent). Anonymous, no personal data sold.</li>
      </ul>

      <h2>10. Children</h2>
      <p>This service is not intended for anyone under 18 years of age.</p>

      <h2>11. Changes</h2>
      <p>We may update this policy. Changes will be posted on this page with an updated date.</p>

      <h2>12. Contact</h2>
      <p>For privacy-related questions: <strong>support@bgswap.io</strong></p>
    </main>
  );
}
