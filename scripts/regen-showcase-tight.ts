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

async function recomposite(name: string) {
  const removed = fs.readFileSync(path.join(OUT, `${name}-removed.png`));
  const SIZE = 600;
  const FILL = 0.70; // tighter padding — product fills 70% of frame

  const productSize = Math.round(SIZE * FILL);
  const product = await sharp(removed)
    .resize(productSize, productSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  for (const [bgName, color] of BGS) {
    const result = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: color } })
      .composite([{ input: product, gravity: "center" }])
      .jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}-${bgName}.jpg`), result);
    fs.writeFileSync(path.join(PUBLIC, `${name}-${bgName}.jpg`), result);
    console.log(`  ${name}-${bgName}.jpg`);
  }
}

async function main() {
  console.log("Recompositing with tighter padding (0.70)...\n");
  await recomposite("mug");
  await recomposite("sneaker");
  console.log("\nDone!");
}

main().catch(console.error);
