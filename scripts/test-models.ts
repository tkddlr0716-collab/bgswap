/**
 * 여러 모델 비교 테스트
 * npx tsx scripts/test-models.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import fs from "fs";
import path from "path";

const TEST_IMAGE_PATH = "./test-selfie.jpg";

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  // 이미지 준비
  const absPath = path.resolve(TEST_IMAGE_PATH);
  const fileBuffer = fs.readFileSync(absPath);
  const base64 = fileBuffer.toString("base64");
  const mime = "image/jpeg";
  const imageInput = `data:${mime};base64,${base64}`;

  const outDir = path.resolve("scripts/test-output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 모델 목록
  const models = [
    {
      name: "kontext-pro-direct",
      model: "black-forest-labs/flux-kontext-pro" as const,
      input: {
        image: imageInput,
        prompt: "Transform this photo into a professional corporate headshot portrait. The person should wear a dark navy business suit with white dress shirt. Set against a clean neutral gray studio background with soft professional lighting. Keep the face exactly the same, maintain all facial features, skin tone, and expression. High quality professional photography, 85mm portrait lens, shallow depth of field.",
        aspect_ratio: "1:1",
      },
    },
    {
      name: "kontext-pro-casual",
      model: "black-forest-labs/flux-kontext-pro" as const,
      input: {
        image: imageInput,
        prompt: "Transform this photo into a professional but casual headshot portrait. The person should wear a smart casual outfit like a henley or crew neck sweater. Set against a warm, softly blurred natural background. Keep the face exactly the same, maintain all facial features perfectly. Natural warm lighting, friendly confident expression, modern professional portrait photography.",
        aspect_ratio: "1:1",
      },
    },
    {
      name: "kontext-pro-creative",
      model: "black-forest-labs/flux-kontext-pro" as const,
      input: {
        image: imageInput,
        prompt: "Transform this photo into a creative professional headshot portrait. The person should wear a stylish modern outfit. Set against a dramatic, slightly colorful background with cinematic lighting. Keep the face exactly the same, maintain all facial features perfectly. Artistic portrait photography with dramatic side lighting and rich colors.",
        aspect_ratio: "1:1",
      },
    },
  ];

  console.log("=".repeat(60));
  console.log("  모델 비교 테스트");
  console.log("=".repeat(60));

  for (const m of models) {
    console.log(`\n▶ ${m.name} 생성 중... (${m.model})`);
    const start = Date.now();

    try {
      const output = await replicate.run(m.model, { input: m.input });
      const elapsed = (Date.now() - start) / 1000;
      const url = Array.isArray(output) ? String(output[0]) : String(output);

      console.log(`  ✅ 완료 (${elapsed.toFixed(1)}초)`);

      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outPath = path.join(outDir, `${m.name}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  저장: ${outPath}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ 실패: ${msg.slice(0, 200)}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("  결과 → scripts/test-output/ 폴더 확인");
  console.log("  비용 → replicate.com/account/billing");
  console.log("=".repeat(60));
}

main().catch(console.error);
