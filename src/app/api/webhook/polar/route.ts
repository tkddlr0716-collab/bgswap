import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { ensureDb } from "@/lib/db";
import { sendDownloadEmail } from "@/lib/email";
import { captureServerEvent } from "@/lib/analytics-server";

/**
 * Standard Webhooks signature verification
 * Spec: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
 *
 * Headers: webhook-id, webhook-timestamp, webhook-signature
 * Signed content: "{webhook-id}.{webhook-timestamp}.{payload}"
 * Signature format: "v1,{base64}" (HMAC-SHA256)
 * Secret format: "whsec_{base64key}" or raw base64
 */
function verifyStandardWebhook(
  payload: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string
): boolean {
  // Decode secret: strip "whsec_" prefix if present, then base64-decode
  const secretBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = Buffer.from(secretBase64, "base64");

  // Construct signed content: "{msg_id}.{timestamp}.{payload}"
  const signedContent = `${headers.id}.${headers.timestamp}.${payload}`;

  const hmac = crypto.createHmac("sha256", key);
  hmac.update(signedContent);
  const expected = hmac.digest("base64");

  // webhook-signature can contain multiple signatures (space-delimited) for key rotation
  const signatures = headers.signature.split(" ");
  for (const sig of signatures) {
    const [version, value] = sig.split(",", 2);
    if (version === "v1") {
      const expBuf = Buffer.from(expected);
      const gotBuf = Buffer.from(value || "");
      if (expBuf.length === gotBuf.length && crypto.timingSafeEqual(expBuf, gotBuf)) {
        return true;
      }
    }
  }
  return false;
}

async function triggerGenerateOne(baseUrl: string, orderId: string, imageId: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/api/generate-one`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
          Referer: baseUrl,
        },
        body: JSON.stringify({ orderId, imageId }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok || res.status === 409) return;
      console.error(`generate-one attempt ${attempt + 1}/${maxRetries} returned ${res.status} for image ${imageId}`);
    } catch (err) {
      console.error(`generate-one attempt ${attempt + 1}/${maxRetries} failed for image ${imageId}:`, err);
    }
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    }
  }
  console.error(`generate-one all ${maxRetries} attempts failed for image ${imageId}, order ${orderId}`);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    // Standard Webhooks headers
    const webhookId = req.headers.get("webhook-id") || "";
    const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
    const webhookSignature = req.headers.get("webhook-signature") || "";

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Missing Standard Webhooks headers");
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 401 });
    }

    // Reject timestamps older than 5 minutes (replay protection)
    const ts = parseInt(webhookTimestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      console.error("Webhook timestamp too old or invalid");
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 401 });
    }

    if (!verifyStandardWebhook(payload, { id: webhookId, timestamp: webhookTimestamp, signature: webhookSignature }, process.env.POLAR_WEBHOOK_SECRET!)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);

    if (event.type === "order.paid" || event.type === "checkout.completed") {
      const orderId = event.data?.metadata?.order_id;
      const customerEmail = event.data?.customer?.email || event.data?.email;

      if (!orderId) {
        console.error("No order_id in webhook metadata");
        return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
      }

      // Determine plan: prefer explicit metadata, fallback to product name/amount
      const metadataPlan = event.data?.metadata?.plan;
      let plan: string;
      if (metadataPlan === "pro" || metadataPlan === "starter") {
        plan = metadataPlan;
      } else {
        const amount = event.data?.amount || event.data?.product?.price?.amount || 0;
        const productName = (event.data?.product?.name || "").toLowerCase();
        plan = productName.includes("pro") || amount >= 2900 ? "pro" : "starter";
      }

      // Generate download token
      const downloadToken = uuidv4();
      const db = await ensureDb();

      // Update order status + plan
      await db.execute({
        sql: `UPDATE orders
              SET status = 'paid',
                  download_token = ?,
                  plan = ?,
                  paid_at = datetime('now')
              WHERE id = ?`,
        args: [downloadToken, plan, orderId],
      });

      // Trigger first batch of pending images
      const PARALLEL_LIMIT = 3;
      const pendingImages = await db.execute({
        sql: `SELECT id FROM images
              WHERE order_id = ? AND type = 'upload' AND process_status = 'pending'
              ORDER BY uploaded_at LIMIT ?`,
        args: [orderId, PARALLEL_LIMIT],
      });

      if (pendingImages.rows.length) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
          console.error("NEXT_PUBLIC_BASE_URL is not set — cannot trigger generate-one");
        } else {
          for (const row of pendingImages.rows) {
            triggerGenerateOne(baseUrl, orderId, row.id as string);
          }
        }
      }

      // Track payment event
      const amount = event.data?.amount || (plan === "pro" ? 2900 : 499);
      await captureServerEvent("payment_completed", customerEmail || orderId, {
        order_id: orderId,
        plan,
        amount_cents: amount,
        source: event.data?.metadata?.utm_source || "direct",
      });

      // Send download email with upload link
      if (customerEmail) {
        await sendDownloadEmail(customerEmail, downloadToken, orderId, plan).catch((err) =>
          console.error("Email send failed:", err)
        );
      }

      return NextResponse.json({ received: true, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
