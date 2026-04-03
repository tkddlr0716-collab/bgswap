import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendResumeEmail(
  to: string,
  orderId: string,
  processedCount: number,
  totalCount: number
): Promise<void> {
  const resumeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/result/${orderId}`;
  const remaining = totalCount - processedCount;

  await getResend().emails.send({
    from: "BgSwap <noreply@bgswap.io>",
    to,
    subject: `Resume Processing — ${remaining} products remaining`,
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@bgswap.io?subject=unsubscribe>`,
    },
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Your processing was paused</h1>
        <p>It looks like the browser was closed while your products were being processed.</p>
        <p style="background: #f0f9ff; padding: 12px 16px; border-radius: 8px; color: #1e40af;">
          <strong>${processedCount}</strong> of <strong>${totalCount}</strong> products completed &middot;
          <strong>${remaining}</strong> remaining
        </p>
        <p>Click below to resume processing. It will continue right where it left off.</p>
        <a href="${resumeUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Resume Processing
        </a>
        <p style="color: #666; font-size: 14px;">
          Processing continues automatically. Estimated ~${Math.ceil(remaining * 10 / 60 / 3)} min for the remaining products.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/refund">Refund Policy</a> &middot;
          <a href="mailto:unsubscribe@bgswap.io?subject=unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  });
}

export async function sendDownloadEmail(
  to: string,
  downloadToken: string,
  orderId?: string,
  plan?: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;
  const uploadUrl = orderId ? `${baseUrl}/order/${orderId}/upload` : null;
  const resultUrl = orderId ? `${baseUrl}/result/${orderId}` : null;
  const maxProducts = plan === "pro" ? 100 : 10;

  await getResend().emails.send({
    from: "BgSwap <noreply@bgswap.io>",
    to,
    subject: "Your Product Photos are Ready!",
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@bgswap.io?subject=unsubscribe>`,
    },
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Your product photos are ready!</h1>
        <p>Thank you for your purchase. Your product photos with clean backgrounds have been generated.</p>
        <a href="${downloadUrl}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Download Your Photos
        </a>
        ${uploadUrl ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #166534;">
            Upload more products (up to ${maxProducts} total)
          </p>
          <p style="margin: 0 0 12px; color: #15803d; font-size: 14px;">
            Your ${plan === "pro" ? "Pro" : "Starter"} plan includes ${maxProducts} products with 15 backgrounds each.
            Bookmark this link to upload more anytime within 7 days.
          </p>
          <a href="${uploadUrl}"
             style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px;
                    text-decoration: none; border-radius: 6px; font-size: 14px;">
            Upload More Products
          </a>
        </div>
        ` : ""}
        ${resultUrl ? `
        <p style="color: #666; font-size: 14px;">
          <a href="${resultUrl}" style="color: #2563eb;">View your order status</a>
        </p>
        ` : ""}
        <p style="color: #666; font-size: 14px;">
          These links expire in 7 days. Save this email to access them later.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          <a href="${baseUrl}/refund">Refund Policy</a> &middot;
          <a href="mailto:unsubscribe@bgswap.io?subject=unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  });
}
