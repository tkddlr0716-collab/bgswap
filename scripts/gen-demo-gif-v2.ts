/**
 * 데모 GIF v2 — Sharp 프레임 직접 합성
 * 플로우: Before → 배경제거 → 15배경 하나씩 → 가격/CTA
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";
import GIFEncoder from "gif-encoder";

const OUT = path.join(__dirname, "launch-assets");
const W = 480, H = 360;

const BG_NAMES = [
  "white", "light-gray", "warm", "cool-gray", "dark",
  "sunset", "ocean", "mint", "lavender", "peach",
  "marble", "wood", "linen", "concrete", "paper",
];

const BG_LABELS = [
  "White · Amazon", "Light Gray · Etsy", "Warm · Shopify", "Cool Gray · Catalog", "Dark · Premium",
  "Sunset · Lifestyle", "Ocean · Fresh", "Mint · Natural", "Lavender · Beauty", "Peach · Warm",
  "Marble · Luxury", "Wood · Craft", "Linen · Textile", "Concrete · Industrial", "Paper · Minimal",
];

async function createTextFrame(lines: { text: string; size: number; color: string; y: number }[], bg: string): Promise<Buffer> {
  const textSvg = lines.map(l =>
    `<text x="${W / 2}" y="${l.y}" text-anchor="middle" font-family="Arial,Helvetica" font-size="${l.size}" font-weight="700" fill="${l.color}">${l.text}</text>`
  ).join("");
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    ${textSvg}
  </svg>`;
  return sharp(Buffer.from(svg)).raw().toBuffer();
}

async function createImageFrame(imagePath: string, label: string, sublabel: string, counter: string): Promise<Buffer> {
  const IMG_SIZE = 220;

  // Background
  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#f8fafc"/>
    <text x="${W/2}" y="50" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">${label}</text>
    <text x="${W/2}" y="80" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">${sublabel}</text>
    <text x="${W/2}" y="${H-30}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="600" fill="#2563eb">${counter}</text>
  </svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  const img = await sharp(imagePath).resize(IMG_SIZE, IMG_SIZE, { fit: "contain", background: { r: 248, g: 250, b: 252, alpha: 255 } }).png().toBuffer();

  return sharp(bg)
    .composite([{ input: img, left: Math.floor((W - IMG_SIZE) / 2), top: Math.floor((H - IMG_SIZE) / 2) + 10 }])
    .raw()
    .toBuffer();
}

async function main() {
  console.log("Generating demo GIF v2...");

  const encoder = new GIFEncoder(W, H);
  const writeStream = fs.createWriteStream(path.join(OUT, "demo-v2.gif"));
  encoder.pipe(writeStream);
  encoder.setFrameRate(2); // 0.5s per frame
  encoder.setQuality(10);
  encoder.setRepeat(0);
  encoder.writeHeader();

  // Frame 1-3 (1.5s): Title
  const titleFrame = await createTextFrame([
    { text: "Upload Once.", size: 48, color: "#0f172a", y: 240 },
    { text: "Get 15 Backgrounds.", size: 48, color: "#2563eb", y: 300 },
    { text: "bgswap.io", size: 20, color: "#94a3b8", y: 360 },
  ], "#ffffff");
  for (let i = 0; i < 3; i++) encoder.addFrame(titleFrame as unknown as number[]);

  // Frame 4-5 (1s): Before photo
  const beforeFrame = await createImageFrame(
    path.join(OUT, "sneaker-before.jpg"),
    "📸  Original Product Photo",
    "Messy background, not marketplace-ready",
    ""
  );
  for (let i = 0; i < 2; i++) encoder.addFrame(beforeFrame as unknown as number[]);

  // Frame 6-7 (1s): AI processing
  const procFrame = await createTextFrame([
    { text: "✨", size: 64, color: "#000000", y: 220 },
    { text: "AI Removing Background...", size: 32, color: "#0f172a", y: 300 },
    { text: "Generating 15 backgrounds", size: 18, color: "#64748b", y: 340 },
  ], "#f8fafc");
  for (let i = 0; i < 2; i++) encoder.addFrame(procFrame as unknown as number[]);

  // Frame 8-22 (7.5s): Each of 15 backgrounds, 1 frame each
  for (let i = 0; i < 15; i++) {
    const frame = await createImageFrame(
      path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`),
      BG_LABELS[i],
      "Background removed + replaced automatically",
      `${i + 1} of 15 backgrounds`
    );
    encoder.addFrame(frame as unknown as number[]);
  }

  // Frame 23-24 (1s): All 15 grid summary
  const THUMB = 80, GAP = 6, COLS = 5, ROWS = 3;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridH = ROWS * THUMB + (ROWS - 1) * GAP;
  const gridX = Math.floor((W - gridW) / 2);
  const gridY = 100;

  const gridBgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <text x="${W/2}" y="50" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">15 Backgrounds Generated!</text>
    <text x="${W/2}" y="78" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">From one upload — all marketplace-ready</text>
    <text x="${W/2}" y="${H-25}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="600" fill="#16a34a">✅ Ready to download as ZIP</text>
  </svg>`;
  const gridBg = await sharp(Buffer.from(gridBgSvg)).png().toBuffer();

  const gridComposites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < 15; i++) {
    const thumb = await sharp(path.join(OUT, `sneaker-${BG_NAMES[i]}.jpg`)).resize(THUMB, THUMB, { fit: "cover" }).png().toBuffer();
    gridComposites.push({
      input: thumb,
      left: gridX + (i % COLS) * (THUMB + GAP),
      top: gridY + Math.floor(i / COLS) * (THUMB + GAP),
    });
  }
  const gridFrame = await sharp(gridBg).composite(gridComposites).raw().toBuffer();
  for (let i = 0; i < 4; i++) encoder.addFrame(gridFrame as unknown as number[]);

  // Frame 25-28 (2s): Pricing/CTA
  const ctaFrame = await createTextFrame([
    { text: "From $0.29 per product", size: 36, color: "#0f172a", y: 200 },
    { text: "No subscription. One-time payment.", size: 20, color: "#64748b", y: 250 },
    { text: "Try Free — bgswap.io", size: 32, color: "#f59e0b", y: 340 },
    { text: "1 free photo, no credit card", size: 16, color: "#94a3b8", y: 380 },
  ], "#ffffff");
  for (let i = 0; i < 4; i++) encoder.addFrame(ctaFrame as unknown as number[]);

  encoder.finish();
  await new Promise<void>(r => writeStream.on("finish", r));

  const stat = fs.statSync(path.join(OUT, "demo-v2.gif"));
  console.log(`Done! ${(stat.size / 1024 / 1024).toFixed(1)}MB → scripts/launch-assets/demo-v2.gif`);
}

main().catch(console.error);
