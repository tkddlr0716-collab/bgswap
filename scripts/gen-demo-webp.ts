/**
 * Demo animated WebP — Sharp native animation support
 * Sharp supports multi-page WebP natively
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "launch-assets");
const W = 400, H = 300;

const BG_NAMES = [
  "white", "light-gray", "warm", "cool-gray", "dark",
  "sunset", "ocean", "mint", "lavender", "peach",
  "marble", "wood", "linen", "concrete", "paper",
];
const BG_LABELS = [
  "White", "Light Gray", "Warm", "Cool Gray", "Dark",
  "Sunset", "Ocean", "Mint", "Lavender", "Peach",
  "Marble", "Wood", "Linen", "Concrete", "Paper",
];

async function textFrame(lines: { text: string; size: number; color: string; y: number }[], bg: string): Promise<Buffer> {
  const t = lines.map(l =>
    `<text x="${W/2}" y="${l.y}" text-anchor="middle" font-family="Arial,Helvetica" font-size="${l.size}" font-weight="700" fill="${l.color}">${l.text}</text>`
  ).join("");
  return sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${bg}"/>${t}</svg>`))
    .resize(W, H).png().toBuffer();
}

async function productFrame(imagePath: string, title: string, sub: string): Promise<Buffer> {
  const IMG = 180;
  const bg = await sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f8fafc"/>
    <text x="${W/2}" y="44" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#0f172a">${title}</text>
    <text x="${W/2}" y="70" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">${sub}</text>
  </svg>`)).png().toBuffer();
  const img = await sharp(imagePath).resize(IMG, IMG, { fit: "contain", background: { r: 248, g: 250, b: 252, alpha: 255 } }).png().toBuffer();
  return sharp(bg).composite([{ input: img, left: Math.floor((W - IMG) / 2), top: 90 }]).png().toBuffer();
}

async function gridFrame(): Promise<Buffer> {
  const THUMB = 65, GAP = 5, COLS = 5;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridX = Math.floor((W - gridW) / 2);
  const bg = await sharp(Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <text x="${W/2}" y="40" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#0f172a">15 Backgrounds Generated!</text>
    <text x="${W/2}" y="${H-22}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="600" fill="#16a34a">Ready to download as ZIP</text>
  </svg>`)).png().toBuffer();
  const composites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < 15; i++) {
    composites.push({
      input: await sharp(path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`)).resize(THUMB, THUMB, { fit: "cover" }).png().toBuffer(),
      left: gridX + (i % COLS) * (THUMB + GAP),
      top: 60 + Math.floor(i / COLS) * (THUMB + GAP),
    });
  }
  return sharp(bg).composite(composites).png().toBuffer();
}

async function main() {
  console.log("Generating animated WebP demo...");

  const frameDefs: { buf: Buffer; delay: number }[] = [];

  // Title (2s)
  frameDefs.push({ buf: await textFrame([
    { text: "Upload Once.", size: 40, color: "#0f172a", y: 180 },
    { text: "Get 15 Backgrounds.", size: 40, color: "#2563eb", y: 230 },
    { text: "bgswap.io", size: 18, color: "#94a3b8", y: 280 },
  ], "#ffffff"), delay: 2000 });

  // Before (2s)
  frameDefs.push({ buf: await productFrame(path.join(OUT, "sneaker-before.jpg"), "Original Photo", "Messy background — not marketplace-ready"), delay: 2000 });

  // Processing (1.5s)
  frameDefs.push({ buf: await textFrame([
    { text: "AI Processing...", size: 30, color: "#0f172a", y: 200 },
    { text: "Removing background + generating backgrounds", size: 14, color: "#64748b", y: 240 },
  ], "#f8fafc"), delay: 1500 });

  // 15 backgrounds (500ms each)
  for (let i = 0; i < 15; i++) {
    frameDefs.push({ buf: await productFrame(
      path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`),
      `${BG_LABELS[i]} Background`,
      `${i + 1} of 15`
    ), delay: 500 });
  }

  // Grid (3s)
  frameDefs.push({ buf: await gridFrame(), delay: 3000 });

  // CTA (3s)
  frameDefs.push({ buf: await textFrame([
    { text: "From $0.29/product", size: 32, color: "#0f172a", y: 170 },
    { text: "No subscription. One-time payment.", size: 16, color: "#64748b", y: 210 },
    { text: "Try Free — bgswap.io", size: 28, color: "#f59e0b", y: 280 },
    { text: "1 free photo, no credit card", size: 14, color: "#94a3b8", y: 315 },
  ], "#ffffff"), delay: 3000 });

  console.log(`  ${frameDefs.length} frames`);

  // Expand frames based on delay (WebP uses fixed delay per frame)
  // Use 500ms as base frame rate, duplicate frames for longer delays
  const BASE_DELAY = 500;
  const expandedFrames: Buffer[] = [];
  for (const f of frameDefs) {
    const count = Math.max(1, Math.round(f.delay / BASE_DELAY));
    for (let i = 0; i < count; i++) expandedFrames.push(f.buf);
  }

  console.log(`  ${expandedFrames.length} expanded frames at ${BASE_DELAY}ms each`);

  // Stack vertically for Sharp multi-page input
  const rawFrames = await Promise.all(expandedFrames.map(f => sharp(f).resize(W, H).raw().ensureAlpha().toBuffer()));
  const totalH = H * rawFrames.length;
  const stacked = Buffer.alloc(W * totalH * 4);
  for (let i = 0; i < rawFrames.length; i++) {
    rawFrames[i].copy(stacked, i * W * H * 4);
  }

  // Write as animated WebP
  const webp = await sharp(stacked, { raw: { width: W, height: totalH, channels: 4 } })
    .webp({ delay: BASE_DELAY, loop: 0, pageHeight: H })
    .toBuffer();

  fs.writeFileSync(path.join(OUT, "demo.webp"), webp);
  console.log(`Done! ${(webp.length / 1024).toFixed(0)}KB → demo.webp`);

  // Also save as GIF for compatibility
  const gif = await sharp(stacked, { raw: { width: W, height: totalH, channels: 4 } })
    .gif({ delay: BASE_DELAY, loop: 0, pageHeight: H })
    .toBuffer();

  fs.writeFileSync(path.join(OUT, "demo.gif"), gif);
  console.log(`GIF: ${(gif.length / 1024).toFixed(0)}KB → demo.gif`);
}

main().catch(console.error);
