import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "launch-assets");

const ALL_BGS: [string, { r: number; g: number; b: number }][] = [
  ["white", { r: 255, g: 255, b: 255 }],
  ["light-gray", { r: 245, g: 245, b: 245 }],
  ["warm", { r: 250, g: 245, b: 238 }],
  ["cool-gray", { r: 235, g: 238, b: 242 }],
  ["dark", { r: 30, g: 30, b: 35 }],
  ["sunset", { r: 255, g: 200, b: 150 }],
  ["ocean", { r: 150, g: 200, b: 230 }],
  ["mint", { r: 180, g: 230, b: 210 }],
  ["lavender", { r: 210, g: 190, b: 235 }],
  ["peach", { r: 255, g: 210, b: 190 }],
  ["marble", { r: 240, g: 238, b: 235 }],
  ["wood", { r: 180, g: 140, b: 100 }],
  ["linen", { r: 245, g: 240, b: 230 }],
  ["concrete", { r: 200, g: 200, b: 200 }],
  ["paper", { r: 252, g: 250, b: 245 }],
];

async function main() {
  const trimmed = await sharp(path.join(OUT, "sneaker-removed.png")).trim().png().toBuffer();
  const SIZE = 400;
  const product = await sharp(trimmed).resize(Math.round(SIZE * 0.75), Math.round(SIZE * 0.75), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  for (const [name, color] of ALL_BGS) {
    const result = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { ...color, alpha: 255 } } })
      .composite([{ input: product, gravity: "center" }]).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `sneaker-${name}.jpg`), result);
  }
  console.log("All 15 sneaker backgrounds regenerated (trimmed+centered, 400x400)");
}
main().catch(console.error);
