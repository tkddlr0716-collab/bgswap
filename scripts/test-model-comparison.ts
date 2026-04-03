/**
 * Bria vs BiRefNet 다중 이미지 비교
 * 실행: npx tsx scripts/test-model-comparison.ts
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Replicate from "replicate";
import sharp from "sharp";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const outDir = path.join(__dirname, "model-comparison");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const MODELS = [
  { id: "bria/remove-background", label: "bria", inputKey: "image" },
  { id: "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1", label: "birefnet", inputKey: "image" },
];

async function testImage(imageUrl: string, name: string) {
  console.log(`\n=== ${name} ===`);
  console.log(`  URL: ${imageUrl.substring(0, 80)}...`);

  for (const model of MODELS) {
    const start = Date.now();
    try {
      const output = await replicate.run(model.id as `${string}/${string}`, {
        input: { [model.inputKey]: imageUrl },
      });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const url = String(output);

      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();

      const outPath = path.join(outDir, `${name}-${model.label}.png`);
      fs.writeFileSync(outPath, buf);

      console.log(`  ${model.label.padEnd(8)} | ${elapsed}s | ${meta.width}x${meta.height} | ${(buf.length / 1024).toFixed(0)}KB`);
    } catch (err: unknown) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ${model.label.padEnd(8)} | ${elapsed}s | FAILED: ${err instanceof Error ? err.message.substring(0, 60) : err}`);
    }

    // Rate limit 방지
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

  // 실제 업로드 이미지 가져오기
  const imgs = await db.execute("SELECT r2_key FROM images WHERE type = 'upload' ORDER BY uploaded_at DESC LIMIT 4");
  const urls = imgs.rows.map(r => `${process.env.R2_PUBLIC_URL}/${r.r2_key}`);

  console.log("╔═══════════════════════════════════════╗");
  console.log("║  Bria vs BiRefNet 비교 테스트          ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`  이미지 ${urls.length}장, 모델 ${MODELS.length}개`);
  console.log(`  format: model | time | resolution | size`);

  for (let i = 0; i < urls.length; i++) {
    await testImage(urls[i], `img${i + 1}`);
  }

  console.log(`\n=== 결과 저장 위치 ===`);
  console.log(`  ${outDir}`);
  console.log(`  파일 탐색기로 나란히 비교하세요`);
}

main().catch(console.error);
