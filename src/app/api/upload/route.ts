import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { ensureDb } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { checkRateLimit, isDisposableEmail } from "@/lib/security";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Magic bytes for image validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

async function validateImage(buffer: Buffer): Promise<{ valid: boolean; error?: string }> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Could not read image dimensions" };
    }
    if (metadata.width > 8000 || metadata.height > 8000) {
      return { valid: false, error: "Image too large. Maximum 8000x8000 pixels." };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "File is not a valid image" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const email = formData.get("email") as string;
    const existingOrderId = formData.get("orderId") as string | null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    if (!files.length) {
      return NextResponse.json(
        { error: "At least one photo required" },
        { status: 400 }
      );
    }

    if (!existingOrderId && !email) {
      return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
      );
    }

    if (email && isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "Please use a real email address, not a temporary one." },
        { status: 400 }
      );
    }

    // Determine upload limit based on context
    const db = await ensureDb();
    let maxPhotos = 1; // free tier default
    let isPaidBulk = false;

    if (existingOrderId) {
      // Verify order exists and is paid BEFORE applying relaxed rate limit
      const order = await db.execute({
        sql: "SELECT plan, status FROM orders WHERE id = ?",
        args: [existingOrderId],
      });
      if (!order.rows.length) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (order.rows[0].status !== "paid" && order.rows[0].status !== "completed") {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }

      isPaidBulk = true;
      const plan = order.rows[0].plan as string;
      maxPhotos = plan === "pro" ? 100 : 10;

      // Check how many already uploaded
      const existing = await db.execute({
        sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = ? AND type = 'upload'",
        args: [existingOrderId],
      });
      const alreadyUploaded = (existing.rows[0].cnt as number) || 0;
      const remaining = maxPhotos - alreadyUploaded;

      if (files.length > remaining) {
        return NextResponse.json(
          { error: `Upload limit: ${remaining} more photos allowed (${alreadyUploaded}/${maxPhotos} used)` },
          { status: 400 }
        );
      }
    } else {
      // Free tier: 1 photo only
      if (files.length > maxPhotos) {
        return NextResponse.json(
          { error: `Free tier allows ${maxPhotos} photo only` },
          { status: 400 }
        );
      }
    }

    // Rate limiting AFTER order validation — prevents fake orderId abuse
    if (isPaidBulk) {
      const rateCheck = checkRateLimit(`upload-bulk:${ip}`, 120, 60_000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: "Too many uploads. Please wait a moment." },
          { status: 429 }
        );
      }
    } else {
      const rateCheck = checkRateLimit(`upload:${ip}`, 3, 60_000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: "Too many uploads. Please wait a moment." },
          { status: 429 }
        );
      }
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Use JPG, PNG, or WebP.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum 10MB per photo." },
          { status: 400 }
        );
      }
    }

    // Create order or reuse existing
    const orderId = existingOrderId || uuidv4();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    if (!existingOrderId) {
      await db.execute({
        sql: "INSERT INTO orders (id, email, status) VALUES (?, ?, 'uploaded')",
        args: [orderId, email],
      });
    }

    // Upload files to R2 (with security validation)
    const imageIds: string[] = [];
    for (const file of files) {
      const imageId = uuidv4();
      const ext = file.type === "image/png" ? "png" : "jpg";
      const r2Key = `uploads/${orderId}/${imageId}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      // Security: Validate magic bytes match claimed MIME type
      if (!validateMagicBytes(buffer, file.type)) {
        return NextResponse.json(
          { error: "File content does not match its type. Please upload a real image." },
          { status: 400 }
        );
      }

      // Security: Validate image is decodable by Sharp (catches malformed/malicious files)
      const validation = await validateImage(buffer);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Invalid image file." },
          { status: 400 }
        );
      }

      await uploadToR2(r2Key, buffer, file.type);

      await db.execute({
        sql: `INSERT INTO images (id, order_id, r2_key, type, resolution, expires_at, process_status)
              VALUES (?, ?, ?, 'upload', 'original', ?, 'pending')`,
        args: [imageId, orderId, r2Key, expiresAt],
      });

      imageIds.push(imageId);
    }

    return NextResponse.json({
      orderId,
      imageCount: files.length,
      imageIds,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
