import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const OUT_DIR = path.join(process.cwd(), "public", "screenshots");
const BASE_URL = "https://bgswap.io";

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  // Screenshot 1: Landing Hero + Filmstrip
  console.log("1. Landing hero...");
  await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-1-hero.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });

  // Screenshot 1b: Landing with filmstrip (scroll down a bit)
  console.log("1b. Landing filmstrip...");
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-1b-filmstrip.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });

  // Screenshot 2: Upload page
  console.log("2. Upload page...");
  await page.goto(`${BASE_URL}/upload`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-2-upload.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });

  // Screenshot 3: Pricing section
  console.log("3. Pricing section...");
  await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
  // Scroll to pricing
  await page.evaluate(() => {
    const el = document.querySelector("h2");
    const sections = document.querySelectorAll("section");
    for (const s of sections) {
      if (s.textContent?.includes("Simple, One-Time Pricing")) {
        s.scrollIntoView({ behavior: "instant", block: "start" });
        break;
      }
    }
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-3-pricing.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });

  // Screenshot 4: Blog post
  console.log("4. Blog post...");
  await page.goto(`${BASE_URL}/blog/bgswap-vs-removebg-vs-photoroom`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-4-blog.png"),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });

  // Screenshot 5: Mobile landing
  console.log("5. Mobile landing...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshot-5-mobile.png"),
  });

  await browser.close();

  console.log("\n=== Screenshots saved ===");
  const files = fs.readdirSync(OUT_DIR);
  files.forEach((f) => {
    const stat = fs.statSync(path.join(OUT_DIR, f));
    console.log(`  ${f} (${Math.round(stat.size / 1024)}KB)`);
  });
}

main().catch(console.error);
