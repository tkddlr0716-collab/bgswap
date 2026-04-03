/**
 * 100장 테스트 상품 이미지 생성
 * - 다양한 배경 (단색, 그라디언트, 패턴, 노이즈)
 * - 다양한 "상품" 형태 (원, 사각, 둥근 사각, 타원, 조합)
 * - 다양한 크기 (800~3000px)
 * - 실제 상품 사진과 유사하게: 중앙에 오브젝트 + 주변 배경
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUTPUT_DIR = path.join(__dirname, "images");

// 배경 색상 팔레트 (실제 상품 사진에서 흔한 배경들)
const BACKGROUNDS = [
  // 흰/밝은 배경 (가장 흔함)
  "#FFFFFF", "#F5F5F5", "#FAFAFA", "#F0F0F0", "#E8E8E8",
  // 나무/테이블
  "#8B6914", "#A0785A", "#C4A882", "#D2B48C", "#DEB887",
  // 파란 계열
  "#87CEEB", "#ADD8E6", "#B0C4DE", "#6495ED", "#4682B4",
  // 분홍/빨간
  "#FFB6C1", "#FFC0CB", "#FF69B4", "#FF6B6B", "#E74C3C",
  // 초록
  "#90EE90", "#98FB98", "#3CB371", "#2ECC71", "#27AE60",
  // 노란/주황
  "#FFD700", "#FFA500", "#FFBC42", "#F39C12", "#E67E22",
  // 회색/어두운
  "#808080", "#696969", "#555555", "#333333", "#1A1A1A",
  // 베이지/크림
  "#FFF8DC", "#FAEBD7", "#FFE4C4", "#FFFACD", "#FAF0E6",
];

// 상품 색상
const PRODUCT_COLORS = [
  "#2C3E50", "#E74C3C", "#3498DB", "#2ECC71", "#F1C40F",
  "#9B59B6", "#1ABC9C", "#E67E22", "#34495E", "#D35400",
  "#C0392B", "#2980B9", "#27AE60", "#8E44AD", "#F39C12",
  "#16A085", "#2C3E50", "#7F8C8D", "#BDC3C7", "#ECF0F1",
];

// 상품 하이라이트 색상 (입체감용)
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${nr},${ng},${nb})`;
}

type ProductShape = "bottle" | "box" | "circle" | "oval" | "bag" | "cup" | "tube" | "can";

function createProductSVG(
  w: number, h: number,
  shape: ProductShape,
  color: string,
  highlight: string,
): string {
  const cx = w / 2;
  const cy = h / 2;

  switch (shape) {
    case "bottle": {
      const bw = w * 0.25;
      const bh = h * 0.65;
      const nw = bw * 0.4;
      const nh = h * 0.12;
      const bx = cx - bw / 2;
      const by = cy - bh / 2 + nh / 2;
      const nx = cx - nw / 2;
      const ny = by - nh;
      return `
        <rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="3" fill="${highlight}"/>
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bw * 0.15}" fill="${color}"/>
        <rect x="${bx + bw * 0.1}" y="${by + bh * 0.15}" width="${bw * 0.35}" height="${bh * 0.5}" rx="4" fill="${highlight}" opacity="0.3"/>
        <rect x="${bx + bw * 0.15}" y="${by + bh * 0.7}" width="${bw * 0.7}" height="${bh * 0.08}" rx="2" fill="${highlight}" opacity="0.5"/>
      `;
    }
    case "box": {
      const bw = w * 0.4;
      const bh = h * 0.5;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      return `
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${color}"/>
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh * 0.2}" rx="6" fill="${highlight}" opacity="0.3"/>
        <line x1="${bx}" y1="${by + bh * 0.2}" x2="${bx + bw}" y2="${by + bh * 0.2}" stroke="${highlight}" stroke-width="2" opacity="0.4"/>
        <rect x="${bx + bw * 0.2}" y="${by + bh * 0.35}" width="${bw * 0.6}" height="${bh * 0.2}" rx="3" fill="${highlight}" opacity="0.2"/>
      `;
    }
    case "circle": {
      const r = Math.min(w, h) * 0.22;
      return `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
        <circle cx="${cx - r * 0.25}" cy="${cy - r * 0.25}" r="${r * 0.6}" fill="${highlight}" opacity="0.15"/>
        <ellipse cx="${cx}" cy="${cy + r * 0.75}" rx="${r * 0.8}" ry="${r * 0.1}" fill="rgba(0,0,0,0.1)"/>
      `;
    }
    case "oval": {
      const rx = w * 0.2;
      const ry = h * 0.3;
      return `
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>
        <ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.2}" rx="${rx * 0.5}" ry="${ry * 0.5}" fill="${highlight}" opacity="0.2"/>
      `;
    }
    case "bag": {
      const bw = w * 0.35;
      const bh = h * 0.5;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      const handleH = bh * 0.2;
      return `
        <path d="M${bx + bw * 0.25},${by} Q${bx + bw * 0.25},${by - handleH} ${cx},${by - handleH} Q${bx + bw * 0.75},${by - handleH} ${bx + bw * 0.75},${by}" stroke="${color}" stroke-width="4" fill="none"/>
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="${color}"/>
        <rect x="${bx + bw * 0.1}" y="${by + bh * 0.1}" width="${bw * 0.8}" height="${bh * 0.15}" rx="3" fill="${highlight}" opacity="0.3"/>
      `;
    }
    case "cup": {
      const bw = w * 0.25;
      const bh = h * 0.45;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      return `
        <path d="M${bx},${by} L${bx - bw * 0.05},${by + bh} L${bx + bw + bw * 0.05},${by + bh} L${bx + bw},${by} Z" fill="${color}"/>
        <ellipse cx="${cx}" cy="${by}" rx="${bw / 2}" ry="${bh * 0.06}" fill="${highlight}" opacity="0.4"/>
        <path d="M${bx + bw},${by + bh * 0.2} Q${bx + bw + bw * 0.35},${by + bh * 0.3} ${bx + bw + bw * 0.3},${by + bh * 0.5} Q${bx + bw + bw * 0.25},${by + bh * 0.7} ${bx + bw},${by + bh * 0.65}" stroke="${color}" stroke-width="5" fill="none"/>
      `;
    }
    case "tube": {
      const bw = w * 0.18;
      const bh = h * 0.55;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      return `
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="${color}"/>
        <rect x="${bx - bw * 0.1}" y="${by}" width="${bw * 1.2}" height="${bh * 0.1}" rx="3" fill="${highlight}"/>
        <rect x="${bx + bw * 0.15}" y="${by + bh * 0.2}" width="${bw * 0.3}" height="${bh * 0.45}" rx="3" fill="${highlight}" opacity="0.2"/>
      `;
    }
    case "can": {
      const bw = w * 0.22;
      const bh = h * 0.5;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      return `
        <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="8" fill="${color}"/>
        <ellipse cx="${cx}" cy="${by}" rx="${bw / 2}" ry="${bh * 0.05}" fill="${highlight}" opacity="0.4"/>
        <ellipse cx="${cx}" cy="${by + bh}" rx="${bw / 2}" ry="${bh * 0.04}" fill="rgba(0,0,0,0.15)"/>
        <rect x="${bx + bw * 0.1}" y="${by + bh * 0.3}" width="${bw * 0.8}" height="${bh * 0.35}" rx="3" fill="${highlight}" opacity="0.2"/>
      `;
    }
  }
}

const SHAPES: ProductShape[] = ["bottle", "box", "circle", "oval", "bag", "cup", "tube", "can"];

async function generateImage(index: number): Promise<void> {
  // 다양한 크기 (실제 상품 사진 범위)
  const sizes = [800, 1000, 1200, 1500, 1800, 2000, 2400, 2800, 3000];
  const size = sizes[index % sizes.length];
  const w = size;
  const h = size + Math.round((Math.random() - 0.5) * size * 0.3); // 약간 직사각형

  const bgColor = BACKGROUNDS[index % BACKGROUNDS.length];
  const productColor = PRODUCT_COLORS[(index * 7 + 3) % PRODUCT_COLORS.length];
  const highlight = lighten(productColor, 0.4);
  const shape = SHAPES[index % SHAPES.length];

  // 배경에 약간의 그라디언트/노이즈 효과를 위한 추가 요소
  const bgVariation = index % 4;
  let bgExtra = "";
  if (bgVariation === 1) {
    // 비네팅 효과
    bgExtra = `<rect width="${w}" height="${h}" fill="url(#vignette)"/>
      <defs><radialGradient id="vignette"><stop offset="60%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.15)"/></radialGradient></defs>`;
  } else if (bgVariation === 2) {
    // 가벼운 그림자/바닥면
    const floorY = h * 0.7;
    bgExtra = `<rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="rgba(0,0,0,0.04)"/>`;
  } else if (bgVariation === 3) {
    // 서클 장식
    bgExtra = `<circle cx="${w * 0.8}" cy="${h * 0.2}" r="${w * 0.08}" fill="rgba(255,255,255,0.3)"/>`;
  }

  // 제품 아래 그림자
  const shadowY = h * 0.65;
  const shadowRx = w * 0.15;
  const shadow = `<ellipse cx="${w / 2}" cy="${shadowY}" rx="${shadowRx}" ry="${shadowRx * 0.12}" fill="rgba(0,0,0,0.08)"/>`;

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${bgColor}"/>
    ${bgExtra}
    ${shadow}
    ${createProductSVG(w, h, shape, productColor, highlight)}
  </svg>`;

  const format = index % 5 === 0 ? "png" : "jpeg";
  const quality = 70 + (index % 25);

  const pipeline = sharp(Buffer.from(svg));

  if (format === "jpeg") {
    await pipeline.jpeg({ quality }).toFile(
      path.join(OUTPUT_DIR, `product_${String(index + 1).padStart(3, "0")}.jpg`)
    );
  } else {
    await pipeline.png().toFile(
      path.join(OUTPUT_DIR, `product_${String(index + 1).padStart(3, "0")}.png`)
    );
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Generating 100 test product images...");
  const start = Date.now();

  for (let i = 0; i < 100; i++) {
    await generateImage(i);
    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/100 generated`);
    }
  }

  // Summary
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith("product_"));
  let totalSize = 0;
  const sizeMap: Record<string, number> = {};
  for (const f of files) {
    const stat = fs.statSync(path.join(OUTPUT_DIR, f));
    totalSize += stat.size;
    const ext = path.extname(f);
    sizeMap[ext] = (sizeMap[ext] || 0) + 1;
  }

  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`Files: ${files.length}`);
  console.log(`Formats: ${JSON.stringify(sizeMap)}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Avg size: ${(totalSize / files.length / 1024).toFixed(0)}KB`);
}

main().catch(console.error);
