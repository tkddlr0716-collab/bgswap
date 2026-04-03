/**
 * Phase 0: 상품 사진 배경 제거 + 교체 테스트
 *
 * 테스트 항목:
 * 1. 배경 제거 (BRIA RMBG)
 * 2. 템플릿 합성 (sharp - AI 미사용)
 * 3. AI inpainting 배경 교체
 * 4. 비용 실측
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// 샘플 상품 이미지 (공개 URL)
// 1개만 먼저 테스트 (rate limit 대응)
const SAMPLE_PRODUCTS = [
  {
    name: "shoe",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    desc: "Red Nike shoe on pink background",
  },
];

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const outDir = path.resolve("scripts/test-output/bg-removal");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 로컬 상품 사진도 확인
  const localDir = path.resolve("test-products");
  if (fs.existsSync(localDir)) {
    const localFiles = fs.readdirSync(localDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    for (const f of localFiles) {
      const buf = fs.readFileSync(path.join(localDir, f));
      const rotated = await sharp(buf).rotate().jpeg({ quality: 90 }).toBuffer();
      const base64 = `data:image/jpeg;base64,${rotated.toString("base64")}`;
      SAMPLE_PRODUCTS.push({ name: f.replace(/\.[^.]+$/, ""), url: base64, desc: `Local: ${f}` });
    }
  }

  console.log("=".repeat(60));
  console.log("  Phase 0: 배경 제거 + 교체 테스트");
  console.log("=".repeat(60));

  for (const product of SAMPLE_PRODUCTS) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`상품: ${product.name} (${product.desc})`);
    console.log("─".repeat(60));

    // ─── 1. 원본 저장 ───
    let originalBuffer: Buffer;
    if (product.url.startsWith("data:")) {
      originalBuffer = Buffer.from(product.url.split(",")[1], "base64");
    } else {
      const res = await fetch(product.url);
      originalBuffer = Buffer.from(await res.arrayBuffer());
    }
    fs.writeFileSync(path.join(outDir, `${product.name}-original.jpg`), originalBuffer);

    // ─── 2. 배경 제거 ───
    console.log("\n▶ 배경 제거 (BRIA RMBG)...");
    const removeStart = Date.now();
    let removedUrl: string;
    try {
      const output = await replicate.run("bria/remove-background", {
        input: { image: product.url },
      });
      removedUrl = String(output);
      const removeTime = (Date.now() - removeStart) / 1000;
      console.log(`  ✅ ${removeTime.toFixed(1)}초`);

      const removedRes = await fetch(removedUrl);
      const removedBuffer = Buffer.from(await removedRes.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${product.name}-removed.png`), removedBuffer);

      // ─── 3. 템플릿 합성 (sharp) ───
      console.log("\n▶ 템플릿 합성...");

      // 배경 색상 옵션
      const backgrounds = [
        { name: "white", color: { r: 255, g: 255, b: 255 } },
        { name: "marble", color: { r: 230, g: 225, b: 220 } },
        { name: "dark", color: { r: 30, g: 30, b: 35 } },
      ];

      for (const bg of backgrounds) {
        const composited = await sharp({
          create: {
            width: 1024,
            height: 1024,
            channels: 3,
            background: bg.color,
          },
        })
          .composite([
            {
              input: await sharp(removedBuffer)
                .resize(900, 900, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toBuffer(),
              gravity: "center",
            },
          ])
          .jpeg({ quality: 90 })
          .toBuffer();

        fs.writeFileSync(
          path.join(outDir, `${product.name}-bg-${bg.name}.jpg`),
          composited
        );
        console.log(`  ✅ ${bg.name} → ${product.name}-bg-${bg.name}.jpg`);
      }

      // ─── 4. AI 배경 교체 (Flux Kontext) ───
      console.log("\n▶ AI 배경 교체 (Flux Kontext Pro)...");
      const aiStart = Date.now();
      try {
        // 흰 배경에 상품을 올린 이미지를 입력으로 사용
        const whiteBase = await sharp({
          create: { width: 1024, height: 1024, channels: 3, background: { r: 255, g: 255, b: 255 } },
        })
          .composite([{
            input: await sharp(removedBuffer)
              .resize(900, 900, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .toBuffer(),
            gravity: "center",
          }])
          .jpeg({ quality: 90 })
          .toBuffer();

        const whiteBaseB64 = `data:image/jpeg;base64,${whiteBase.toString("base64")}`;

        const aiOutput = await replicate.run("black-forest-labs/flux-kontext-pro", {
          input: {
            image: whiteBaseB64,
            prompt: "Place this product on a beautiful natural wooden table surface with soft warm studio lighting, clean professional product photography, shallow depth of field, keep the product exactly the same",
            aspect_ratio: "1:1",
          },
        });
        const aiTime = (Date.now() - aiStart) / 1000;
        const aiUrl = Array.isArray(aiOutput) ? String(aiOutput[0]) : String(aiOutput);
        console.log(`  ✅ ${aiTime.toFixed(1)}초`);

        const aiRes = await fetch(aiUrl);
        const aiBuffer = Buffer.from(await aiRes.arrayBuffer());
        fs.writeFileSync(path.join(outDir, `${product.name}-ai-wood.jpg`), aiBuffer);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ AI 교체 실패: ${msg.slice(0, 150)}`);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ 배경 제거 실패: ${msg.slice(0, 200)}`);
    }

    // rate limit 방지 (크레딧 $5 미만 시 분당 6회 제한)
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("  결과");
  console.log("=".repeat(60));
  console.log(`\n파일: ${outDir}`);
  console.log("비용: replicate.com/account/billing\n");
  console.log("확인할 것:");
  console.log("  1. *-removed.png: 상품이 깔끔하게 분리됐나?");
  console.log("  2. *-bg-white.jpg: 흰 배경 합성 자연스러운가?");
  console.log("  3. *-bg-marble.jpg: 대리석 배경 자연스러운가?");
  console.log("  4. *-ai-wood.jpg: AI 배경 자연스러운가? 상품 변형 없나?");
  console.log("  5. billing에서 비용 확인 (배경 제거 + AI 교체)");
}

main().catch(console.error);
