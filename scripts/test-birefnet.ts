/**
 * bria/remove-background vs lucataco/remove-bg (BiRefNet) 비교
 *
 * 실행: npx tsx scripts/test-birefnet.ts
 * 비용: ~$0.004 (2 predictions)
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Replicate from "replicate";

dotenv.config({ path: path.join(import.meta.dirname || __dirname, "../.env.local") });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

// Use an existing R2 upload image
const TEST_IMAGE = process.argv[2] || `${process.env.R2_PUBLIC_URL}/uploads/2f3abfeb-c295-49b6-9585-dab4ad5bc4cb/d7cc5daa-ff24-4fa5-9a76-3f1e930532a6.jpg`;

const MODELS = [
  { id: "bria/remove-background", label: "Bria", input: (url: string) => ({ image: url }) },
  { id: "lucataco/remove-bg", label: "BiRefNet", input: (url: string) => ({ image_path: url }) },
] as const;

async function testModel(model: typeof MODELS[number]) {
  console.log(`\n--- ${model.label} (${model.id}) ---`);
  const start = Date.now();

  try {
    const prediction = await replicate.predictions.create({
      model: model.id as string,
      input: model.input(TEST_IMAGE),
    });

    // Wait for completion
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise(r => setTimeout(r, 1000));
      result = await replicate.predictions.get(result.id);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (result.status === "failed") {
      console.log(`  Status: FAILED`);
      console.log(`  Error: ${result.error}`);
      return;
    }

    const predictTime = result.metrics?.predict_time;
    const outputUrl = typeof result.output === "string" ? result.output : (result.output as string[])?.[0] || String(result.output);

    console.log(`  Status: ${result.status}`);
    console.log(`  Predict time: ${predictTime?.toFixed(2)}s`);
    console.log(`  Total time: ${elapsed}s`);
    console.log(`  Output: ${outputUrl?.substring(0, 100)}...`);

    // Download and check file size
    const res = await fetch(outputUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`  Output size: ${(buf.length / 1024).toFixed(0)}KB`);

      // Save for visual comparison
      const outDir = path.join(import.meta.dirname || __dirname, "model-comparison");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${model.label.toLowerCase()}-result.png`);
      fs.writeFileSync(outPath, buf);
      console.log(`  Saved: ${outPath}`);
    }
  } catch (err) {
    console.log(`  Error: ${err}`);
  }
}

async function main() {
  console.log("=== Background Removal Model Comparison ===");
  console.log(`Image: ${TEST_IMAGE}`);

  for (const model of MODELS) {
    await testModel(model);
  }

  console.log("\n=== Done ===");
  console.log("Compare results in scripts/model-comparison/");
}

main().catch(console.error);
