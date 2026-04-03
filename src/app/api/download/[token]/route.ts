import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { getPublicUrl } from "@/lib/r2";
import JSZip from "jszip";

async function getOrderAndImages(token: string) {
  const db = await ensureDb();
  const order = await db.execute({
    sql: "SELECT * FROM orders WHERE download_token = ? AND status IN ('paid', 'completed')",
    args: [token],
  });

  if (!order.rows.length) return { error: "Invalid or expired download link", status: 403 };

  const createdAt = new Date(order.rows[0].created_at as string);
  const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7) return { error: "Download link expired", status: 410 };

  const orderId = order.rows[0].id as string;
  const images = await db.execute({
    sql: "SELECT * FROM images WHERE order_id = ? AND type = 'generated' ORDER BY uploaded_at",
    args: [orderId],
  });

  const imageList = images.rows.map((row) => {
    const key = row.r2_key as string;
    const match = key.match(/-p(\d+)-/);
    return {
      id: row.id as string,
      url: getPublicUrl(key),
      style: (row.style as string) || "business",
      resolution: row.resolution as string,
      uploadIndex: match ? parseInt(match[1]) : 0,
    };
  });

  return { orderId, images: imageList, createdAt };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await getOrderAndImages(token);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { orderId, images, createdAt } = result;
    const isZip = req.nextUrl.searchParams.get("zip") === "1";

    if (!isZip) {
      return NextResponse.json({
        orderId,
        images,
        expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Server-side ZIP generation — fetches from R2 (no CORS issue)
    const zip = new JSZip();
    const fetchPromises = images.map(async (img) => {
      try {
        const res = await fetch(img.url, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        const buf = Buffer.from(await res.arrayBuffer());
        zip.file(`bgswap-product-${img.uploadIndex + 1}-${img.style}.jpg`, buf);
      } catch {
        // Skip failed images
      }
    });
    await Promise.all(fetchPromises);

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="bgswap-photos.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
