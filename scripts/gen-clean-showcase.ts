/**
 * 깨끗한 엣지의 제품 사진만 선별하여 쇼케이스 생성
 * 배경이 단순한 이미지 → BiRefNet 엣지가 깔끔
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import Replicate from "replicate";

dotenv.config({ path: path.join(__dirname, "../.env.local") });
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const OUT = path.join(__dirname, "launch-assets");

// 배경이 단순하고 제품이 선명한 Pexels 무료 이미지
const PRODUCTS = [
  {
    name: "headphones",
    label: "Headphones",
    url: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&w=1000",
  },
  {
    name: "sunglasses",
    label: "Sunglasses",
    url: "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&w=1000",
  },
  {
    name: "bottle",
    label: "Water Bottle",
    url: "https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&w=1000",
  },
];

const KEY_BGS = [
  { name: "white", color: { r: 255, g: 255, b: 255 } },
  { name: "dark", color: { r: 30, g: 30, b: 35 } },
  { name: "marble", color: { r: 240, g: 238, b: 235 } },
  { name: "sunset", color: { r: 255, g: 200, b: 150 } },
  { name: "ocean", color: { r: 150, g: 200, b: 230 } },
];

async function processProduct(p: typeof PRODUCTS[0]) {
  console.log(`  ${p.label}...`);

  // Download
  const res = await fetch(p.url, { signal: AbortSignal.timeout(15000) });
  const orig = Buffer.from(await res.arrayBuffer());
  const origResized = await sharp(orig).resize(600, 600, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${p.name}-before.jpg`), origResized);

  // Remove background
  const output = await replicate.run(
    "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
    { input: { image: p.url } }
  );
  const removedRes = await fetch(String(output));
  const removed = Buffer.from(await removedRes.arrayBuffer());
  fs.writeFileSync(path.join(OUT, `${p.name}-removed.png`), removed);

  // Composite on key backgrounds
  for (const bg of KEY_BGS) {
    const product = await sharp(removed)
      .resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    const result = await sharp({ create: { width: 600, height: 600, channels: 3, background: bg.color } })
      .composite([{ input: product, gravity: "center" }])
      .jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${p.name}-${bg.name}.jpg`), result);
  }

  console.log(`    Done`);
  await new Promise(r => setTimeout(r, 5000)); // rate limit
}

async function main() {
  console.log("=== Clean Showcase Generation ===\n");
  for (const p of PRODUCTS) {
    try {
      await processProduct(p);
    } catch (err) {
      console.log(`    FAILED: ${err instanceof Error ? err.message.substring(0, 80) : err}`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("\nDone! Check images for edge quality before using.");
}

main().catch(console.error);
