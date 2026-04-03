/**
 * PuLID 3차 - EXIF 회전 보정 + 얼굴 크롭 후 테스트
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const PULID_MODEL = "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b";

async function prepareImage(filePath: string): Promise<string> {
  // sharp.rotate()는 EXIF orientation을 자동 보정
  const rotated = await sharp(filePath).rotate().toBuffer();
  const metadata = await sharp(rotated).metadata();
  const w = metadata.width || 1024;
  const h = metadata.height || 1024;

  // 상반신 크롭: 상단 60%, 중앙 정렬
  const cropH = Math.floor(h * 0.6);
  const cropW = Math.min(w, Math.floor(cropH * 0.8)); // 4:5 비율
  const left = Math.floor((w - cropW) / 2);

  const cropped = await sharp(rotated)
    .extract({ left, top: 0, width: cropW, height: cropH })
    .resize(1024, 1024, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return `data:image/jpeg;base64,${cropped.toString("base64")}`;
}

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const testDir = path.resolve("test");
  const files = fs.readdirSync(testDir).filter(f => f.endsWith(".jpg")).sort();

  const outDir = path.resolve("scripts/test-output/pulid3");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 전처리된 이미지 저장해서 확인 가능하게
  console.log("사진 전처리 중 (EXIF 회전 보정 + 얼굴 크롭)...");
  const preparedImages: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const prepared = await prepareImage(path.join(testDir, files[i]));
    preparedImages.push(prepared);

    // 전처리 결과 저장
    const buf = Buffer.from(prepared.split(",")[1], "base64");
    fs.writeFileSync(path.join(outDir, `input-${i}.jpg`), buf);
    console.log(`  ${files[i]} → input-${i}.jpg`);
  }

  const tests = [
    {
      name: "biz-photo1",
      prompt: "professional corporate headshot portrait, facing camera directly, eye level, dark navy suit, white shirt, tie, neutral gray studio background, soft studio lighting, relaxed natural expression, high resolution portrait photography",
      image: preparedImages[0],
      id_weight: 1.0,
    },
    {
      name: "biz-photo3",
      prompt: "professional corporate headshot portrait, facing camera directly, eye level, dark navy suit, white shirt, tie, neutral gray studio background, soft studio lighting, relaxed natural expression, high resolution portrait photography",
      image: preparedImages[2],  // 3번째 사진
      id_weight: 1.0,
    },
    {
      name: "casual-photo1",
      prompt: "professional casual headshot portrait, facing camera directly, eye level, wearing dark crew neck sweater, warm natural outdoor background blurred, natural daylight, friendly smile, portrait photography",
      image: preparedImages[0],
      id_weight: 1.0,
    },
    {
      name: "creative-photo1",
      prompt: "creative professional headshot portrait, facing camera directly, eye level, black turtleneck, dramatic cinematic lighting, dark background, confident expression, artistic portrait",
      image: preparedImages[0],
      id_weight: 1.0,
    },
  ];

  console.log("\n" + "=".repeat(60));
  console.log("  PuLID 3차 - 회전 보정 + 얼굴 크롭");
  console.log("=".repeat(60));

  for (const t of tests) {
    console.log(`\n▶ [${t.name}]`);
    const start = Date.now();

    try {
      const output = await replicate.run(PULID_MODEL as `${string}/${string}:${string}`, {
        input: {
          prompt: t.prompt,
          main_face_image: t.image,
          num_outputs: 1,
          guidance_scale: 4,
          num_inference_steps: 20,
          id_weight: t.id_weight,
        },
      });
      const elapsed = (Date.now() - start) / 1000;

      let url: string;
      if (Array.isArray(output)) {
        url = String(output[0]);
      } else {
        const arr = [];
        for await (const item of output as AsyncIterable<unknown>) {
          arr.push(String(item));
        }
        url = arr[0];
      }

      console.log(`  ✅ ${elapsed.toFixed(1)}초`);
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${t.name}.png`), buffer);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${msg.slice(0, 200)}`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n결과 → ${outDir}`);
}

main().catch(console.error);
