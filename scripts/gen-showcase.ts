import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import sharp from "sharp";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  const baseUrl = process.env.R2_PUBLIC_URL!;

  const orderId = "2f3abfeb-c295-49b6-9585-dab4ad5bc4cb";
  const imgs = await db.execute({
    sql: "SELECT r2_key, style FROM images WHERE order_id = ? AND type = 'generated' AND r2_key LIKE '%-p0-%' ORDER BY style",
    args: [orderId],
  });
  console.log(`Found ${imgs.rows.length} images`);

  const COLS = 5, ROWS = 3, THUMB = 400, GAP = 8;
  const width = COLS * THUMB + (COLS - 1) * GAP;
  const height = ROWS * THUMB + (ROWS - 1) * GAP;

  const composites: { input: Buffer; left: number; top: number }[] = [];

  for (let i = 0; i < Math.min(imgs.rows.length, 15); i++) {
    const url = `${baseUrl}/${imgs.rows[i].r2_key}`;
    const style = imgs.rows[i].style as string;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const resized = await sharp(buf).resize(THUMB, THUMB, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
      composites.push({ input: resized, left: (i % COLS) * (THUMB + GAP), top: Math.floor(i / COLS) * (THUMB + GAP) });
      console.log(`  ${style} OK`);
    } catch { console.log(`  ${style} skip`); }
  }

  const grid = await sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite(composites).jpeg({ quality: 92 }).toBuffer();

  const outDir = path.join(__dirname, "launch-assets");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "15-backgrounds-grid.jpg"), grid);
  console.log(`Grid: ${(grid.length / 1024).toFixed(0)}KB → scripts/launch-assets/15-backgrounds-grid.jpg`);

  // Before/After: original upload vs white background result
  const uploadImg = await db.execute({
    sql: "SELECT r2_key FROM images WHERE order_id = ? AND type = 'upload' LIMIT 1", args: [orderId],
  });
  const whiteImg = await db.execute({
    sql: "SELECT r2_key FROM images WHERE order_id = ? AND type = 'generated' AND style = 'white' AND r2_key LIKE '%-p0-%' LIMIT 1", args: [orderId],
  });

  if (uploadImg.rows.length && whiteImg.rows.length) {
    const [origBuf, whiteBuf] = await Promise.all([
      fetch(`${baseUrl}/${uploadImg.rows[0].r2_key}`).then(r => r.arrayBuffer()).then(b => Buffer.from(b)),
      fetch(`${baseUrl}/${whiteImg.rows[0].r2_key}`).then(r => r.arrayBuffer()).then(b => Buffer.from(b)),
    ]);
    const SZ = 600;
    const origResized = await sharp(origBuf).resize(SZ, SZ, { fit: "contain", background: { r: 240, g: 240, b: 240, alpha: 1 } }).jpeg({ quality: 90 }).toBuffer();
    const whiteResized = await sharp(whiteBuf).resize(SZ, SZ, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).jpeg({ quality: 90 }).toBuffer();

    const ba = await sharp({ create: { width: SZ * 2 + GAP, height: SZ, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .composite([
        { input: origResized, left: 0, top: 0 },
        { input: whiteResized, left: SZ + GAP, top: 0 },
      ]).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(outDir, "before-after.jpg"), ba);
    console.log(`Before/After: ${(ba.length / 1024).toFixed(0)}KB → scripts/launch-assets/before-after.jpg`);
  }
}

main().catch(console.error);
