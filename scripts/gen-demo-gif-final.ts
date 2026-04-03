/**
 * Demo GIF — Sharp의 내장 GIF 지원 사용
 * 각 프레임을 Sharp로 만들고, animated GIF로 합침
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "launch-assets");
const W = 600, H = 450;

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
  const textContent = lines.map(l =>
    `<text x="${W/2}" y="${l.y}" text-anchor="middle" font-family="Arial,Helvetica" font-size="${l.size}" font-weight="700" fill="${l.color}">${l.text}</text>`
  ).join("");
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${bg}"/>${textContent}</svg>`;
  return sharp(Buffer.from(svg)).resize(W, H).png().toBuffer();
}

async function productFrame(imagePath: string, title: string, sub: string): Promise<Buffer> {
  const IMG = 260;
  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f8fafc"/>
    <text x="${W/2}" y="44" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="#0f172a">${title}</text>
    <text x="${W/2}" y="70" text-anchor="middle" font-family="Arial" font-size="13" fill="#64748b">${sub}</text>
  </svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  const img = await sharp(imagePath).resize(IMG, IMG, { fit: "contain", background: { r: 248, g: 250, b: 252, alpha: 255 } }).png().toBuffer();
  return sharp(bg).composite([{ input: img, left: Math.floor((W - IMG) / 2), top: 90 }]).png().toBuffer();
}

async function gridFrame(): Promise<Buffer> {
  const THUMB = 100, GAP = 6, COLS = 5;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridX = Math.floor((W - gridW) / 2);

  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <text x="${W/2}" y="40" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700" fill="#0f172a">15 Backgrounds Generated!</text>
    <text x="${W/2}" y="${H-22}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="600" fill="#16a34a">Ready to download as ZIP</text>
  </svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  const composites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < 15; i++) {
    const t = await sharp(path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`)).resize(THUMB, THUMB, { fit: "cover" }).png().toBuffer();
    composites.push({ input: t, left: gridX + (i % COLS) * (THUMB + GAP), top: 60 + Math.floor(i / COLS) * (THUMB + GAP) });
  }
  return sharp(bg).composite(composites).png().toBuffer();
}

async function main() {
  console.log("Generating demo GIF (Sharp animated)...");

  type FrameDef = { buf: Buffer; delay: number }; // delay in ms
  const frames: FrameDef[] = [];

  // 1. Title (2s)
  frames.push({ buf: await textFrame([
    { text: "Upload Once.", size: 40, color: "#0f172a", y: 180 },
    { text: "Get 15 Backgrounds.", size: 40, color: "#2563eb", y: 230 },
    { text: "bgswap.io", size: 18, color: "#94a3b8", y: 280 },
  ], "#ffffff"), delay: 2000 });

  // 2. Before (2s)
  frames.push({ buf: await productFrame(path.join(OUT, "sneaker-before.jpg"), "Original Photo", "Messy background — not marketplace-ready"), delay: 2000 });

  // 3. Processing (1.5s)
  frames.push({ buf: await textFrame([
    { text: "AI Processing...", size: 30, color: "#0f172a", y: 200 },
    { text: "Removing background + generating 15 backgrounds", size: 14, color: "#64748b", y: 240 },
  ], "#f8fafc"), delay: 1500 });

  // 4. 15 backgrounds (0.5s each)
  for (let i = 0; i < 15; i++) {
    frames.push({ buf: await productFrame(
      path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`),
      `${BG_LABELS[i]} Background`,
      `${i + 1} of 15 — auto-generated`
    ), delay: 500 });
  }

  // 5. Grid (3s)
  frames.push({ buf: await gridFrame(), delay: 3000 });

  // 6. CTA (3s)
  frames.push({ buf: await textFrame([
    { text: "From $0.29/product", size: 32, color: "#0f172a", y: 170 },
    { text: "No subscription. One-time payment.", size: 16, color: "#64748b", y: 210 },
    { text: "Try Free — bgswap.io", size: 28, color: "#f59e0b", y: 280 },
    { text: "1 free photo, no credit card", size: 14, color: "#94a3b8", y: 315 },
  ], "#ffffff"), delay: 3000 });

  console.log(`  ${frames.length} frames, assembling...`);

  // Use sharp to create animated GIF
  // Sharp supports animated output via joining frames
  const gifFrames = frames.map(f => ({
    buf: f.buf,
    delay: f.delay,
  }));

  // Sharp animated GIF: stack frames vertically, then extract as animation
  // Alternative: write individual PNGs and use sharp to convert
  const frameBuffers: Buffer[] = [];
  for (const f of gifFrames) {
    const resized = await sharp(f.buf).resize(W, H).gif().toBuffer();
    frameBuffers.push(resized);
  }

  // Sharp can join multiple single-frame GIFs into animated GIF
  // using sharp's built-in support
  const inputPages = await Promise.all(
    gifFrames.map(async (f) =>
      sharp(f.buf).resize(W, H).raw().toBuffer()
    )
  );

  // Create animated GIF by stacking all frames vertically and slicing
  const totalH = H * frames.length;
  const stacked = await sharp({
    create: { width: W, height: totalH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } },
  }).raw().toBuffer();

  // Copy each frame into the stack
  for (let i = 0; i < inputPages.length; i++) {
    inputPages[i].copy(stacked, i * W * H * 4, 0, W * H * 4);
  }

  // Create animated GIF from raw stacked data
  const animated = await sharp(stacked, { raw: { width: W, height: totalH, channels: 4 } })
    .gif({ delay: gifFrames.map(f => f.delay), loop: 0 })
    .toBuffer();

  fs.writeFileSync(path.join(OUT, "demo-final.gif"), animated);
  console.log(`Done! ${(animated.length / 1024).toFixed(0)}KB → scripts/launch-assets/demo-final.gif`);
}

main().catch(console.error);
