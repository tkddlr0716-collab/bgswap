/**
 * 추가 2세트 생성 (기존 4세트는 유지)
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
    label: "Olive Backpack (outdoor)",
    url: "https://images.pexels.com/photos/2081199/pexels-photo-2081199.jpeg?auto=compress&w=1200",
    license: "Pexels License",
  },
  {
    id: "minibag",
    label: "Pastel Mini Bags",
    url: "https://images.pexels.com/photos/1038000/pexels-photo-1038000.jpeg?auto=compress&w=1200",
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
  for (const sample of SAMPLES) {
    console.log(`\n=== ${sample.label} (${sample.id}) ===`);
    try {
      console.log("  Downloading...");
      const res = await fetch(sample.url);
      const original = Buffer.from(await res.arrayBuffer());

      const beforeBuffer = await sharp(original)
        .resize(1024, 1024, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, `before-${sample.id}.jpg`), beforeBuffer);
      console.log(`  ✓ before-${sample.id}.jpg`);

      console.log("  Removing background...");
      const productPng = await removeBackground(original);

      for (const bg of BG_OPTIONS) {
        const composited = await compositeProductOnBg(productPng, bg.color, 1024);
        fs.writeFileSync(path.join(OUT_DIR, `after-${sample.id}-${bg.name}.jpg`), composited);
      }
      console.log(`  ✓ 15 backgrounds saved`);
      console.log(`  ✅ Done`);

      await sleep(15000);
    } catch (err) {
      console.error(`  ❌ Failed:`, err);
    }
  }

  // Update LICENSES.md
  const licensePath = path.join(OUT_DIR, "LICENSES.md");
  let existing = fs.existsSync(licensePath) ? fs.readFileSync(licensePath, "utf-8") : "";
  for (const s of SAMPLES) {
    existing += `\n## ${s.id}\n- **Label:** ${s.label}\n- **Source:** ${s.url}\n- **License:** ${s.license}\n- **Brand logos:** None\n`;
  }
  fs.writeFileSync(licensePath, existing);

  console.log("\n=== Summary ===");
  const files = fs.readdirSync(OUT_DIR).filter(f => !f.endsWith(".md") && !fs.statSync(path.join(OUT_DIR, f)).isDirectory());
  console.log(`Total: ${files.length} images`);
}

main().catch(console.error);
