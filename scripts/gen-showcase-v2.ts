/**
 * 론칭 쇼케이스 이미지 v2 생성
 * - 실제 상품 사진 대신 Sharp로 고품질 목업 생성
 * - 브랜드 투톤 컬러 적용
 * - 극적 Before/After
 */
import path from "path";
import fs from "fs";
import sharp from "sharp";

const OUT = path.join(__dirname, "launch-assets");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/*
 * 브랜드 컬러 리서치 결론:
 *
 * 1. Primary: Deep Blue (#1e40af) — 신뢰, 전문성 (SaaS 표준)
 * 2. Accent: Vivid Amber (#f59e0b) — 행동 유도, 긴급성
 *
 * 근거:
 * - Hagtvedt & Brasel (2017): saturated warm colors → 즉각적 행동, 구매 의지 상승
 * - 보색 대비 (blue ↔ orange/amber): Von Restorff isolation effect — CTA가 배경에서 튀어나옴
 * - Kolenda: light background + saturated accent = conversion-focused
 * - Stripe, Vercel, Linear 등 고전환 SaaS: dark blue/navy + amber/orange accent 패턴
 *
 * 적용:
 * - 배경: Deep Navy gradient (#0f172a → #1e3a5f)
 * - CTA: Amber (#f59e0b) — 유일한 warm color로 시각적 격리
 * - 텍스트: White on dark, Dark on light
 * - 보조: Slate gray (#64748b) for muted text
 */

// Brand colors
const NAVY = { r: 15, g: 23, b: 42 };       // #0f172a
const BLUE = { r: 37, g: 99, b: 235 };      // #2563eb
const AMBER = { r: 245, g: 158, b: 11 };    // #f59e0b
const WHITE = { r: 255, g: 255, b: 255 };
const LIGHT = { r: 248, g: 250, b: 252 };   // #f8fafc

// Product mockup: create a realistic bottle/box shape
async function createProductMockup(w: number, h: number): Promise<Buffer> {
  // Create a sleek product bottle shape with gradient
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e2e8f0"/>
        <stop offset="30%" stop-color="#f8fafc"/>
        <stop offset="70%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
      <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="4" dy="6" stdDeviation="8" flood-opacity="0.15"/>
      </filter>
    </defs>
    <!-- Cap -->
    <rect x="${w*0.32}" y="${h*0.02}" width="${w*0.36}" height="${h*0.12}" rx="4" fill="url(#cap)" filter="url(#shadow)"/>
    <!-- Body -->
    <rect x="${w*0.2}" y="${h*0.13}" width="${w*0.6}" height="${h*0.8}" rx="12" fill="url(#body)" filter="url(#shadow)"/>
    <!-- Label area -->
    <rect x="${w*0.25}" y="${h*0.3}" width="${w*0.5}" height="${h*0.35}" rx="4" fill="#1e40af" opacity="0.9"/>
    <!-- Label text -->
    <text x="${w*0.5}" y="${h*0.45}" text-anchor="middle" font-family="Arial" font-size="${w*0.08}" font-weight="700" fill="white">LUXE</text>
    <text x="${w*0.5}" y="${h*0.55}" text-anchor="middle" font-family="Arial" font-size="${w*0.04}" fill="#93c5fd">Premium Serum</text>
    <!-- Highlight -->
    <rect x="${w*0.55}" y="${h*0.15}" width="${w*0.04}" height="${h*0.75}" rx="2" fill="white" opacity="0.15"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Create messy background (before)
async function createMessyBg(w: number, h: number): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="messy" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d4c5a9"/>
        <stop offset="50%" stop-color="#c9b896"/>
        <stop offset="100%" stop-color="#b8a67e"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#messy)"/>
    <!-- Random clutter shapes -->
    <circle cx="${w*0.1}" cy="${h*0.8}" r="${w*0.08}" fill="#a89070" opacity="0.4"/>
    <rect x="${w*0.7}" y="${h*0.1}" width="${w*0.25}" height="${h*0.15}" rx="4" fill="#8b7355" opacity="0.3" transform="rotate(15 ${w*0.8} ${h*0.17})"/>
    <circle cx="${w*0.85}" cy="${h*0.75}" r="${w*0.06}" fill="#9a8565" opacity="0.35"/>
    <rect x="${w*0.05}" y="${h*0.15}" width="${w*0.15}" height="${h*0.1}" fill="#7d6b4f" opacity="0.2" transform="rotate(-8 ${w*0.1} ${h*0.2})"/>
    <!-- Shadow/wrinkle lines -->
    <line x1="0" y1="${h*0.6}" x2="${w}" y2="${h*0.65}" stroke="#a08960" stroke-width="1" opacity="0.3"/>
    <line x1="0" y1="${h*0.35}" x2="${w}" y2="${h*0.3}" stroke="#a08960" stroke-width="0.5" opacity="0.2"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

// Composite product on colored background
async function productOnBg(product: Buffer, bgColor: { r: number; g: number; b: number }, size: number): Promise<Buffer> {
  const productResized = await sharp(product).resize(Math.round(size * 0.55), Math.round(size * 0.85), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: { ...bgColor, alpha: 255 } } })
    .composite([{ input: productResized, gravity: "center" }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function main() {
  console.log("Generating showcase assets v2...\n");

  const product = await createProductMockup(400, 700);
  fs.writeFileSync(path.join(OUT, "product-mockup.png"), product);
  console.log("  Product mockup created");

  // Before image: product on messy background
  const messyBg = await createMessyBg(800, 800);
  const productSmall = await sharp(product).resize(330, 580, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const beforeImg = await sharp(messyBg)
    .resize(800, 800)
    .composite([{ input: productSmall, gravity: "center" }])
    .jpeg({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "before.jpg"), beforeImg);
  console.log("  Before image created");

  // After images: 15 backgrounds
  const BG_CONFIGS: { name: string; color: { r: number; g: number; b: number } }[] = [
    { name: "white", color: { r: 255, g: 255, b: 255 } },
    { name: "light-gray", color: { r: 245, g: 245, b: 245 } },
    { name: "warm", color: { r: 255, g: 248, b: 240 } },
    { name: "cool-gray", color: { r: 235, g: 238, b: 242 } },
    { name: "dark", color: { r: 30, g: 30, b: 35 } },
    { name: "sunset", color: { r: 255, g: 200, b: 150 } },
    { name: "ocean", color: { r: 150, g: 200, b: 230 } },
    { name: "mint", color: { r: 180, g: 230, b: 210 } },
    { name: "lavender", color: { r: 210, g: 190, b: 235 } },
    { name: "peach", color: { r: 255, g: 210, b: 190 } },
    { name: "marble", color: { r: 240, g: 238, b: 235 } },
    { name: "wood", color: { r: 180, g: 140, b: 100 } },
    { name: "linen", color: { r: 245, g: 240, b: 230 } },
    { name: "concrete", color: { r: 200, g: 200, b: 200 } },
    { name: "paper", color: { r: 252, g: 250, b: 245 } },
  ];

  const THUMB = 220;
  const afterImages: Buffer[] = [];
  for (const bg of BG_CONFIGS) {
    const img = await productOnBg(product, bg.color, THUMB);
    afterImages.push(img);
  }
  console.log("  15 background variants created");

  // 5x3 grid of all 15
  const GAP = 6;
  const COLS = 5, ROWS = 3;
  const gridW = COLS * THUMB + (COLS - 1) * GAP;
  const gridH = ROWS * THUMB + (ROWS - 1) * GAP;

  const gridComposites = afterImages.map((buf, i) => ({
    input: buf,
    left: (i % COLS) * (THUMB + GAP),
    top: Math.floor(i / COLS) * (THUMB + GAP),
  }));

  const grid = await sharp({ create: { width: gridW, height: gridH, channels: 3, background: WHITE } })
    .composite(gridComposites)
    .jpeg({ quality: 92 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "15-grid-v2.jpg"), grid);
  console.log("  15-background grid created");

  // Dramatic before/after side by side
  const BA_W = 1270, BA_H = 760;
  const CARD = 320;

  const beforeThumb = await sharp(beforeImg).resize(CARD, CARD, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const afterWhite = await productOnBg(product, WHITE, CARD);
  const afterDark = await productOnBg(product, { r: 30, g: 30, b: 35 }, CARD);
  const afterSunset = await productOnBg(product, { r: 255, g: 200, b: 150 }, CARD);

  // Navy background with cards
  const baSvgBg = `<svg width="${BA_W}" height="${BA_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="navyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e3a5f"/>
      </linearGradient>
    </defs>
    <rect width="${BA_W}" height="${BA_H}" fill="url(#navyGrad)"/>
    <!-- Title -->
    <text x="${BA_W/2}" y="80" text-anchor="middle" font-family="Arial" font-size="40" font-weight="800" fill="white">Upload Once. Get 15 Backgrounds.</text>
    <text x="${BA_W/2}" y="120" text-anchor="middle" font-family="Arial" font-size="18" fill="#94a3b8">AI removes the background and generates professional product photos in 10 seconds</text>
    <!-- Arrow -->
    <text x="395" y="440" font-family="Arial" font-size="36" fill="#f59e0b" font-weight="700">→</text>
    <!-- Labels -->
    <text x="218" y="680" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">Original Photo</text>
    <text x="570" y="680" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">White — Amazon</text>
    <text x="830" y="680" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">Dark — Premium</text>
    <text x="1060" y="680" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">Sunset — Lifestyle</text>
    <!-- Badge -->
    <rect x="${BA_W/2 - 80}" y="${BA_H - 60}" width="160" height="32" rx="16" fill="#f59e0b"/>
    <text x="${BA_W/2}" y="${BA_H - 38}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#0f172a">From $0.02/image</text>
  </svg>`;
  const baBg = await sharp(Buffer.from(baSvgBg)).png().toBuffer();

  // Round corners helper
  async function roundCorners(img: Buffer, size: number, radius: number): Promise<Buffer> {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/></svg>`);
    return sharp(img).resize(size, size, { fit: "cover" })
      .composite([{ input: await sharp(mask).png().toBuffer(), blend: "dest-in" }])
      .png().toBuffer();
  }

  const rBefore = await roundCorners(beforeThumb, CARD, 16);
  const rWhite = await roundCorners(afterWhite, 240, 12);
  const rDark = await roundCorners(afterDark, 240, 12);
  const rSunset = await roundCorners(afterSunset, 240, 12);

  const baFinal = await sharp(baBg)
    .composite([
      { input: rBefore, left: 58, top: 160 },
      { input: rWhite, left: 450, top: 200 },
      { input: rDark, left: 710, top: 200 },
      { input: rSunset, left: 940, top: 200 },
    ])
    .jpeg({ quality: 94 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, "hero-banner-v2.jpg"), baFinal);
  console.log("  Hero banner created (1270x760)");

  // Pricing card image
  const pricingSvg = `<svg width="1270" height="760" xmlns="http://www.w3.org/2000/svg">
    <rect width="1270" height="760" fill="#f8fafc"/>
    <!-- Title -->
    <text x="635" y="80" text-anchor="middle" font-family="Arial" font-size="36" font-weight="800" fill="#0f172a">Simple Pricing. No Subscription.</text>
    <text x="635" y="115" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748b">One-time payment. 15 backgrounds per product. Download as ZIP.</text>

    <!-- Free card -->
    <rect x="100" y="160" width="300" height="460" rx="16" fill="white" stroke="#e2e8f0" stroke-width="2"/>
    <text x="250" y="210" text-anchor="middle" font-family="Arial" font-size="20" font-weight="600" fill="#0f172a">Free</text>
    <text x="250" y="270" text-anchor="middle" font-family="Arial" font-size="48" font-weight="800" fill="#0f172a">$0</text>
    <text x="250" y="320" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">1 product photo</text>
    <text x="250" y="345" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">5 background previews</text>
    <text x="250" y="370" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">512px, watermarked</text>
    <text x="250" y="395" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">No credit card needed</text>
    <rect x="150" y="430" width="200" height="44" rx="8" fill="white" stroke="#2563eb" stroke-width="2"/>
    <text x="250" y="458" text-anchor="middle" font-family="Arial" font-size="15" font-weight="600" fill="#2563eb">Try Free</text>

    <!-- Starter card -->
    <rect x="440" y="160" width="300" height="460" rx="16" fill="white" stroke="#e2e8f0" stroke-width="2"/>
    <text x="590" y="210" text-anchor="middle" font-family="Arial" font-size="20" font-weight="600" fill="#0f172a">Starter</text>
    <text x="590" y="270" text-anchor="middle" font-family="Arial" font-size="48" font-weight="800" fill="#0f172a">$4.99</text>
    <text x="590" y="320" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">10 product photos</text>
    <text x="590" y="345" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">15 backgrounds each</text>
    <text x="590" y="370" text-anchor="middle" font-family="Arial" font-size="14" font-weight="600" fill="#0f172a">= 150 images total</text>
    <text x="590" y="400" text-anchor="middle" font-family="Arial" font-size="13" fill="#2563eb" font-weight="600">$0.03 per image</text>
    <rect x="490" y="430" width="200" height="44" rx="8" fill="white" stroke="#2563eb" stroke-width="2"/>
    <text x="590" y="458" text-anchor="middle" font-family="Arial" font-size="15" font-weight="600" fill="#2563eb">Get Starter</text>

    <!-- Pro card (featured) -->
    <rect x="780" y="140" width="340" height="500" rx="16" fill="white" stroke="#2563eb" stroke-width="3"/>
    <!-- Best value badge -->
    <rect x="880" y="128" width="100" height="24" rx="12" fill="#f59e0b"/>
    <text x="930" y="145" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#0f172a">BEST VALUE</text>
    <text x="950" y="200" text-anchor="middle" font-family="Arial" font-size="22" font-weight="600" fill="#0f172a">Pro</text>
    <text x="950" y="270" text-anchor="middle" font-family="Arial" font-size="52" font-weight="800" fill="#0f172a">$29</text>
    <text x="950" y="320" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">100 product photos</text>
    <text x="950" y="345" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">15 backgrounds each</text>
    <text x="950" y="370" text-anchor="middle" font-family="Arial" font-size="14" font-weight="600" fill="#0f172a">= 1,500 images total</text>
    <text x="950" y="400" text-anchor="middle" font-family="Arial" font-size="13" fill="#2563eb" font-weight="600">$0.02 per image</text>
    <rect x="830" y="430" width="240" height="48" rx="8" fill="#2563eb"/>
    <text x="950" y="461" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="white">Get Pro</text>

    <!-- Footer -->
    <text x="635" y="700" text-anchor="middle" font-family="Arial" font-size="14" fill="#94a3b8">No subscription. No hidden fees. 7-day refund guarantee.</text>
  </svg>`;
  const pricingImg = await sharp(Buffer.from(pricingSvg)).jpeg({ quality: 94 }).toBuffer();
  fs.writeFileSync(path.join(OUT, "pricing-v2.jpg"), pricingImg);
  console.log("  Pricing card created (1270x760)");

  console.log(`\nAll assets saved to: ${OUT}`);
  console.log("\nBrand Colors:");
  console.log("  Primary: #1e40af (Deep Blue) — trust, professionalism");
  console.log("  Accent:  #f59e0b (Amber) — CTA, urgency, action");
  console.log("  Dark BG: #0f172a → #1e3a5f (Navy gradient)");
  console.log("  Muted:   #64748b (Slate) — secondary text");
}

main().catch(console.error);
