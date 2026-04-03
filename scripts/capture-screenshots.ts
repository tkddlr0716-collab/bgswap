import puppeteer from "puppeteer";
import path from "path";

async function main() {
  const htmlPath = `file:///${path.join(__dirname, "launch-assets/showcase.html").replace(/\\/g, "/")}`;
  const outDir = path.join(__dirname, "launch-assets");

  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1270, height: 760 });
  await page.goto(htmlPath, { waitUntil: "networkidle0", timeout: 30000 });

  // Wait for images to load
  await page.waitForFunction(() => {
    const imgs = document.querySelectorAll("img");
    return Array.from(imgs).every(img => img.complete && img.naturalWidth > 0);
  }, { timeout: 15000 }).catch(() => console.log("Some images may not have loaded"));

  const sections = [
    { selector: ".hero", name: "01-hero.png" },
    { selector: ".before-after", name: "02-before-after.png" },
    { selector: ".grid-page", name: "03-15-backgrounds.png" },
    { selector: ".pricing-page", name: "04-pricing.png" },
  ];

  for (const { selector, name } of sections) {
    const el = await page.$(selector);
    if (!el) { console.log(`  ${name}: element not found`); continue; }

    // Scroll to element
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 500));

    // Clip to exactly 1270x760
    const box = await el.boundingBox();
    if (!box) continue;

    await page.screenshot({
      path: path.join(outDir, name),
      clip: { x: box.x, y: box.y, width: 1270, height: 760 },
    });
    console.log(`  ${name} saved`);
  }

  await browser.close();
  console.log(`\nDone! Screenshots in: ${outDir}`);
}

main().catch(console.error);
