/**
 * professional-headshot 모델 프롬프트 튜닝
 * 얼굴 유사도 최대화 + 스타일 다양화
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import fs from "fs";
import path from "path";

const TEST_IMAGE_PATH = "./test-selfie.jpg";

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const absPath = path.resolve(TEST_IMAGE_PATH);
  const fileBuffer = fs.readFileSync(absPath);
  const base64 = fileBuffer.toString("base64");
  const imageInput = `data:image/jpeg;base64,${base64}`;

  const outDir = path.resolve("scripts/test-output/prompts");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const prompts: Record<string, string> = {
    // 최소 프롬프트 - 모델 기본 동작에 맡김
    "minimal": "Professional headshot photo",

    // 얼굴 보존 강조
    "face-preserve": "Professional corporate headshot. Keep the exact same face, do not change facial features at all. Studio lighting, gray background.",

    // 옷만 변경 지시
    "suit-only": "Put this person in a dark navy suit with white shirt. Professional headshot with studio lighting and neutral background. Do not modify the face.",

    // 캐주얼 - 옷만
    "casual-sweater": "Put this person in a casual crew neck sweater. Natural warm lighting, blurred outdoor background. Do not modify the face at all.",

    // 크리에이티브 - 배경만
    "creative-bg": "Professional headshot with dramatic cinematic lighting and dark moody background. Keep the person exactly as they are, only change the lighting and background.",

    // 단순 배경 교체
    "white-bg": "Clean professional headshot on pure white background with soft studio lighting. Keep the face and appearance exactly the same.",
  };

  console.log("=".repeat(60));
  console.log("  프롬프트 튜닝 테스트 (professional-headshot)");
  console.log("=".repeat(60));

  for (const [name, prompt] of Object.entries(prompts)) {
    console.log(`\n▶ [${name}]`);
    console.log(`  프롬프트: "${prompt.slice(0, 80)}..."`);
    const start = Date.now();

    try {
      const output = await replicate.run(
        "flux-kontext-apps/professional-headshot",
        { input: { input_image: imageInput, prompt } }
      );
      const elapsed = (Date.now() - start) / 1000;
      const url = Array.isArray(output) ? String(output[0]) : String(output);

      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${name}.png`), buffer);
      console.log(`  ✅ ${elapsed.toFixed(1)}초 → ${name}.png`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${msg.slice(0, 150)}`);
    }

    // rate limit 방지
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n결과 → ${outDir}`);
  console.log("비용 → replicate.com/account/billing");
}

main().catch(console.error);
