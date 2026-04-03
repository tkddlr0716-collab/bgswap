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
  ["ocean", { r: 150, g: 200, b: 230 }],
];

async function main() {
  const trimmed = await sharp(path.join(OUT, "sneaker-removed.png")).trim().png().toBuffer();
  const SIZE = 600, FILL = 0.75;
  const product = await sharp(trimmed).resize(Math.round(SIZE * FILL), Math.round(SIZE * FILL), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  for (const [name, color] of BGS) {
    const result = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { ...color, alpha: 255 } } })
      .composite([{ input: product, gravity: "center" }]).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(PUBLIC, `sneaker-${name}.jpg`), result);
    console.log(`sneaker-${name}.jpg`);
  }
  console.log("Done!");
}
main().catch(console.error);
