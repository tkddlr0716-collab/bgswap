import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ensureDb } from "@/lib/db";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { removeBackground } from "@/lib/replicate";
import { compositeAllBackgrounds, createFreePreview, createFreePreviewAll, BG_OPTIONS, GRADIENT_OPTIONS, TEXTURE_OPTIONS, compositeProductOnGradient, compositeProductOnTexture, validateHexColor, MARKETPLACE_PRESETS } from "@/lib/compositor";
import type { CompositeOptions } from "@/lib/compositor";
import {
  isDisposableEmail,
  hasUsedFreeSample,
  checkRateLimit,
  verifyRecaptcha,
} from "@/lib/security";

const FREE_SAMPLE_DAILY_CAP = 100;

export async function POST(req: NextRequest) {
  try {
    const { orderId, mode, recaptchaToken, customColor, shadow, padding, marketplace, enhance } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateCheck = checkRateLimit(`generate:${ip}`, 5, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const db = await ensureDb();

    const order = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ?",
      args: [orderId],
    });
    if (!order.rows.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get all uploaded images
    const allUploads = await db.execute({
      sql: "SELECT * FROM images WHERE order_id = ? AND type = 'upload'",
      args: [orderId],
    });
    if (!allUploads.rows.length) {
      return NextResponse.json({ error: "No uploaded images" }, { status: 400 });
    }

    // For free mode, use first image only. For paid, process all.
    const r2Key = allUploads.rows[0].r2_key as string;
    const imageUrl = getPublicUrl(r2Key);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Owner IP — bypass free sample limits
    const OWNER_IPS = new Set((process.env.OWNER_IPS || "").split(",").map(s => s.trim()).filter(Boolean));
    const isOwner = OWNER_IPS.has(ip);

    // ── FREE MODE ──
    if (mode === "free") {
      if (recaptchaToken) {
        const valid = await verifyRecaptcha(recaptchaToken);
        if (!valid) {
          return NextResponse.json({ error: "reCAPTCHA failed" }, { status: 403 });
        }
      }

      const email = order.rows[0].email as string;
      if (isDisposableEmail(email)) {
        return NextResponse.json({ error: "Please use a real email" }, { status: 400 });
      }
      if (!isOwner && await hasUsedFreeSample(ip, email)) {
        return NextResponse.json({ error: "Free sample limit reached" }, { status: 429 });
      }

      const today = new Date().toISOString().split("T")[0];
      const dailyCount = await db.execute({
        sql: "SELECT COUNT(*) as cnt FROM free_samples WHERE created_at >= ?",
        args: [`${today}T00:00:00`],
      });
      if (!isOwner && ((dailyCount.rows[0].cnt as number) || 0) >= FREE_SAMPLE_DAILY_CAP) {
        return NextResponse.json(
          { error: "Free samples sold out today. Come back tomorrow!" },
          { status: 429 }
        );
      }

      const existing = await db.execute({
        sql: "SELECT id FROM images WHERE order_id = ? AND type = 'free_sample'",
        args: [orderId],
      });
      if (existing.rows.length) {
        return NextResponse.json({ error: "Free sample already generated" }, { status: 400 });
      }

      // Record usage
      await db.execute({
        sql: "INSERT INTO free_samples (id, ip, email) VALUES (?, ?, ?)",
        args: [uuidv4(), ip, email],
      });

      // Remove background
      const removedUrl = await removeBackground(imageUrl);
      const removedRes = await fetch(removedUrl);
      const removedPng = Buffer.from(await removedRes.arrayBuffer());

      // Create 15 background previews (512px, watermarked)
      const previews = await createFreePreviewAll(removedPng);
      for (const preview of previews) {
        const previewKey = `previews/${orderId}/free_${preview.name}.jpg`;
        await uploadToR2(previewKey, preview.buffer, "image/jpeg");

        const imageId = uuidv4();
        await db.execute({
          sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, style, expires_at)
                VALUES (?, ?, ?, 'free_sample', 'low', ?, ?)`,
          args: [imageId, orderId, previewKey, preview.name, expiresAt],
        });
      }

      await db.execute({
        sql: "UPDATE orders SET status = 'sample_generated' WHERE id = ?",
        args: [orderId],
      });

      return NextResponse.json({
        previews: previews.map((p) => ({
          name: p.name,
          label: p.label,
          url: getPublicUrl(`previews/${orderId}/free_${p.name}.jpg`),
        })),
        orderId,
        status: "sample_generated",
      });
    }

    // ── PAID MODE ──
    if (mode === "paid") {
      if (order.rows[0].status !== "paid") {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }

      // Build composite options
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

      // Process ALL uploaded images (batch)
      const generated: { id: string; url: string; style: string; uploadIndex: number }[] = [];

      for (let uploadIdx = 0; uploadIdx < allUploads.rows.length; uploadIdx++) {
        const upload = allUploads.rows[uploadIdx];
        const uploadR2Key = upload.r2_key as string;
        const uploadUrl = getPublicUrl(uploadR2Key);

        // Remove background (or reuse if already done)
        let removedPng: Buffer;
        const existingRemoved = await db.execute({
          sql: "SELECT r2_key FROM images WHERE order_id = ? AND type = 'removed' AND r2_key LIKE ?",
          args: [orderId, `removed/${orderId}/product-${uploadIdx}%`],
        });

        if (existingRemoved.rows.length) {
          const res = await fetch(getPublicUrl(existingRemoved.rows[0].r2_key as string));
          removedPng = Buffer.from(await res.arrayBuffer());
        } else {
          const removedUrl = await removeBackground(uploadUrl);
          const res = await fetch(removedUrl);
          removedPng = Buffer.from(await res.arrayBuffer());

          const removedKey = `removed/${orderId}/product-${uploadIdx}.png`;
          await uploadToR2(removedKey, removedPng, "image/png");
          await db.execute({
            sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, expires_at)
                  VALUES (?, ?, ?, 'removed', 'high', ?)`,
            args: [uuidv4(), orderId, removedKey, expiresAt],
          });
        }

        // Composite on solid backgrounds
        const results = await compositeAllBackgrounds(removedPng, allBgs, compositeOpts);

        for (const result of results) {
          const imageId = uuidv4();
          const key = `results/${orderId}/${imageId}-p${uploadIdx}-${result.name}.jpg`;
          await uploadToR2(key, result.buffer, "image/jpeg");

          await db.execute({
            sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, style, expires_at)
                  VALUES (?, ?, ?, 'generated', 'high', ?, ?)`,
            args: [imageId, orderId, key, result.name, expiresAt],
          });

          generated.push({ id: imageId, url: getPublicUrl(key), style: result.name, uploadIndex: uploadIdx });
        }

        // Composite on gradient backgrounds
        for (const grad of GRADIENT_OPTIONS) {
          const gradBuffer = await compositeProductOnGradient(removedPng, grad, compositeOpts);
          const imageId = uuidv4();
          const key = `results/${orderId}/${imageId}-p${uploadIdx}-${grad.name}.jpg`;
          await uploadToR2(key, gradBuffer, "image/jpeg");

          await db.execute({
            sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, style, expires_at)
                  VALUES (?, ?, ?, 'generated', 'high', ?, ?)`,
            args: [imageId, orderId, key, grad.name, expiresAt],
          });

          generated.push({ id: imageId, url: getPublicUrl(key), style: grad.name, uploadIndex: uploadIdx });
        }

        // Composite on texture backgrounds
        for (const tex of TEXTURE_OPTIONS) {
          const texBuffer = await compositeProductOnTexture(removedPng, tex, compositeOpts);
          const imageId = uuidv4();
          const key = `results/${orderId}/${imageId}-p${uploadIdx}-${tex.name}.jpg`;
          await uploadToR2(key, texBuffer, "image/jpeg");

          await db.execute({
            sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, style, expires_at)
                  VALUES (?, ?, ?, 'generated', 'high', ?, ?)`,
            args: [imageId, orderId, key, tex.name, expiresAt],
          });

          generated.push({ id: imageId, url: getPublicUrl(key), style: tex.name, uploadIndex: uploadIdx });
        }
      }

      await db.execute({
        sql: "UPDATE orders SET status = 'completed' WHERE id = ?",
        args: [orderId],
      });

      return NextResponse.json({
        images: generated,
        orderId,
        uploadCount: allUploads.rows.length,
        status: "completed",
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("Generation error:", error);

    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.orderId) {
        await (await ensureDb()).execute({
          sql: "UPDATE orders SET status = 'generation_failed' WHERE id = ?",
          args: [body.orderId],
        });
      }
    } catch { /* best effort */ }

    return NextResponse.json(
      { error: "Processing failed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
