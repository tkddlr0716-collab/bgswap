import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const db = await ensureDb();

    // Verify order exists and is paid/completed
    const order = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ? AND status IN ('paid', 'completed')",
      args: [orderId],
    });
    if (!order.rows.length) {
      return NextResponse.json({ error: "Order not found or not paid" }, { status: 404 });
    }

    // Reset failed images back to pending
    const reset = await db.execute({
      sql: `UPDATE images SET process_status = 'pending', processing_started_at = NULL
            WHERE order_id = ? AND type = 'upload' AND process_status = 'failed'`,
      args: [orderId],
    });

    if (!reset.rowsAffected) {
      return NextResponse.json({ error: "No failed images to retry" }, { status: 400 });
    }

    // If order was completed, set back to paid so polling resumes
    await db.execute({
      sql: "UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'completed'",
      args: [orderId],
    });

    // Trigger processing for reset images
    const PARALLEL_LIMIT = 3;
    const pendingImages = await db.execute({
      sql: `SELECT id FROM images
            WHERE order_id = ? AND type = 'upload' AND process_status = 'pending'
            ORDER BY uploaded_at LIMIT ?`,
      args: [orderId, PARALLEL_LIMIT],
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl && pendingImages.rows.length) {
      for (const row of pendingImages.rows) {
        fetch(`${baseUrl}/api/generate-one`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: baseUrl,
            Referer: baseUrl,
          },
          body: JSON.stringify({ orderId, imageId: row.id }),
        }).catch((err) => console.error("Retry trigger failed:", err));
      }
    }

    return NextResponse.json({
      retried: reset.rowsAffected,
      message: `${reset.rowsAffected} failed image(s) queued for retry`,
    });
  } catch (error) {
    console.error("Retry error:", error);
    return NextResponse.json({ error: "Retry failed" }, { status: 500 });
  }
}
