/**
 * 모든 showcase 이미지를 trim(투명 제거) 후 중앙 배치로 재생성
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "launch-assets");
const PUBLIC = path.join(__dirname, "../public/showcase");

const BGS: [string, { r: number; g: number; b: number }][] = [
  ["white", { r: 255, g: 255, b: 255 }],
  ["dark", { r: 30, g: 30, b: 35 }],
  ["marble", { r: 240, g: 238, b: 235 }],
  ["sunset", { r: 255, g: 200, b: 150 }],
];

const PRODUCTS = ["mug", "sneaker"];

async function recomposite(name: string) {
  const removedPath = path.join(OUT, `${name}-removed.png`);
  if (!fs.existsSync(removedPath)) {
    console.log(`  ${name}: no removed.png, skip`);
    return;
  }

  // Trim transparent pixels to get tight bounding box around product
  const trimmed = await sharp(removedPath)
    .trim()  // removes transparent border
    .png()
    .toBuffer();

  const trimMeta = await sharp(trimmed).metadata();
  console.log(`  ${name}: trimmed to ${trimMeta.width}x${trimMeta.height}`);

  const SIZE = 600;
  const FILL = 0.75; // product fills 75% of canvas
  const productSize = Math.round(SIZE * FILL);

  // Resize trimmed product to fit within productSize, maintaining aspect ratio
  const product = await sharp(trimmed)
    .resize(productSize, productSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  for (const [bgName, color] of BGS) {
    const result = await sharp({
      create: { width: SIZE, height: SIZE, channels: 4, background: { ...color, alpha: 255 } },
    })
      .composite([{ input: product, gravity: "center" }])
      .jpeg({ quality: 92 })
      .toBuffer();

    fs.writeFileSync(path.join(OUT, `${name}-${bgName}.jpg`), result);
    fs.writeFileSync(path.join(PUBLIC, `${name}-${bgName}.jpg`), result);
    console.log(`    ${name}-${bgName}.jpg`);
  }
}

async function main() {
  console.log("Regenerating with trim + center...\n");
  for (const name of PRODUCTS) {
    await recomposite(name);
  }
  console.log("\nDone!");
}

main().catch(console.error);
