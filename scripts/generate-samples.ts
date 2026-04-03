/**
 * Before/After 샘플 이미지 생성 (v6 최종 — 단일 제품 + 어수선한 배경 6세트)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import sharp from "sharp";
import Replicate from "replicate";
import { compositeProductOnBg, BG_OPTIONS } from "../src/lib/compositor";

const SAMPLES = [
  {
    id: "backpack",
    label: "Olive Backpack on stone ledge, outdoor greenery",
    url: "https://images.pexels.com/photos/2081199/pexels-photo-2081199.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "minibag",
    label: "Pastel Mini Bags on pink/mint split background",
    url: "https://images.pexels.com/photos/1038000/pexels-photo-1038000.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "coffee",
    label: "Latte art coffee cup on bench, blurry background",
    url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "bag",
    label: "Leather Messenger Bag on gray studio backdrop",
    url: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "paperbag",
    label: "Kraft Paper Bags on red background",
    url: "https://images.pexels.com/photos/1666067/pexels-photo-1666067.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "mug",
    label: "White Ceramic Mug on wood table",
    url: "https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
];

const OUT_DIR = path.join(process.cwd(), "public", "samples");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;

  let output: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      output = await replicate.run("bria/remove-background", {
        input: { image: dataUri },
      });
      break;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("429") && attempt < 4) {
        const wait = (attempt + 1) * 12;
        console.log(`  Rate limited, waiting ${wait}s...`);
        await sleep(wait * 1000);
      } else {
        throw err;
      }
    }
  }

  const res = await fetch(String(output));
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("ERROR: REPLICATE_API_TOKEN not set.");
    process.exit(1);
  }

  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const licenseLog: string[] = [
    "# Sample Image Sources & Licenses",
    `\nGenerated: ${new Date().toISOString()}\n`,
  ];

  for (const sample of SAMPLES) {
    console.log(`\n=== ${sample.id} ===`);
    try {
      console.log("  Downloading...");
      const res = await fetch(sample.url);
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const original = Buffer.from(await res.arrayBuffer());

      // Keep original aspect ratio, just limit max dimension
      const beforeBuffer = await sharp(original)
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, `before-${sample.id}.jpg`), beforeBuffer);
      console.log(`  ✓ before`);

      console.log("  Removing background...");
      const productPng = await removeBackground(original);

      for (const bg of BG_OPTIONS) {
        const composited = await compositeProductOnBg(productPng, bg.color, 1024);
        fs.writeFileSync(path.join(OUT_DIR, `after-${sample.id}-${bg.name}.jpg`), composited);
      }
      console.log(`  ✓ 15 backgrounds`);

      licenseLog.push(
        `## ${sample.id}`,
        `- **Label:** ${sample.label}`,
        `- **Source:** ${sample.url}`,
        `- **License:** ${sample.license}`,
        `- **Brand logos:** None\n`,
      );

      console.log(`  ✅ Done`);
      await sleep(15000);
    } catch (err) {
      console.error(`  ❌ Failed:`, err);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, "LICENSES.md"), licenseLog.join("\n"));
  const files = fs.readdirSync(OUT_DIR).filter(f => !f.endsWith(".md"));
  console.log(`\n=== Total: ${files.length} images ===`);
}

main().catch(console.error);
