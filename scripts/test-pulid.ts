/**
 * Flux PuLID 테스트 - 얼굴 유사도 최대화
 * 참조 사진 여러장 활용
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import fs from "fs";
import path from "path";

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  // 테스트 사진 로드
  const testDir = path.resolve("test");
  const files = fs.readdirSync(testDir).filter(f => f.endsWith(".jpg"));
  console.log(`사진 ${files.length}장 로드: ${files.join(", ")}`);

  // 첫 번째 사진을 메인으로 사용
  const mainImage = fs.readFileSync(path.join(testDir, files[0]));
  const mainBase64 = `data:image/jpeg;base64,${mainImage.toString("base64")}`;

  const outDir = path.resolve("scripts/test-output/pulid");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // PuLID 모델 테스트
  const tests = [
    {
      name: "pulid-business",
      model: "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
      input: {
        prompt: "professional corporate headshot portrait photo, wearing dark navy business suit with white dress shirt, clean neutral gray studio background, soft professional studio lighting, sharp focus, high quality portrait photography, 85mm lens",
        main_face_image: mainBase64,
        num_outputs: 1,
        guidance_scale: 4,
        num_inference_steps: 20,
        id_weight: 1.0,
      },
    },
    {
      name: "pulid-casual",
      model: "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
      input: {
        prompt: "professional casual headshot portrait photo, wearing a smart casual dark crew neck sweater over collared shirt, natural warm lighting, softly blurred outdoor background with greenery, friendly confident smile, high quality portrait photography",
        main_face_image: mainBase64,
        num_outputs: 1,
        guidance_scale: 4,
        num_inference_steps: 20,
        id_weight: 1.0,
      },
    },
    {
      name: "pulid-creative",
      model: "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
      input: {
        prompt: "creative professional headshot portrait photo, wearing stylish modern black turtleneck, dramatic cinematic side lighting, dark moody background with subtle color gradient, artistic portrait photography, confident expression",
        main_face_image: mainBase64,
        num_outputs: 1,
        guidance_scale: 4,
        num_inference_steps: 20,
        id_weight: 1.0,
      },
    },
  ];

  console.log("\n" + "=".repeat(60));
  console.log("  Flux PuLID 테스트 (얼굴 유사도 중심)");
  console.log("=".repeat(60));

  for (const t of tests) {
    console.log(`\n▶ [${t.name}]`);
    const start = Date.now();

    try {
      const output = await replicate.run(t.model as `${string}/${string}`, {
        input: t.input,
      });
      const elapsed = (Date.now() - start) / 1000;

      let url: string;
      if (Array.isArray(output)) {
        url = String(output[0]);
      } else if (typeof output === "object" && output !== null) {
        // some models return {output: [url]} or iterator
        const arr = [];
        for await (const item of output as AsyncIterable<unknown>) {
          arr.push(String(item));
        }
        url = arr[0] || String(output);
      } else {
        url = String(output);
      }

      console.log(`  ✅ ${elapsed.toFixed(1)}초`);

      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${t.name}.png`), buffer);
      console.log(`  저장: ${t.name}.png`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${msg.slice(0, 300)}`);
    }

    // rate limit 방지
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n결과 → ${outDir}`);
  console.log("비용 → replicate.com/account/billing");
}

main().catch(console.error);
