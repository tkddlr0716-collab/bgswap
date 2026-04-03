/**
 * 그림자 효과 테스트 — 떠있는 느낌 해결
 * sharp만 사용 (API 비용 $0)
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const REMOVED_PATH = path.resolve("scripts/test-output/bg-removal/shoe-removed.png");
const OUT_DIR = path.resolve("scripts/test-output/shadow-test");

async function createShadow(
  productBuffer: Buffer,
  bgColor: { r: number; g: number; b: number },
  shadowType: string
): Promise<Buffer> {
  const productMeta = await sharp(productBuffer).metadata();
  const pw = productMeta.width || 800;
  const ph = productMeta.height || 600;

  const canvasW = 1024;
  const canvasH = 1024;

  // 상품을 캔버스에 맞게 리사이즈 (여백 확보)
  const fitW = Math.floor(canvasW * 0.8);
  const fitH = Math.floor(canvasH * 0.75);
  const resizedProduct = await sharp(productBuffer)
    .resize(fitW, fitH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const resizedMeta = await sharp(resizedProduct).metadata();
  const rw = resizedMeta.width || fitW;
  const rh = resizedMeta.height || fitH;

  // 상품 위치 (하단 중앙 정렬, 그림자 공간 확보)
  const productTop = Math.floor((canvasH - rh) / 2) - 30;
  const productLeft = Math.floor((canvasW - rw) / 2);

  const layers: sharp.OverlayOptions[] = [];

  if (shadowType === "drop") {
    // Drop shadow: 상품 아래에 블러된 어두운 복사본
    const shadowBlur = await sharp(resizedProduct)
      .greyscale()
      .modulate({ brightness: 0 })
      .blur(25)
      .ensureAlpha(0.3)
      .toBuffer();

    layers.push({
      input: shadowBlur,
      top: productTop + 15,
      left: productLeft + 5,
    });
  } else if (shadowType === "bottom") {
    // Bottom reflection shadow: 하단에 타원형 그림자
    const shadowSvg = `
      <svg width="${canvasW}" height="${canvasH}">
        <ellipse cx="${canvasW / 2}" cy="${productTop + rh + 10}"
                 rx="${Math.floor(rw * 0.35)}" ry="18"
                 fill="rgba(0,0,0,0.15)" />
      </svg>
    `;
    layers.push({ input: Buffer.from(shadowSvg) });
  } else if (shadowType === "gradient") {
    // Gradient floor: 하단부에 그라데이션 바닥 느낌
    const gradH = 200;
    const gradTop = productTop + rh - 20;
    const gradSvg = `
      <svg width="${canvasW}" height="${canvasH}">
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(0,0,0,0.08)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="${gradTop}" width="${canvasW}" height="${gradH}" fill="url(#floor)" />
        <ellipse cx="${canvasW / 2}" cy="${gradTop + 5}"
                 rx="${Math.floor(rw * 0.4)}" ry="12"
                 fill="rgba(0,0,0,0.12)" />
      </svg>
    `;
    layers.push({ input: Buffer.from(gradSvg) });
  } else if (shadowType === "contact") {
    // Contact shadow: 상품 바로 아래 얇고 진한 그림자
    const contactSvg = `
      <svg width="${canvasW}" height="${canvasH}">
        <ellipse cx="${canvasW / 2}" cy="${productTop + rh + 3}"
                 rx="${Math.floor(rw * 0.3)}" ry="8"
                 fill="rgba(0,0,0,0.25)" />
        <ellipse cx="${canvasW / 2}" cy="${productTop + rh + 3}"
                 rx="${Math.floor(rw * 0.15)}" ry="4"
                 fill="rgba(0,0,0,0.15)" />
      </svg>
    `;
    layers.push({ input: Buffer.from(contactSvg) });
  }

  // 상품 레이어
  layers.push({
    input: resizedProduct,
    top: productTop,
    left: productLeft,
  });

  return sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: bgColor,
    },
  })
    .composite(layers)
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(REMOVED_PATH)) {
    console.error("❌ 배경 제거된 이미지가 없습니다. test-bg-removal.ts를 먼저 실행하세요.");
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const product = fs.readFileSync(REMOVED_PATH);

  const backgrounds = [
    { name: "white", color: { r: 255, g: 255, b: 255 } },
    { name: "light-gray", color: { r: 245, g: 245, b: 245 } },
    { name: "warm", color: { r: 250, g: 245, b: 238 } },
    { name: "dark", color: { r: 30, g: 30, b: 35 } },
  ];

  const shadowTypes = ["none", "drop", "bottom", "gradient", "contact"];

  console.log("=".repeat(60));
  console.log("  그림자 효과 테스트");
  console.log("=".repeat(60));

  for (const bg of backgrounds) {
    for (const shadow of shadowTypes) {
      const filename = `${bg.name}-${shadow}.jpg`;

      if (shadow === "none") {
        // 그림자 없는 기본 합성
        const resized = await sharp(product)
          .resize(820, 770, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();

        const result = await sharp({
          create: { width: 1024, height: 1024, channels: 3, background: bg.color },
        })
          .composite([{ input: resized, gravity: "center" }])
          .jpeg({ quality: 92 })
          .toBuffer();

        fs.writeFileSync(path.join(OUT_DIR, filename), result);
      } else {
        const result = await createShadow(product, bg.color, shadow);
        fs.writeFileSync(path.join(OUT_DIR, filename), result);
      }

      console.log(`  ✅ ${filename}`);
    }
  }

  console.log(`\n결과: ${OUT_DIR}`);
  console.log("\n비교할 것:");
  console.log("  1. *-none.jpg vs *-drop.jpg vs *-bottom.jpg vs *-gradient.jpg vs *-contact.jpg");
  console.log("  2. 어떤 그림자가 가장 자연스러운가?");
  console.log("  3. $29/100장 가치가 있는가?");
}

main().catch(console.error);
