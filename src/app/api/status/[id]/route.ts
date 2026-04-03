import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const db = await ensureDb();

    const order = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ?",
      args: [orderId],
    });

    if (!order.rows.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const status = order.rows[0].status as string;

    // Get preview image if available
    const previews = await db.execute({
      sql: "SELECT * FROM images WHERE order_id = ? AND type = 'free_sample'",
      args: [orderId],
    });

    const previewUrl = previews.rows.length
      ? getPublicUrl(previews.rows[0].r2_key as string)
      : null;

    const previewImages = previews.rows.map((row) => ({
      style: row.style as string,
      url: getPublicUrl(row.r2_key as string),
    }));

    // Get generated count
    const generated = await db.execute({
      sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = ? AND type = 'generated'",
      args: [orderId],
    });

    // Count uploaded images
    const uploads = await db.execute({
      sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = ? AND type = 'upload'",
      args: [orderId],
    });

    // Process status counts for bulk progress
    const processStatusCounts = await db.execute({
      sql: `SELECT process_status, COUNT(*) as cnt FROM images
            WHERE order_id = ? AND type = 'upload'
            GROUP BY process_status`,
      args: [orderId],
    });

    const processCounts: Record<string, number> = {};
    for (const row of processStatusCounts.rows) {
      processCounts[row.process_status as string] = row.cnt as number;
    }

    const totalUploads = (uploads.rows[0].cnt as number) || 0;
    const doneCount = processCounts["done"] || 0;
    const processingCount = processCounts["processing"] || 0;
    const pendingCount = processCounts["pending"] || 0;
    const failedCount = processCounts["failed"] || 0;

    // Recover stuck processing: if processing for >90 seconds, reset to pending
    // This handles server restarts, crashes, or Vercel function timeouts
    if (processingCount > 0) {
      const unstuck = await db.execute({
        sql: `UPDATE images SET process_status = 'pending', processing_started_at = NULL
              WHERE order_id = ? AND type = 'upload' AND process_status = 'processing'
                AND processing_started_at < datetime('now', '-90 seconds')`,
        args: [orderId],
      });
      if (unstuck.rowsAffected > 0) {
        console.log(`Recovered ${unstuck.rowsAffected} stuck processing image(s) for order ${orderId}`);
      }
    }

    // Auto-retry failed images (max 2 retries) — reset to pending with incremented retry_count
    let retriedCount = 0;
    if (
      (status === "paid" || status === "completed") &&
      failedCount > 0 &&
      pendingCount === 0 &&
      processingCount === 0
    ) {
      const retried = await db.execute({
        sql: `UPDATE images
              SET process_status = 'pending', retry_count = COALESCE(retry_count, 0) + 1
              WHERE order_id = ? AND type = 'upload'
                AND process_status = 'failed' AND COALESCE(retry_count, 0) < 3`,
        args: [orderId],
      });
      retriedCount = retried.rowsAffected;

      // If nothing was retried, all failed images have exhausted retries.
      // Mark order as completed (partial results delivered).
      if (retriedCount === 0) {
        const stillActive = await db.execute({
          sql: `SELECT COUNT(*) as cnt FROM images
                WHERE order_id = ? AND type = 'upload'
                  AND process_status IN ('pending', 'processing')`,
          args: [orderId],
        });
        if ((stillActive.rows[0].cnt as number) === 0 && status !== "completed") {
          await db.execute({
            sql: "UPDATE orders SET status = 'completed' WHERE id = ?",
            args: [orderId],
          });
        }
      }
    }

    // Parallel processing: up to 3 concurrent generate-one calls
    const PARALLEL_LIMIT = 3;

    // Re-check counts after potential retry reset
    const currentPendingCount = retriedCount > 0
      ? (await db.execute({
          sql: `SELECT COUNT(*) as cnt FROM images
                WHERE order_id = ? AND type = 'upload' AND process_status = 'pending'`,
          args: [orderId],
        })).rows[0].cnt as number
      : pendingCount;

    const currentProcessingCount = retriedCount > 0
      ? (await db.execute({
          sql: `SELECT COUNT(*) as cnt FROM images
                WHERE order_id = ? AND type = 'upload' AND process_status = 'processing'`,
          args: [orderId],
        })).rows[0].cnt as number
      : processingCount;

    const slotsAvailable = PARALLEL_LIMIT - currentProcessingCount;

    if (
      (status === "paid" || status === "completed") &&
      currentPendingCount > 0 &&
      slotsAvailable > 0
    ) {
      const toTrigger = Math.min(slotsAvailable, currentPendingCount);
      const nextPending = await db.execute({
        sql: `SELECT id FROM images
              WHERE order_id = ? AND type = 'upload' AND process_status = 'pending'
              ORDER BY uploaded_at LIMIT ?`,
        args: [orderId, toTrigger],
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL is not set — cannot trigger generate-one");
      } else {
        for (const row of nextPending.rows) {
          fetch(`${baseUrl}/api/generate-one`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: baseUrl,
              Referer: baseUrl,
            },
            body: JSON.stringify({
              orderId,
              imageId: row.id,
            }),
          }).then((res) => {
            if (!res.ok && res.status !== 409) {
              console.error(`generate-one returned ${res.status} for image ${row.id}`);
            }
          }).catch((err) => console.error("Generate-one trigger failed:", err));
        }
      }
    }

    // For completed orders, return generated image details
    let generatedImages: { id: string; url: string; style: string; uploadIndex: number }[] = [];
    if (status === "completed" || doneCount > 0) {
      const genRows = await db.execute({
        sql: "SELECT id, r2_key, style FROM images WHERE order_id = ? AND type = 'generated' ORDER BY r2_key",
        args: [orderId],
      });
      generatedImages = genRows.rows.map((row) => {
        const r2Key = row.r2_key as string;
        const match = r2Key.match(/-p(\d+)-/);
        const uploadIndex = match ? parseInt(match[1], 10) : 0;
        return {
          id: row.id as string,
          url: getPublicUrl(r2Key),
          style: row.style as string,
          uploadIndex,
        };
      });
    }

    // Re-query fresh counts after all mutations (stuck recovery, retry resets)
    const freshCounts = await db.execute({
      sql: `SELECT process_status, COUNT(*) as cnt FROM images
            WHERE order_id = ? AND type = 'upload'
            GROUP BY process_status`,
      args: [orderId],
    });
    const fresh: Record<string, number> = {};
    for (const row of freshCounts.rows) {
      fresh[row.process_status as string] = row.cnt as number;
    }

    // Re-read order status (may have changed to 'completed')
    const freshOrder = await db.execute({
      sql: "SELECT status FROM orders WHERE id = ?",
      args: [orderId],
    });
    const freshStatus = (freshOrder.rows[0]?.status as string) || status;

    return NextResponse.json({
      orderId,
      status: freshStatus,
      previewUrl,
      previewImages,
      generatedCount: (generated.rows[0].cnt as number) || 0,
      uploadCount: totalUploads,
      downloadToken: order.rows[0].download_token || null,
      generatedImages,
      plan: order.rows[0].plan || null,
      // Bulk processing progress — fresh values after mutations
      processedCount: fresh["done"] || 0,
      processingCount: fresh["processing"] || 0,
      pendingCount: fresh["pending"] || 0,
      failedCount: fresh["failed"] || 0,
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
