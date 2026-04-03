/**
 * 추가 모델 테스트 - InstantID, PhotoMaker
 * 기존 PuLID와 비교하여 얼굴 유사도 검증
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";

async function prepareImage(filePath: string): Promise<string> {
  const rotated = await sharp(filePath).rotate().toBuffer();
  const metadata = await sharp(rotated).metadata();
  const w = metadata.width || 1024;
  const h = metadata.height || 1024;
  const cropH = Math.floor(h * 0.6);
  const cropW = Math.min(w, Math.floor(cropH * 0.8));
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
  const image = await prepareImage(path.join(testDir, files[0]));

  const outDir = path.resolve("scripts/test-output/more-models");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const headshot_prompt = "professional corporate headshot portrait photo, facing camera directly, eye level, wearing dark navy business suit with white dress shirt, neutral gray studio background, soft studio lighting, natural relaxed expression, high quality portrait photography, 85mm lens";

  const tests = [
    // InstantID
    {
      name: "instantid-business",
      model: "zsxkib/instant-id:6af8583c541261472e92155d87bba80d5ad98461665802f2ba196ac099aaedc9",
      input: {
        image: image,
        prompt: "a man, " + headshot_prompt,
        negative_prompt: "blurry, low quality, deformed, ugly, cartoon, anime, illustration, painting",
        width: 1024,
        height: 1024,
        guidance_scale: 5,
        num_inference_steps: 30,
        ip_adapter_scale: 0.8,
      },
    },
    // InstantID - casual
    {
      name: "instantid-casual",
      model: "zsxkib/instant-id:6af8583c541261472e92155d87bba80d5ad98461665802f2ba196ac099aaedc9",
      input: {
        image: image,
        prompt: "a man, professional casual headshot portrait, facing camera, crew neck sweater, warm outdoor background blurred, natural daylight, friendly smile, portrait photography",
        negative_prompt: "blurry, low quality, deformed, ugly, cartoon, anime",
        width: 1024,
        height: 1024,
        guidance_scale: 5,
        num_inference_steps: 30,
        ip_adapter_scale: 0.8,
      },
    },
    // InstantID - creative
    {
      name: "instantid-creative",
      model: "zsxkib/instant-id:6af8583c541261472e92155d87bba80d5ad98461665802f2ba196ac099aaedc9",
      input: {
        image: image,
        prompt: "a man, creative professional headshot, black turtleneck, dramatic cinematic side lighting, dark moody background, confident expression, artistic portrait photography",
        negative_prompt: "blurry, low quality, deformed, ugly, cartoon, anime",
        width: 1024,
        height: 1024,
        guidance_scale: 5,
        num_inference_steps: 30,
        ip_adapter_scale: 0.8,
      },
    },
  ];

  console.log("=".repeat(60));
  console.log("  추가 모델 테스트 (InstantID + PhotoMaker)");
  console.log("=".repeat(60));

  for (const t of tests) {
    console.log(`\n▶ [${t.name}] (${t.model})`);
    const start = Date.now();

    try {
      const output = await replicate.run(t.model as `${string}/${string}`, {
        input: t.input,
      });
      const elapsed = (Date.now() - start) / 1000;

      let url: string;
      if (Array.isArray(output)) {
        url = String(output[0]);
      } else if (typeof output === "string") {
        url = output;
      } else {
        // Handle async iterators
        const arr = [];
        for await (const item of output as AsyncIterable<unknown>) {
          arr.push(String(item));
        }
        url = arr[0] || "";
      }

      if (!url || !url.startsWith("http")) {
        console.error(`  ❌ 유효하지 않은 URL: ${url}`);
        continue;
      }

      console.log(`  ✅ ${elapsed.toFixed(1)}초`);
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(outDir, `${t.name}.png`), buffer);
      console.log(`  → ${t.name}.png`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ ${msg.slice(0, 250)}`);
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n결과 → ${outDir}`);
  console.log("비용 → replicate.com/account/billing");
}

main().catch(console.error);
