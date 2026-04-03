import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#1e40af"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="240" text-anchor="middle" fill="white" font-size="80" font-weight="bold" font-family="Arial, sans-serif">BgSwap</text>
  <text x="600" y="320" text-anchor="middle" fill="#bfdbfe" font-size="32" font-family="Arial, sans-serif">Studio-Quality Product Photos in Seconds</text>
  <line x1="400" y1="380" x2="800" y2="380" stroke="#60a5fa" stroke-width="2"/>
  <text x="600" y="430" text-anchor="middle" fill="#93c5fd" font-size="24" font-family="Arial, sans-serif">AI Background Removal + 15 Professional Backgrounds</text>
  <text x="600" y="480" text-anchor="middle" fill="white" font-size="28" font-weight="bold" font-family="Arial, sans-serif">$4.99 for 10 photos · $29 for 100 photos</text>
  <text x="600" y="560" text-anchor="middle" fill="#93c5fd" font-size="20" font-family="Arial, sans-serif">No subscription · 7-day money-back guarantee</text>
</svg>`;

const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
const outputPath = join(__dirname, "..", "public", "og-image.png");
writeFileSync(outputPath, buffer);
console.log("OG image generated:", outputPath);
