import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import Replicate from "replicate";
dotenv.config({ path: path.join(__dirname, "../.env.local") });
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const OUT = path.join(__dirname, "launch-assets");

const url = "https://images.pexels.com/photos/1207918/pexels-photo-1207918.jpeg?auto=compress&w=1000";

async function main() {
  console.log("Processing mug...");
  const res = await fetch(url);
  const orig = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT, "mug-before.jpg"), await sharp(orig).resize(600, 600, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer());

  const output = await replicate.run("lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1", { input: { image: url } });
  const removed = Buffer.from(await (await fetch(String(output))).arrayBuffer());
  fs.writeFileSync(path.join(OUT, "mug-removed.png"), removed);

  const bgs: [string, { r: number; g: number; b: number }][] = [
    ["white", { r: 255, g: 255, b: 255 }],
    ["dark", { r: 30, g: 30, b: 35 }],
    ["marble", { r: 240, g: 238, b: 235 }],
    ["sunset", { r: 255, g: 200, b: 150 }],
    ["ocean", { r: 150, g: 200, b: 230 }],
  ];
  for (const [name, color] of bgs) {
    const prod = await sharp(removed).resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const result = await sharp({ create: { width: 600, height: 600, channels: 3, background: color } })
      .composite([{ input: prod, gravity: "center" }]).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `mug-${name}.jpg`), result);
  }
  console.log("Done!");
}
main().catch(e => console.error(e.message));
