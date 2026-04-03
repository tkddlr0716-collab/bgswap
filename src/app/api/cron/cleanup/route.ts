import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";
import { sendResumeEmail } from "@/lib/email";

const PARALLEL_LIMIT = 3;

// Vercel Cron — daily at 03:00
// Combines cleanup + stalled order processing + resume email
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await ensureDb();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // ── 1. Cleanup expired images ──
    const expired = await db.execute({
      sql: "SELECT id, r2_key, order_id FROM images WHERE expires_at < datetime('now')",
      args: [],
    });

    let deleted = 0;
    for (const row of expired.rows) {
      try {
        await deleteFromR2(row.r2_key as string);
        await db.execute({
          sql: "DELETE FROM images WHERE id = ?",
          args: [row.id as string],
        });
        deleted++;
      } catch (err) {
        console.error(`Failed to delete image ${row.id}:`, err);
      }
    }

    // Clean up orphan orders
    await db.execute({
      sql: `DELETE FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM images)
            AND created_at < datetime('now', '-7 days')`,
      args: [],
    });

    // Clean up old free_samples
    await db.execute({
      sql: "DELETE FROM free_samples WHERE created_at < datetime('now', '-30 days')",
      args: [],
    });

    // ── 2. Recover stuck processing images ──
    const stuckResult = await db.execute({
      sql: `UPDATE images SET process_status = 'pending', processing_started_at = NULL
            WHERE type = 'upload' AND process_status = 'processing'
              AND processing_started_at < datetime('now', '-90 seconds')`,
      args: [],
    });
    const unstuck = stuckResult.rowsAffected;

    // ── 3. Trigger stalled orders + send resume emails ──
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

    let triggered = 0;
    let notified = 0;

    for (const row of stalledOrders.rows) {
      const orderId = row.id as string;
      const email = row.email as string;
      const doneCount = row.done_count as number;
      const totalCount = row.total_count as number;
      const processingCount = row.processing_count as number;
      const pendingCount = row.pending_count as number;

      // Trigger processing
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

      // Send resume email (if not sent in last 30 min)
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
      deleted,
      expired: expired.rows.length,
      unstuck,
      stalledOrders: stalledOrders.rows.length,
      triggered,
      notified,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup cron error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
