/**
 * PuLID 2차 테스트
 * - 정면 포즈 강조
 * - id_weight 최대
 * - 여러 참조 사진 시도
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import fs from "fs";
import path from "path";

const PULID_MODEL = "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b";

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const testDir = path.resolve("test");
  const files = fs.readdirSync(testDir).filter(f => f.endsWith(".jpg")).sort();

  // 4장 모두 base64로
  const images = files.map(f => {
    const buf = fs.readFileSync(path.join(testDir, f));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  });

  const outDir = path.resolve("scripts/test-output/pulid2");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`참조 사진 ${images.length}장`);

  const tests = [
    {
      name: "business-front",
      prompt: "a professional corporate headshot photo of this person, facing directly forward, looking straight at the camera at eye level, wearing a dark navy business suit with white dress shirt and tie, neutral gray studio background, soft even studio lighting on both sides of the face, shoulders squared to camera, natural relaxed expression, high quality professional portrait photography",
      id_weight: 1.2,
      image: images[0],
    },
    {
      name: "business-img2",
      prompt: "a professional corporate headshot photo of this person, facing directly forward, looking straight at the camera at eye level, wearing a dark navy business suit with white dress shirt and tie, neutral gray studio background, soft even studio lighting on both sides of the face, shoulders squared to camera, natural relaxed expression, high quality professional portrait photography",
      id_weight: 1.2,
      image: images[1],  // 두번째 사진으로
    },
    {
      name: "casual-front",
      prompt: "a professional casual headshot photo of this person, facing directly forward, looking straight at the camera at eye level, wearing a dark crew neck sweater over white collared shirt, warm natural outdoor background softly blurred, natural daylight lighting, friendly slight smile, shoulders squared to camera, professional portrait photography",
      id_weight: 1.2,
      image: images[0],
    },
    {
      name: "creative-front",
      prompt: "a creative professional headshot photo of this person, facing directly forward, looking straight at the camera at eye level, wearing a stylish black turtleneck, dramatic studio lighting from the side, clean dark background, confident expression, shoulders squared to camera, cinematic portrait photography",
      id_weight: 1.2,
      image: images[0],
    },
    {
      name: "business-maxid",
      prompt: "a professional corporate headshot photo of this exact person, facing directly forward at eye level, dark suit white shirt, gray background, studio lighting, portrait photography",
      id_weight: 1.5,  // 최대치 시도
      image: images[0],
    },
  ];

  console.log("=".repeat(60));
  console.log("  PuLID 2차 - 정면 포즈 + id_weight 강화");
  console.log("=".repeat(60));

  for (const t of tests) {
    console.log(`\n▶ [${t.name}] id_weight=${t.id_weight}`);
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
      console.log(`  → ${t.name}.png`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${msg.slice(0, 200)}`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n결과 → ${outDir}`);
}

main().catch(console.error);
