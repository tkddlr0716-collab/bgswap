import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ensureDb } from "@/lib/db";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { removeBackground } from "@/lib/replicate";
import {
  compositeProductOnBg,
  compositeProductOnGradient,
  compositeProductOnTexture,
  BG_OPTIONS,
  GRADIENT_OPTIONS,
  TEXTURE_OPTIONS,
  validateHexColor,
  MARKETPLACE_PRESETS,
} from "@/lib/compositor";
import type { CompositeOptions } from "@/lib/compositor";

export async function POST(req: NextRequest) {
  try {
    const { orderId, imageId } = await req.json();

    if (!orderId || !imageId) {
      return NextResponse.json(
        { error: "orderId and imageId required" },
        { status: 400 }
      );
    }

    const db = await ensureDb();

    // Verify order is paid
    const order = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ? AND status IN ('paid', 'completed')",
      args: [orderId],
    });
    if (!order.rows.length) {
      return NextResponse.json(
        { error: "Order not found or not paid" },
        { status: 404 }
      );
    }

    // Atomic claim: pending → processing (prevents duplicate processing)
    const claim = await db.execute({
      sql: `UPDATE images SET process_status = 'processing', processing_started_at = datetime('now')
            WHERE id = ? AND order_id = ? AND type = 'upload' AND process_status = 'pending'`,
      args: [imageId, orderId],
    });

    if (!claim.rowsAffected) {
      return NextResponse.json(
        { error: "Image not available for processing (already processing or done)" },
        { status: 409 }
      );
    }

    // Get image details
    const image = await db.execute({
      sql: "SELECT * FROM images WHERE id = ?",
      args: [imageId],
    });
    if (!image.rows.length) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const r2Key = image.rows[0].r2_key as string;
    const imageUrl = getPublicUrl(r2Key);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parse saved options
    const savedOptions = order.rows[0].options
      ? JSON.parse(order.rows[0].options as string)
      : {};

    const { customColor, shadow, padding, marketplace, enhance } = savedOptions;

    const extraBgs = [];
    if (customColor) {
      const parsed = validateHexColor(customColor);
      if (parsed) {
        extraBgs.push({ name: "custom", label: "Custom", color: parsed });
      }
    }
    const allBgs = [...BG_OPTIONS, ...extraBgs];

    const preset = marketplace && MARKETPLACE_PRESETS[marketplace];
    const compositeOpts: CompositeOptions = {
      size: preset ? preset.size : 2048,
      shadow: shadow === true,
      padding: typeof padding === "number" ? padding : 0.8,
      enhance: enhance === true,
    };

    // Determine upload index for this image
    const allUploads = await db.execute({
      sql: "SELECT id FROM images WHERE order_id = ? AND type = 'upload' ORDER BY uploaded_at",
      args: [orderId],
    });
    const uploadIdx = allUploads.rows.findIndex((r) => r.id === imageId);

    try {
      // ── Step 1: Remove background (Replicate ~2s) ──
      const removedUrl = await removeBackground(imageUrl);

      // Fetch removed image with retry (Replicate URLs can be flaky)
      let removedPng: Buffer;
      for (let fetchAttempt = 0; ; fetchAttempt++) {
        const res = await fetch(removedUrl, { signal: AbortSignal.timeout(15_000) });
        if (res.ok) {
          removedPng = Buffer.from(await res.arrayBuffer());
          break;
        }
        if (fetchAttempt >= 2) throw new Error(`Failed to fetch removed image: ${res.status}`);
        console.warn(`Fetch removed image attempt ${fetchAttempt + 1} failed (${res.status}), retrying...`);
        await new Promise(r => setTimeout(r, (fetchAttempt + 1) * 1000));
      }

      // ── Step 2: Composite all 15 backgrounds in parallel (Sharp) ──
      const compositeJobs = [
        // Solid backgrounds
        ...allBgs.map(async (bg) => ({
          name: bg.name,
          buffer: await compositeProductOnBg(removedPng, bg.color, compositeOpts),
        })),
        // Gradient backgrounds
        ...GRADIENT_OPTIONS.map(async (grad) => ({
          name: grad.name,
          buffer: await compositeProductOnGradient(removedPng, grad, compositeOpts),
        })),
        // Texture backgrounds
        ...TEXTURE_OPTIONS.map(async (tex) => ({
          name: tex.name,
          buffer: await compositeProductOnTexture(removedPng, tex, compositeOpts),
        })),
      ];

      const composited = await Promise.all(compositeJobs);

      // ── Step 3: Upload all to R2 in parallel (removed + 15 results) ──
      const removedKey = `removed/${orderId}/product-${uploadIdx}.png`;
      const removedId = uuidv4();

      const uploadJobs = [
        // Upload removed background
        uploadToR2(removedKey, removedPng, "image/png"),
        // Upload all composited results
        ...composited.map((c) => {
          const id = uuidv4();
          const key = `results/${orderId}/${id}-p${uploadIdx}-${c.name}.jpg`;
          (c as { name: string; buffer: Buffer; id: string; key: string }).id = id;
          (c as { name: string; buffer: Buffer; id: string; key: string }).key = key;
          return uploadToR2(key, c.buffer, "image/jpeg");
        }),
      ];

      await Promise.all(uploadJobs);

      // ── Step 4: Batch DB inserts ──
      const stmts: { sql: string; args: (string | null)[] }[] = [
        {
          sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, expires_at)
                VALUES (?, ?, ?, 'removed', 'high', ?)`,
          args: [removedId, orderId, removedKey, expiresAt],
        },
        ...composited.map((c) => {
          const typed = c as { name: string; buffer: Buffer; id: string; key: string };
          return {
            sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, style, expires_at)
                  VALUES (?, ?, ?, 'generated', 'high', ?, ?)`,
            args: [typed.id, orderId, typed.key, typed.name, expiresAt],
          };
        }),
      ];

      await db.batch(stmts);

      // Mark as done
      await db.execute({
        sql: "UPDATE images SET process_status = 'done' WHERE id = ?",
        args: [imageId],
      });

      // Check if all images are done → mark order completed
      const remaining = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM images
              WHERE order_id = ? AND type = 'upload' AND process_status IN ('pending', 'processing')`,
        args: [orderId],
      });
      if ((remaining.rows[0].cnt as number) === 0) {
        await db.execute({
          sql: "UPDATE orders SET status = 'completed' WHERE id = ?",
          args: [orderId],
        });
      }

      return NextResponse.json({
        imageId,
        status: "done",
        uploadIndex: uploadIdx,
      });
    } catch (error) {
      // Mark as failed on error, clear processing timestamp
      await db.execute({
        sql: "UPDATE images SET process_status = 'failed', processing_started_at = NULL WHERE id = ?",
        args: [imageId],
      });
      throw error;
    }
  } catch (error) {
    console.error("Generate-one error:", error);
    return NextResponse.json(
      { error: "Processing failed for this image." },
      { status: 500 }
    );
  }
}
