/**
 * 론칭 쇼케이스 v3 — 실제 제품 사진으로 극적 Before/After
 *
 * Pexels 무료 상용 라이선스 이미지 사용
 * → BiRefNet으로 실제 배경 제거
 * → Sharp로 15배경 합성
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import Replicate from "replicate";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const OUT = path.join(__dirname, "launch-assets");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Pexels free commercial use product photos
const PRODUCT_PHOTOS = [
  {
    name: "sneaker",
    label: "Sneaker",
    // White Nike-style sneaker on messy surface
    url: "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&w=1200",
  },
  {
    name: "perfume",
    label: "Perfume",
    // Perfume bottle
    url: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&w=1200",
  },
  {
    name: "watch",
    label: "Watch",
    // Wristwatch
    url: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&w=1200",
  },
];

const BG_COLORS: { name: string; label: string; color: { r: number; g: number; b: number } }[] = [
  { name: "white", label: "White", color: { r: 255, g: 255, b: 255 } },
  { name: "light-gray", label: "Light Gray", color: { r: 245, g: 245, b: 245 } },
  { name: "warm", label: "Warm", color: { r: 255, g: 248, b: 240 } },
  { name: "cool-gray", label: "Cool", color: { r: 235, g: 238, b: 242 } },
  { name: "dark", label: "Dark", color: { r: 30, g: 30, b: 35 } },
  { name: "sunset", label: "Sunset", color: { r: 255, g: 200, b: 150 } },
  { name: "ocean", label: "Ocean", color: { r: 150, g: 200, b: 230 } },
  { name: "mint", label: "Mint", color: { r: 180, g: 230, b: 210 } },
  { name: "lavender", label: "Lavender", color: { r: 210, g: 190, b: 235 } },
  { name: "peach", label: "Peach", color: { r: 255, g: 210, b: 190 } },
  { name: "marble", label: "Marble", color: { r: 240, g: 238, b: 235 } },
  { name: "wood", label: "Wood", color: { r: 180, g: 140, b: 100 } },
  { name: "linen", label: "Linen", color: { r: 245, g: 240, b: 230 } },
  { name: "concrete", label: "Concrete", color: { r: 200, g: 200, b: 200 } },
  { name: "paper", label: "Paper", color: { r: 252, g: 250, b: 245 } },
];

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function removeBackground(imageUrl: string): Promise<Buffer> {
  console.log("    Removing background via BiRefNet...");
  const output = await replicate.run(
    "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
    { input: { image: imageUrl } }
  );
  const res = await fetch(String(output));
  return Buffer.from(await res.arrayBuffer());
}

async function compositeOnBg(
  removedPng: Buffer,
  bgColor: { r: number; g: number; b: number },
  size: number
): Promise<Buffer> {
  const product = await sharp(removedPng)
    .resize(Math.round(size * 0.75), Math.round(size * 0.75), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 3, background: bgColor },
  })
    .composite([{ input: product, gravity: "center" }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function processProduct(photo: typeof PRODUCT_PHOTOS[0]) {
  console.log(`\n  Processing: ${photo.label}`);

  // Download original
  const original = await downloadImage(photo.url);
  const origResized = await sharp(original).resize(800, 800, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${photo.name}-before.jpg`), origResized);
  console.log(`    Before saved`);

  // We need a public URL for Replicate — save to a temp data URI approach won't work.
  // Instead, upload to R2 temporarily, or use the Pexels URL directly.
  const removed = await removeBackground(photo.url);
  fs.writeFileSync(path.join(OUT, `${photo.name}-removed.png`), removed);
  console.log(`    Background removed`);

  // Rate limit pause
  await new Promise(r => setTimeout(r, 3000));

  // Generate all 15 backgrounds
  const SIZE = 600;
  const results: { name: string; label: string; buf: Buffer }[] = [];
  for (const bg of BG_COLORS) {
    const result = await compositeOnBg(removed, bg.color, SIZE);
    results.push({ ...bg, buf: result });
  }
  console.log(`    15 backgrounds composited`);

  // Save key variants
  for (const r of results) {
    fs.writeFileSync(path.join(OUT, `${photo.name}-${r.name}.jpg`), r.buf);
  }

  return { original: origResized, removed, results };
}

async function main() {
  console.log("=== Showcase v3: Real Product Photos ===\n");

  const allProducts: Awaited<ReturnType<typeof processProduct>>[] = [];

  for (const photo of PRODUCT_PHOTOS) {
    try {
      const result = await processProduct(photo);
      allProducts.push(result);
    } catch (err) {
      console.log(`    FAILED: ${err}`);
    }
  }

  if (allProducts.length === 0) {
    console.log("No products processed successfully");
    return;
  }

  // === Hero Banner (1270x760) ===
  console.log("\n  Creating hero banner...");
  const HW = 1270, HH = 760;

  // Use first product for main before/after
  const p = allProducts[0];
  const CARD = 260;

  const heroBefore = await sharp(p.original).resize(CARD + 40, CARD + 40, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const heroWhite = await sharp(p.results.find(r => r.name === "white")!.buf).resize(CARD, CARD, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const heroDark = await sharp(p.results.find(r => r.name === "dark")!.buf).resize(CARD, CARD, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();

  // Pick a third product's result if available
  const p2White = allProducts.length > 1
    ? await sharp(allProducts[1].results.find(r => r.name === "marble")!.buf).resize(CARD, CARD, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer()
    : await sharp(p.results.find(r => r.name === "sunset")!.buf).resize(CARD, CARD, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();

  const heroSvg = `<svg width="${HW}" height="${HH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e3a5f"/>
      </linearGradient>
    </defs>
    <rect width="${HW}" height="${HH}" fill="url(#bg)"/>
    <text x="80" y="100" font-family="Arial,Helvetica" font-size="44" font-weight="800" fill="white">Upload Once.</text>
    <text x="80" y="155" font-family="Arial,Helvetica" font-size="44" font-weight="800" fill="#f59e0b">Get 15 Backgrounds.</text>
    <text x="80" y="200" font-family="Arial,Helvetica" font-size="17" fill="#94a3b8">AI removes the background and generates 15 professional</text>
    <text x="80" y="225" font-family="Arial,Helvetica" font-size="17" fill="#94a3b8">product photos — solids, gradients, textures — in 10 seconds.</text>

    <!-- Labels -->
    <text x="145" y="600" text-anchor="middle" font-family="Arial" font-size="12" font-weight="600" fill="#64748b">BEFORE</text>
    <text x="468" y="600" text-anchor="middle" font-family="Arial" font-size="12" font-weight="600" fill="#94a3b8">White</text>
    <text x="748" y="600" text-anchor="middle" font-family="Arial" font-size="12" font-weight="600" fill="#94a3b8">Dark</text>
    <text x="1028" y="600" text-anchor="middle" font-family="Arial" font-size="12" font-weight="600" fill="#94a3b8">Marble</text>

    <!-- Arrow -->
    <text x="330" y="430" font-family="Arial" font-size="32" fill="#f59e0b" font-weight="700">→</text>

    <!-- CTA -->
    <rect x="80" y="650" width="220" height="50" rx="10" fill="#f59e0b"/>
    <text x="190" y="682" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#0f172a">Try Free — No Card</text>
    <text x="340" y="682" font-family="Arial" font-size="14" fill="#64748b">From $0.02/image · No subscription</text>
  </svg>`;

  const heroBg = await sharp(Buffer.from(heroSvg)).png().toBuffer();
  const heroFinal = await sharp(heroBg)
    .composite([
      { input: heroBefore, left: 50, top: 270, },
      { input: heroWhite, left: 340, top: 290 },
      { input: heroDark, left: 620, top: 290 },
      { input: p2White, left: 900, top: 290 },
    ])
    .jpeg({ quality: 94 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "hero-v3.jpg"), heroFinal);
  console.log("    Hero banner saved");

  // === 15 Backgrounds Grid (1270x760) — use first product ===
  console.log("  Creating 15-bg grid...");
  const THUMB = 220, GAP = 6, COLS = 5, ROWS = 3;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridH = ROWS * THUMB + (ROWS - 1) * GAP + 100; // extra for title

  const gridSvg = `<svg width="${gridW}" height="${gridH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${gridW}" height="${gridH}" fill="white"/>
    <text x="${gridW/2}" y="40" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">15 Backgrounds, Every Photo</text>
    <text x="${gridW/2}" y="65" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">Solids · Gradients · Textures — all with realistic drop shadows</text>
  </svg>`;
  const gridBg = await sharp(Buffer.from(gridSvg)).png().toBuffer();

  const thumbs = await Promise.all(
    p.results.map(async (r, i) => ({
      input: await sharp(r.buf).resize(THUMB, THUMB, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer(),
      left: (i % COLS) * (THUMB + GAP),
      top: Math.floor(i / COLS) * (THUMB + GAP) + 90,
    }))
  );

  const gridFinal = await sharp(gridBg)
    .resize(gridW, gridH)
    .composite(thumbs)
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "15-grid-v3.jpg"), gridFinal);
  console.log("    15-bg grid saved");

  // === Multi-product showcase if we have multiple products ===
  if (allProducts.length >= 2) {
    console.log("  Creating multi-product showcase...");
    const mpW = 1270, mpH = 760;
    const mpCard = 200;

    const mpSvg = `<svg width="${mpW}" height="${mpH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${mpW}" height="${mpH}" fill="#f8fafc"/>
      <text x="${mpW/2}" y="60" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#0f172a">Batch Processing — Up to 100 Products</text>
      <text x="${mpW/2}" y="90" text-anchor="middle" font-family="Arial" font-size="15" fill="#64748b">Upload all your products. Get 1,500 images back in ~16 minutes.</text>
    </svg>`;
    const mpBg = await sharp(Buffer.from(mpSvg)).png().toBuffer();

    const mpComposites: { input: Buffer; left: number; top: number }[] = [];
    let x = 40;
    for (let pi = 0; pi < Math.min(allProducts.length, 3); pi++) {
      const prod = allProducts[pi];
      // Before
      const bef = await sharp(prod.original).resize(mpCard, mpCard, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
      mpComposites.push({ input: bef, left: x, top: 140 });
      // White
      const wh = await sharp(prod.results.find(r => r.name === "white")!.buf).resize(mpCard, mpCard, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
      mpComposites.push({ input: wh, left: x, top: 360 });
      // Dark
      const dk = await sharp(prod.results.find(r => r.name === "dark")!.buf).resize(mpCard, mpCard, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
      mpComposites.push({ input: dk, left: x, top: 560 < mpH ? 560 : 360 });
      x += mpCard + 20;
    }

    const mpFinal = await sharp(mpBg).resize(mpW, mpH).composite(mpComposites).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(OUT, "batch-showcase.jpg"), mpFinal);
    console.log("    Multi-product showcase saved");
  }

  console.log(`\n=== Done! All assets in: ${OUT} ===`);
}

main().catch(console.error);
