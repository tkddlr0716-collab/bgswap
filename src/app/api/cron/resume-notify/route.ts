import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { sendResumeEmail } from "@/lib/email";

const PARALLEL_LIMIT = 3;

// Runs every 5 minutes via Vercel Cron
// 1. Recovers stuck processing images (>90s)
// 2. Triggers generate-one for stalled orders (browser closed)
// 3. Sends resume email if user hasn't returned
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await ensureDb();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    let triggered = 0;
    let notified = 0;
    let unstuck = 0;

    // ── Step 1: Recover stuck processing images globally ──
    const stuckResult = await db.execute({
      sql: `UPDATE images SET process_status = 'pending', processing_started_at = NULL
            WHERE type = 'upload' AND process_status = 'processing'
              AND processing_started_at < datetime('now', '-90 seconds')`,
      args: [],
    });
    unstuck = stuckResult.rowsAffected;
    if (unstuck > 0) {
      console.log(`Cron: recovered ${unstuck} stuck processing image(s)`);
    }

    // ── Step 2: Find paid orders with pending images and no active processing ──
    const stalledOrders = await db.execute({
      sql: `SELECT o.id, o.email, o.resume_email_sent_at,
              (SELECT COUNT(*) FROM images WHERE order_id = o.id AND type = 'upload' AND process_status = 'done') as done_count,
              (SELECT COUNT(*) FROM images WHERE order_id = o.id AND type = 'upload') as total_count,
              (SELECT COUNT(*) FROM images WHERE order_id = o.id AND type = 'upload' AND process_status = 'processing') as processing_count,
              (SELECT COUNT(*) FROM images WHERE order_id = o.id AND type = 'upload' AND process_status = 'pending') as pending_count
            FROM orders o
            WHERE o.status IN ('paid', 'completed')
              AND o.paid_at < datetime('now', '-2 minutes')
              AND EXISTS (
                SELECT 1 FROM images
                WHERE order_id = o.id AND type = 'upload'
                  AND process_status = 'pending'
              )`,
      args: [],
    });

    for (const row of stalledOrders.rows) {
      const orderId = row.id as string;
      const email = row.email as string;
      const doneCount = row.done_count as number;
      const totalCount = row.total_count as number;
      const processingCount = row.processing_count as number;
      const pendingCount = row.pending_count as number;

      // ── Step 2a: Trigger processing (server-side, no browser needed) ──
      const slotsAvailable = PARALLEL_LIMIT - processingCount;
      if (slotsAvailable > 0 && pendingCount > 0) {
        const toTrigger = Math.min(slotsAvailable, pendingCount);
        const pending = await db.execute({
          sql: `SELECT id FROM images
                WHERE order_id = ? AND type = 'upload' AND process_status = 'pending'
                ORDER BY uploaded_at LIMIT ?`,
          args: [orderId, toTrigger],
        });

        for (const img of pending.rows) {
          fetch(`${baseUrl}/api/generate-one`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, imageId: img.id }),
          }).catch((err) => console.error(`Cron generate-one trigger failed:`, err));
          triggered++;
        }
      }

      // ── Step 2b: Send resume email (only if not sent recently) ──
      const resumeSentAt = row.resume_email_sent_at as string | null;
      const shouldEmail =
        !resumeSentAt ||
        new Date(resumeSentAt).getTime() < Date.now() - 30 * 60 * 1000;

      if (shouldEmail && processingCount === 0) {
        try {
          await sendResumeEmail(email, orderId, doneCount, totalCount);
          await db.execute({
            sql: "UPDATE orders SET resume_email_sent_at = datetime('now') WHERE id = ?",
            args: [orderId],
          });
          notified++;
        } catch (err) {
          console.error(`Failed to send resume email for ${orderId}:`, err);
        }
      }
    }

    return NextResponse.json({
      checked: stalledOrders.rows.length,
      triggered,
      notified,
      unstuck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Resume-notify cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
