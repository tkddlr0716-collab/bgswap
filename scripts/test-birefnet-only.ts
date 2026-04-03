import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Replicate from "replicate";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  const img = `${process.env.R2_PUBLIC_URL}/uploads/2f3abfeb-c295-49b6-9585-dab4ad5bc4cb/d7cc5daa-ff24-4fa5-9a76-3f1e930532a6.jpg`;
  console.log("Testing BiRefNet...");
  const start = Date.now();
  const output = await replicate.run("lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1", { input: { image: img } });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("Total:", elapsed + "s");
  const url = String(output);
  console.log("Output:", url.substring(0, 100));
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("Size:", (buf.length / 1024).toFixed(0) + "KB");
  const outDir = path.join(__dirname, "model-comparison");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "birefnet-result.png"), buf);
  console.log("Saved to scripts/model-comparison/birefnet-result.png");
}
main().catch(console.error);
