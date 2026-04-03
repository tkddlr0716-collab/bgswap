/**
 * OG Image 생성 (1200x630) — SNS 공유용
 * 랜딩 페이지 톤 일치: 화이트 배경, 앰버+블루 강조
 * 15배경 셀링포인트 강조
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "../public");
const ASSETS = path.join(__dirname, "launch-assets");

async function main() {
  const W = 1200, H = 630;

  // 스니커 배경 5종 로드 (15배경 중 대표 5개)
  const size = 160;
  const loadImg = (name: string) =>
    sharp(path.join(ASSETS, name))
      .resize(size, size, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toBuffer();

  const sneakerWhite = await loadImg("sneaker-white.jpg");
  const sneakerDark = await loadImg("sneaker-dark.jpg");
  const sneakerMarble = await loadImg("sneaker-marble.jpg");
  const sneakerSunset = await loadImg("sneaker-sunset.jpg");
  const sneakerOcean = await loadImg("sneaker-ocean.jpg");

  // 머그 before → after 비교용
  const mugBefore = await loadImg("mug-before.jpg");
  const mugWhite = await loadImg("mug-white.jpg");

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <!-- 화이트 배경 -->
    <rect width="${W}" height="${H}" fill="#ffffff"/>

    <!-- 상단 앰버 액센트 라인 -->
    <rect width="${W}" height="4" fill="#FBBF24"/>

    <!-- 메인 카피 -->
    <text x="60" y="90" font-family="Arial,Helvetica" font-size="44" font-weight="800" fill="#0f172a">Upload Once.</text>
    <text x="60" y="145" font-family="Arial,Helvetica" font-size="44" font-weight="800" fill="#2563EB">Get 15 Backgrounds.</text>
    <text x="60" y="190" font-family="Arial,Helvetica" font-size="18" fill="#4B5563">AI product photo backgrounds for e-commerce sellers</text>

    <!-- 가격 뱃지 -->
    <rect x="60" y="215" width="220" height="34" rx="17" fill="#EFF6FF"/>
    <text x="170" y="238" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="#2563EB">From $0.29/product · One-time</text>

    <!-- Before → After 라벨 -->
    <text x="60" y="300" font-family="Arial" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="1">BEFORE</text>
    <text x="255" y="300" font-family="Arial" font-size="22" fill="#FBBF24" font-weight="700">→</text>
    <text x="290" y="300" font-family="Arial" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="1">AFTER</text>

    <!-- Before/After 카드 배경 (둥근 모서리) -->
    <rect x="55" y="310" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>
    <rect x="230" y="310" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>

    <!-- 15 Backgrounds 그리드 라벨 -->
    <text x="620" y="90" font-family="Arial" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="1">15 BACKGROUNDS PER PHOTO</text>

    <!-- 그리드 카드 배경 -->
    <rect x="615" y="105" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>
    <rect x="795" y="105" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>
    <rect x="975" y="105" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>
    <rect x="615" y="290" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>
    <rect x="795" y="290" width="${size + 10}" height="${size + 10}" rx="8" fill="#F3F4F6"/>

    <!-- 그리드 라벨 -->
    <text x="${620 + size / 2}" y="${285}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">White</text>
    <text x="${800 + size / 2}" y="${285}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Dark</text>
    <text x="${980 + size / 2}" y="${285}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Marble</text>
    <text x="${620 + size / 2}" y="${470}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Sunset</text>
    <text x="${800 + size / 2}" y="${470}" text-anchor="middle" font-family="Arial" font-size="11" fill="#64748b">Ocean</text>

    <!-- +10 more 뱃지 -->
    <rect x="975" y="290" width="${size + 10}" height="${size + 10}" rx="8" fill="#EFF6FF"/>
    <text x="${980 + size / 2}" y="375" text-anchor="middle" font-family="Arial" font-size="28" font-weight="800" fill="#2563EB">+10</text>
    <text x="${980 + size / 2}" y="400" text-anchor="middle" font-family="Arial" font-size="13" fill="#2563EB">more</text>

    <!-- 하단 URL + 설명 -->
    <text x="60" y="${H - 30}" font-family="Arial" font-size="16" font-weight="700" fill="#0f172a">bgswap.io</text>
    <text x="170" y="${H - 30}" font-family="Arial" font-size="14" fill="#94a3b8">Try Free — No Credit Card</text>
  </svg>`;

  const bg = await sharp(Buffer.from(svg)).png().toBuffer();
  const ogImage = await sharp(bg)
    .composite([
      // Before → After (머그)
      { input: mugBefore, left: 60, top: 315 },
      { input: mugWhite, left: 235, top: 315 },
      // 15배경 그리드 (스니커 5종)
      { input: sneakerWhite, left: 620, top: 110 },
      { input: sneakerDark, left: 800, top: 110 },
      { input: sneakerMarble, left: 980, top: 110 },
      { input: sneakerSunset, left: 620, top: 295 },
      { input: sneakerOcean, left: 800, top: 295 },
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(OUT, "og-image.png"), ogImage);
  console.log(`OG image saved: public/og-image.png (${(ogImage.length / 1024).toFixed(0)}KB)`);
}

main().catch(console.error);
