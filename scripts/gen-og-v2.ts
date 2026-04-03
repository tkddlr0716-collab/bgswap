import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "../public");
const SHOWCASE = path.join(__dirname, "../public/showcase");

async function main() {
  const W = 1200, H = 630;

  const mugBefore = await sharp(path.join(SHOWCASE, "mug-before.jpg")).resize(220, 220, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const mugWhite = await sharp(path.join(SHOWCASE, "mug-white.jpg")).resize(220, 220, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const backpackWhite = await sharp(path.join(SHOWCASE, "after-backpack-white.jpg")).resize(220, 220, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="60" y="100" font-family="Arial,Helvetica" font-size="48" font-weight="800" fill="white">Upload Once.</text>
    <text x="60" y="160" font-family="Arial,Helvetica" font-size="48" font-weight="800" fill="#f59e0b">Get 15 Backgrounds.</text>
    <text x="60" y="210" font-family="Arial,Helvetica" font-size="20" fill="#94a3b8">AI product photo backgrounds for e-commerce sellers</text>
    <rect x="60" y="240" width="200" height="32" rx="16" fill="#f59e0b"/>
    <text x="160" y="262" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#0f172a">From $0.29/product</text>
    <text x="595" y="555" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">BEFORE</text>
    <text x="830" y="555" text-anchor="middle" font-family="Arial" font-size="12" fill="#94a3b8">White</text>
    <text x="1060" y="555" text-anchor="middle" font-family="Arial" font-size="12" fill="#94a3b8">Backpack</text>
    <text x="725" y="430" font-family="Arial" font-size="28" fill="#f59e0b" font-weight="700">→</text>
    <text x="60" y="${H - 30}" font-family="Arial" font-size="18" font-weight="600" fill="#64748b">bgswap.io</text>
  </svg>`;

  const bg = await sharp(Buffer.from(svg)).png().toBuffer();
  const ogImage = await sharp(bg)
    .composite([
      { input: mugBefore, left: 485, top: 310 },
      { input: mugWhite, left: 720, top: 310 },
      { input: backpackWhite, left: 950, top: 310 },
    ])
    .png().toBuffer();

  fs.writeFileSync(path.join(OUT, "og-image.png"), ogImage);
  console.log(`OG image saved (${(ogImage.length / 1024).toFixed(0)}KB)`);
}
main().catch(console.error);
