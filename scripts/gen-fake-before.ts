/**
 * 포트폴리오용 "가짜 비포" 생성
 * 깨끗하게 추출된 제품을 난잡한 배경에 합성 → 극적인 Before/After
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import https from "https";

const PORTFOLIO = path.join(__dirname, "launch-assets/portfolio");

// 난잡한 배경 이미지들 (Unsplash)
const MESSY_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=1200&fm=jpg", // 나무 테이블 위 (top-down)
  "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=1200&fm=jpg", // 콘크리트 바닥
  "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?w=1200&fm=jpg", // 나무 마루 바닥
];

const PRODUCTS = [
  { name: "shoe-v2", removed: "shoe-removed.png", bgIdx: 0, label: "Nike Shoe", scale: 0.5, offsetY: 80 },
  { name: "shoe-v3", removed: "shoe-removed.png", bgIdx: 1, label: "Nike Shoe (concrete)", scale: 0.5, offsetY: 80 },
  { name: "shoe-v4", removed: "shoe-removed.png", bgIdx: 2, label: "Nike Shoe (wood)", scale: 0.5, offsetY: 80 },
];

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "BgSwap/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function createFakeBefore(
  removedPng: Buffer,
  bgBuffer: Buffer,
  outputPath: string,
  productScale = 0.65,
  extraOffsetY = 20,
) {
  // Resize background to 1024x1024
  const bg = await sharp(bgBuffer)
    .resize(1024, 1024, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Get product dimensions, trim transparent edges
  const trimmed = await sharp(removedPng).ensureAlpha().trim().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const tw = meta.width || 500;
  const th = meta.height || 500;

  const maxDim = Math.floor(1024 * productScale);
  const scale = Math.min(maxDim / tw, maxDim / th);
  const finalW = Math.floor(tw * scale);
  const finalH = Math.floor(th * scale);

  const resized = await sharp(trimmed)
    .resize(finalW, finalH, { fit: "inside" })
    .png()
    .toBuffer();

  // Place slightly off-center, pushed down for "on surface" feel
  const offsetX = Math.floor((1024 - finalW) / 2) + Math.floor(Math.random() * 30 - 15);
  const offsetY = Math.floor((1024 - finalH) / 2) + extraOffsetY;

  const result = await sharp(bg)
    .composite([{ input: resized, left: Math.max(0, offsetX), top: Math.max(0, offsetY) }])
    .jpeg({ quality: 88 })
    .toBuffer();

  fs.writeFileSync(outputPath, result);
}

async function main() {
  // Download messy backgrounds
  console.log("Downloading messy backgrounds...");
  const bgBuffers: Buffer[] = [];
  for (const url of MESSY_BACKGROUNDS) {
    bgBuffers.push(await downloadImage(url));
    console.log("  Downloaded background");
  }

  // Generate fake befores
  for (const product of PRODUCTS) {
    const removedPath = path.join(PORTFOLIO, product.removed);
    if (!fs.existsSync(removedPath)) {
      console.log(`  SKIP ${product.label} — no removed.png`);
      continue;
    }

    const removedPng = fs.readFileSync(removedPath);
    const outputPath = path.join(PORTFOLIO, `${product.name}-fakebefore.jpg`);

    try {
      await createFakeBefore(removedPng, bgBuffers[product.bgIdx], outputPath, product.scale || 0.65, product.offsetY || 20);
      console.log(`  Created fake before: ${product.name}-fakebefore.jpg`);
    } catch (err: any) {
      console.error(`  FAILED ${product.label}: ${err.message}`);
    }
  }

  console.log("\nDone! Use *-fakebefore.jpg as BEFORE and *-white.jpg as AFTER");
}

main().catch(console.error);
