/**
 * Capture demo animation HTML as GIF using Puppeteer
 * Output: scripts/launch-assets/demo.gif
 */
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import GIFEncoder from "gif-encoder";

const HTML = `file:///${path.join(__dirname, "launch-assets/demo-animation.html").replace(/\\/g, "/")}`;
const OUT = path.join(__dirname, "launch-assets/demo.gif");
const W = 640, H = 360;
const FPS = 5;
const DURATION_S = 28;

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(HTML, { waitUntil: "networkidle0", timeout: 15000 });

  // Wait for images
  await new Promise(r => setTimeout(r, 1000));

  const totalFrames = DURATION_S * FPS;
  const encoder = new GIFEncoder(W, H);
  const writeStream = fs.createWriteStream(OUT);
  encoder.pipe(writeStream);
  encoder.setFrameRate(FPS);
  encoder.setQuality(20);
  encoder.setRepeat(0);
  encoder.writeHeader();

  console.log(`Capturing ${totalFrames} frames at ${FPS}fps...`);

  for (let i = 0; i < totalFrames; i++) {
    const screenshot = await page.screenshot({ type: "png" });
    // Resize to GIF dimensions
    const resized = await sharp(screenshot)
      .resize(W, H)
      .raw()
      .toBuffer();

    encoder.addFrame(resized as unknown as number[]);

    if (i % (FPS * 3) === 0) {
      console.log(`  ${Math.round((i / totalFrames) * 100)}%`);
    }

    // Wait for next frame
    await new Promise(r => setTimeout(r, 1000 / FPS));
  }

  encoder.finish();
  await browser.close();

  // Wait for write to finish
  await new Promise(r => writeStream.on("finish", r));

  const stat = fs.statSync(OUT);
  console.log(`\nDone! ${OUT}`);
  console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
}

main().catch(console.error);
