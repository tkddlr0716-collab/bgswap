/**
 * Demo GIF v3 — omggif 직접 사용, 메모리 효율적
 * 스니커 한 제품 → Before → AI → 15배경 → 그리드 → CTA
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";
// @ts-ignore
import { GifWriter } from "omggif";

const OUT = path.join(__dirname, "launch-assets");
const W = 480, H = 360;

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

// Convert RGBA buffer to indexed color (256 palette) for GIF
function rgbaToIndexed(rgba: Buffer, w: number, h: number): { pixels: number[]; palette: number[] } {
  // Simple median-cut: sample colors, build palette
  const colorMap = new Map<number, number>();
  const palette: number[] = [];

  const pixels: number[] = new Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = rgba[i * 4] >> 3;     // quantize to 5 bits
    const g = rgba[i * 4 + 1] >> 3;
    const b = rgba[i * 4 + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;

    if (!colorMap.has(key) && colorMap.size < 255) {
      colorMap.set(key, colorMap.size);
      palette.push(r << 3, g << 3, b << 3);
    }
    pixels[i] = colorMap.get(key) ?? 0;
  }

  // Pad palette to exactly 256 entries (required by GIF)
  while (palette.length < 256 * 3) palette.push(0, 0, 0);

  return { pixels, palette };
}

async function makeFrame(svgOrComposite: Buffer): Promise<{ pixels: number[]; palette: number[] }> {
  const raw = await sharp(svgOrComposite).resize(W, H).raw().ensureAlpha().toBuffer();
  return rgbaToIndexed(raw, W, H);
}

async function textSvg(lines: { text: string; size: number; color: string; y: number }[], bg: string): Promise<Buffer> {
  const textContent = lines.map(l =>
    `<text x="${W/2}" y="${l.y}" text-anchor="middle" font-family="Arial,Helvetica" font-size="${l.size}" font-weight="700" fill="${l.color}">${l.text}</text>`
  ).join("");
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${bg}"/>${textContent}</svg>`);
}

async function imageFrame(imagePath: string, title: string, sub: string): Promise<Buffer> {
  const IMG = 200;
  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f8fafc"/>
    <text x="${W/2}" y="36" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#0f172a">${title}</text>
    <text x="${W/2}" y="58" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">${sub}</text>
  </svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  const img = await sharp(imagePath).resize(IMG, IMG, { fit: "contain", background: { r: 248, g: 250, b: 252, alpha: 255 } }).png().toBuffer();
  return sharp(bg).composite([{ input: img, left: Math.floor((W - IMG) / 2), top: 75 }]).png().toBuffer();
}

async function main() {
  console.log("Generating demo GIF v3...");

  // Collect all frames first
  const frames: { data: { pixels: number[]; palette: number[] }; delay: number }[] = [];

  // Title (2s)
  const title = await textSvg([
    { text: "Upload Once.", size: 36, color: "#0f172a", y: 150 },
    { text: "Get 15 Backgrounds.", size: 36, color: "#2563eb", y: 195 },
    { text: "bgswap.io", size: 16, color: "#94a3b8", y: 240 },
  ], "#ffffff");
  frames.push({ data: await makeFrame(title), delay: 200 });

  // Before (2s)
  const before = await imageFrame(path.join(OUT, "sneaker-before.jpg"), "📸 Original Photo", "Messy background, not marketplace-ready");
  frames.push({ data: await makeFrame(before), delay: 200 });

  // Processing (1.5s)
  const proc = await textSvg([
    { text: "✨ AI Processing...", size: 28, color: "#0f172a", y: 170 },
    { text: "Removing background + generating 15 backgrounds", size: 13, color: "#64748b", y: 210 },
  ], "#f8fafc");
  frames.push({ data: await makeFrame(proc), delay: 150 });

  // 15 backgrounds (0.5s each = 7.5s)
  for (let i = 0; i < 15; i++) {
    const frame = await imageFrame(
      path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`),
      `${BG_LABELS[i]} Background`,
      `${i + 1} of 15 — auto-generated`
    );
    frames.push({ data: await makeFrame(frame), delay: 50 });
  }

  // Grid (3s)
  const THUMB = 80, GAP = 4, COLS = 5, ROWS = 3;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridX = Math.floor((W - gridW) / 2);
  const gridBg = await textSvg([
    { text: "15 Backgrounds Generated!", size: 22, color: "#0f172a", y: 36 },
    { text: "✅ Ready to download as ZIP", size: 13, color: "#16a34a", y: H - 20 },
  ], "#ffffff");
  const gridComposites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < 15; i++) {
    const t = await sharp(path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`)).resize(THUMB, THUMB, { fit: "cover" }).png().toBuffer();
    gridComposites.push({ input: t, left: gridX + (i % COLS) * (THUMB + GAP), top: 55 + Math.floor(i / COLS) * (THUMB + GAP) });
  }
  const gridFrame = await sharp(Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#ffffff"/></svg>`))
    .png().toBuffer().then(bg => sharp(bg).composite(gridComposites).png().toBuffer());
  // Re-add text on top
  const gridFinal = await sharp(gridFrame)
    .composite([{
      input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <text x="${W/2}" y="36" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#0f172a">15 Backgrounds Generated!</text>
        <text x="${W/2}" y="${H-20}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="600" fill="#16a34a">✅ Ready to download as ZIP</text>
      </svg>`)
    }]).png().toBuffer();
  frames.push({ data: await makeFrame(gridFinal), delay: 300 });

  // CTA (3s)
  const cta = await textSvg([
    { text: "From $0.29/product", size: 30, color: "#0f172a", y: 140 },
    { text: "No subscription. One-time payment.", size: 15, color: "#64748b", y: 175 },
    { text: "Try Free — bgswap.io", size: 26, color: "#f59e0b", y: 240 },
    { text: "1 free photo, no credit card", size: 13, color: "#94a3b8", y: 275 },
  ], "#ffffff");
  frames.push({ data: await makeFrame(cta), delay: 300 });

  console.log(`  ${frames.length} frames ready, writing GIF...`);

  // Write GIF
  const buf = Buffer.alloc(W * H * frames.length * 2); // generous allocation
  const gif = new GifWriter(buf, W, H, { loop: 0 });

  for (const frame of frames) {
    gif.addFrame(0, 0, W, H, frame.data.pixels, { palette: frame.data.palette, delay: frame.delay });
  }

  const finalBuf = buf.slice(0, gif.end());
  fs.writeFileSync(path.join(OUT, "demo-v3.gif"), finalBuf);
  console.log(`Done! ${(finalBuf.length / 1024).toFixed(0)}KB → scripts/launch-assets/demo-v3.gif`);
}

main().catch(console.error);
