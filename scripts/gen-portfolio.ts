/**
 * 포트폴리오 생성: 난잡한 배경 제품 사진 → 배경 제거 → 대표 배경 합성 → Before/After 레이아웃
 */
import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const OUT = path.join(__dirname, "launch-assets/portfolio");
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// 난잡한 배경의 제품 사진들 (Unsplash/Pexels 무료)
const PRODUCTS = [
  {
    name: "shoe-messy",
    label: "Shoe (messy)",
    // 운동화 on grass/outdoor
    url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200",
  },
  {
    name: "bag-cluttered",
    label: "Bag (cluttered)",
    // 가방 on busy table with other items
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200",
  },
  {
    name: "bottle-kitchen",
    label: "Bottle (kitchen)",
    // 물병 on messy kitchen counter
    url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200",
  },
  {
    name: "speaker-desk",
    label: "Speaker (desk)",
    // 스피커 on cluttered desk
    url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1200",
  },
  {
    name: "plant-shelf",
    label: "Plant (shelf)",
    // 화분 on busy shelf
    url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200",
  },
  {
    name: "cup-table",
    label: "Cup (table)",
    // 머그컵 on messy desk with papers
    url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1200",
  },
];

import { compositeProductOnBg, BG_OPTIONS } from "../src/lib/compositor";

// 대표 배경 4종
const BACKGROUNDS = [
  BG_OPTIONS.find(b => b.name === "white")!,
  BG_OPTIONS.find(b => b.name === "dark")!,
  BG_OPTIONS.find(b => b.name === "warm")!,
  BG_OPTIONS.find(b => b.name === "cool-gray")!,
];

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "BgSwap-Portfolio/1.0" } }, (res) => {
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

async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  // Upload to tmp file, use data URI
  const base64 = imageBuffer.toString("base64");
  const mimeType = "image/jpeg";
  const dataUri = `data:${mimeType};base64,${base64}`;

  const output = await replicate.run(
    "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
    { input: { image: dataUri } }
  );

  const resultUrl = String(output);
  const res = await fetch(resultUrl);
  return Buffer.from(await res.arrayBuffer());
}

// Uses the production compositor with decontamination
async function compositeOnBg(removedPng: Buffer, bgColor: { r: number; g: number; b: number }, size = 1024): Promise<Buffer> {
  return compositeProductOnBg(removedPng, bgColor, { size, padding: 0.8 });
}

async function processProduct(product: typeof PRODUCTS[0]) {
  console.log(`\n── ${product.label} ──`);

  // 1. Download
  console.log(`  Downloading...`);
  const originalBuf = await downloadImage(product.url);

  // Save original (resize to square-ish for consistency)
  const beforeBuf = await sharp(originalBuf)
    .resize(1024, 1024, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, `${product.name}-before.jpg`), beforeBuf);
  console.log(`  Saved before`);

  // 2. Remove background
  console.log(`  Removing background...`);
  const removedPng = await removeBackground(originalBuf);
  fs.writeFileSync(path.join(OUT, `${product.name}-removed.png`), removedPng);
  console.log(`  Background removed`);

  // 3. Composite on backgrounds (using production compositor with decontamination)
  for (const bg of BACKGROUNDS) {
    const result = await compositeOnBg(removedPng, bg.color);
    fs.writeFileSync(path.join(OUT, `${product.name}-${bg.name}.jpg`), result);
  }
  console.log(`  4 backgrounds composited`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Process all products with rate limit delay
  for (const product of PRODUCTS) {
    // Skip already processed
    if (fs.existsSync(path.join(OUT, `${product.name}-removed.png`))) {
      console.log(`\n── ${product.label} ── SKIP (already done)`);
      continue;
    }
    try {
      await processProduct(product);
    } catch (err: any) {
      console.error(`  FAILED: ${product.label}`, err?.message || err);
    }
    // Rate limit: wait 12s between products
    console.log(`  Waiting 12s for rate limit...`);
    await new Promise(r => setTimeout(r, 12_000));
  }

  console.log(`\n✅ Done! Files saved to: scripts/launch-assets/portfolio/`);
}

main().catch(console.error);
