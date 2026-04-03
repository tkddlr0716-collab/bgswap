/**
 * PH Gallery 이미지 3장 생성 (1270x760)
 * Puppeteer로 HTML → PNG 스크린샷
 */
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const OUT = path.join(__dirname, "launch-assets");
const SHOWCASE = path.join(__dirname, "../public/showcase");
const ASSETS = path.join(__dirname, "launch-assets");

// 이미지를 base64 data URL로 변환
function img(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1) === "png" ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

const gallery1_hero = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1270px; height: 760px; background: #fff; font-family: -apple-system, 'Segoe UI', Arial, sans-serif; display: flex; align-items: flex-start; padding-top: 60px; justify-content: center; }
.wrap { display: flex; align-items: flex-start; gap: 50px; padding: 0 70px; }
.left { max-width: 440px; padding-top: 40px; }
.badge { display: inline-block; background: #EFF6FF; color: #1D4ED8; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 999px; margin-bottom: 20px; }
h1 { font-size: 52px; font-weight: 800; line-height: 1.15; color: #0f172a; margin-bottom: 16px; }
h1 span { color: #2563EB; }
.desc { font-size: 17px; color: #4B5563; line-height: 1.6; margin-bottom: 28px; }
.cta { display: inline-block; background: #FBBF24; color: #0f172a; font-size: 18px; font-weight: 700; padding: 16px 36px; border-radius: 10px; text-decoration: none; }
.price { margin-top: 12px; font-size: 14px; color: #6B7280; }
.right { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; gap: 12px; align-items: center; }
.product-img { width: 170px; height: 170px; object-fit: cover; border-radius: 12px; border: 1px solid #e5e7eb; }
.before-img { border: 2px solid #d1d5db; }
.arrow { font-size: 24px; color: #F59E0B; font-weight: 700; }
.label { font-size: 11px; color: #6B7280; text-align: center; margin-top: 4px; }
.label b { color: #2563EB; }
</style></head><body>
<div class="wrap">
  <div class="left">
    <div class="badge">Built for Amazon, Etsy & Shopify sellers</div>
    <h1>Upload Once.<br><span>Get 15 Backgrounds.</span></h1>
    <p class="desc">AI removes the background and generates 15 professional product photos — solids, gradients, textures — in seconds.</p>
    <a class="cta" href="#">Try Free — No Credit Card →</a>
    <p class="price">From $0.29/product · No subscription</p>
  </div>
  <div class="right">
    <div class="row">
      <div><img class="product-img before-img" src="${img(path.join(SHOWCASE, "mug-before.jpg"))}"><div class="label">Before</div></div>
      <div class="arrow">→</div>
      <div><img class="product-img" src="${img(path.join(SHOWCASE, "mug-white.jpg"))}"><div class="label">White · <b>Amazon</b></div></div>
      <div><img class="product-img" src="${img(path.join(SHOWCASE, "mug-dark.jpg"))}"><div class="label">Dark · <b>Premium</b></div></div>
    </div>
    <div class="row">
      <div><img class="product-img before-img" src="${img(path.join(SHOWCASE, "before-backpack.jpg"))}"><div class="label">Before</div></div>
      <div class="arrow">→</div>
      <div><img class="product-img" src="${img(path.join(SHOWCASE, "after-backpack-white.jpg"))}"><div class="label">White · <b>Amazon</b></div></div>
      <div><img class="product-img" src="${img(path.join(SHOWCASE, "after-backpack-dark.jpg"))}"><div class="label">Dark · <b>Premium</b></div></div>
    </div>
  </div>
</div>
</body></html>`;

// 15장 전체 그리드 — launch-assets의 스니커 15종 사용
const bgs = [
  { file: "sneaker-white.jpg", name: "White", cat: "Solid" },
  { file: "sneaker-light-gray.jpg", name: "Light Gray", cat: "Solid" },
  { file: "sneaker-warm.jpg", name: "Warm", cat: "Solid" },
  { file: "sneaker-cool-gray.jpg", name: "Cool Gray", cat: "Solid" },
  { file: "sneaker-dark.jpg", name: "Dark", cat: "Solid" },
  { file: "sneaker-sunset.jpg", name: "Sunset", cat: "Gradient" },
  { file: "sneaker-ocean.jpg", name: "Ocean", cat: "Gradient" },
  { file: "sneaker-mint.jpg", name: "Mint", cat: "Gradient" },
  { file: "sneaker-lavender.jpg", name: "Lavender", cat: "Gradient" },
  { file: "sneaker-peach.jpg", name: "Peach", cat: "Gradient" },
  { file: "sneaker-marble.jpg", name: "Marble", cat: "Texture" },
  { file: "sneaker-wood.jpg", name: "Wood", cat: "Texture" },
  { file: "sneaker-linen.jpg", name: "Linen", cat: "Texture" },
  { file: "sneaker-concrete.jpg", name: "Concrete", cat: "Texture" },
  { file: "sneaker-paper.jpg", name: "Paper", cat: "Texture" },
];

const bgCards = bgs.map(b =>
  `<div class="card"><img src="${img(path.join(ASSETS, b.file))}"><span class="name">${b.name}</span></div>`
).join("\n  ");

const gallery2_backgrounds = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1270px; height: 760px; background: #fff; font-family: -apple-system, 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; }
h2 { font-size: 34px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
.sub { font-size: 15px; color: #6B7280; margin-bottom: 12px; text-align: center; }
.cats { display: flex; gap: 20px; margin-bottom: 20px; }
.cat { font-size: 12px; font-weight: 600; color: #2563EB; background: #EFF6FF; padding: 4px 14px; border-radius: 999px; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 0 60px; width: 100%; }
.card { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; border: 1px solid #e5e7eb; }
.name { font-size: 11px; font-weight: 600; color: #374151; }
.row-label { grid-column: 1 / -1; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; padding-top: 6px; }
</style></head><body>
<h2>15 Backgrounds, Every Photo</h2>
<p class="sub">Solids, gradients, and textures — with realistic drop shadows</p>
<div class="cats">
  <span class="cat">5 Solids</span>
  <span class="cat">5 Gradients</span>
  <span class="cat">5 Textures</span>
</div>
<div class="grid">
  ${bgCards}
</div>
</body></html>`;

// Gallery 3: 대량 배치 + 경쟁사 비교 (핵심 차별점)
const gallery3_batch = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1270px; height: 760px; background: #fff; font-family: -apple-system, 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; }
h2 { font-size: 34px; font-weight: 800; color: #0f172a; }
.sub { font-size: 15px; color: #6B7280; margin-top: -28px; }
.batch { display: flex; align-items: center; gap: 40px; }
.batch-left { text-align: center; }
.batch-num { font-size: 72px; font-weight: 800; color: #2563EB; line-height: 1; }
.batch-label { font-size: 15px; color: #4B5563; margin-top: 4px; }
.arrow-big { font-size: 36px; color: #FBBF24; font-weight: 800; }
.batch-right { text-align: center; }
.batch-result { font-size: 72px; font-weight: 800; color: #16a34a; line-height: 1; }
.batch-time { display: inline-block; background: #F0FDF4; color: #166534; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 999px; margin-top: 10px; }
.table-wrap { width: 900px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; padding: 10px 16px; background: #F9FAFB; color: #6B7280; font-weight: 600; }
th.us { color: #2563EB; font-weight: 800; }
td { padding: 10px 16px; border-top: 1px solid #F3F4F6; color: #4B5563; }
td.highlight { color: #0f172a; font-weight: 700; }
td.green { color: #16a34a; font-weight: 700; }
.onetime { display: inline-block; background: #EFF6FF; color: #2563EB; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
</style></head><body>
<h2>Batch Processing — The Real Difference</h2>
<p class="sub">Upload 100 products at once. Get 1,500 images back.</p>
<div class="batch">
  <div class="batch-left">
    <div class="batch-num">100</div>
    <div class="batch-label">products uploaded</div>
  </div>
  <div class="arrow-big">→</div>
  <div class="batch-right">
    <div class="batch-result">1,500</div>
    <div class="batch-label">images ready to list</div>
    <div class="batch-time">~16 minutes · 3 parallel</div>
  </div>
</div>
<div class="table-wrap">
  <table>
    <thead>
      <tr><th></th><th>Studio</th><th>remove.bg</th><th>PhotoRoom</th><th class="us">BgSwap</th></tr>
    </thead>
    <tbody>
      <tr><td class="highlight">Cost per image</td><td>$10–50</td><td>$0.23</td><td>$7.50+/mo</td><td class="green">$0.02</td></tr>
      <tr><td class="highlight">Backgrounds</td><td>1 per shoot</td><td>Remove only</td><td>1 at a time</td><td class="green">15 automatic</td></tr>
      <tr><td class="highlight">Batch upload</td><td>✗</td><td>✗</td><td>✗</td><td class="green">100 at once</td></tr>
      <tr><td class="highlight">Pricing model</td><td>Per shoot</td><td>Credits</td><td>Monthly</td><td class="green"><span class="onetime">One-time</span></td></tr>
    </tbody>
  </table>
</div>
</body></html>`;

// Gallery 4: 가격표 (Free tier + /image 단가 병기)
const gallery4_pricing = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1270px; height: 760px; background: #fff; font-family: -apple-system, 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; }
h2 { font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.sub { font-size: 16px; color: #6B7280; margin-bottom: 36px; }
.cards { display: flex; gap: 24px; }
.card { width: 280px; padding: 32px 28px; border-radius: 16px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; }
.card.pro { border: 2px solid #2563EB; box-shadow: 0 8px 30px rgba(37,99,235,0.12); position: relative; }
.card.free { border: 1px dashed #d1d5db; }
.best { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #2563EB; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 16px; border-radius: 999px; white-space: nowrap; }
.price { font-size: 36px; font-weight: 800; color: #0f172a; }
.products { font-size: 15px; color: #6B7280; margin: 4px 0; }
.per { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
.btn { display: block; text-align: center; padding: 12px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; }
.btn-ghost { border: 1px solid #d1d5db; color: #374151; background: #fff; }
.btn-outline { border: 2px solid #2563EB; color: #2563EB; background: #fff; }
.btn-fill { background: #2563EB; color: #fff; border: none; }
.note { font-size: 11px; color: #9CA3AF; text-align: center; margin-top: 10px; }
.trust { display: flex; gap: 32px; margin-top: 32px; font-size: 13px; color: #6B7280; }
</style></head><body>
<h2>Simple, One-Time Pricing</h2>
<p class="sub">No subscription. No hidden fees. Pay once.</p>
<div class="cards">
  <div class="card free">
    <div class="price">Free</div>
    <div class="products">1 product preview</div>
    <div class="per">5 backgrounds · 512px · watermarked</div>
    <a class="btn btn-ghost" href="#">Try Free</a>
    <div class="note">No credit card required</div>
  </div>
  <div class="card">
    <div class="price">$4.99</div>
    <div class="products">10 products · 150 images</div>
    <div class="per">$0.50/product · $0.03/image</div>
    <a class="btn btn-outline" href="#">Get Started</a>
    <div class="note">Good for testing</div>
  </div>
  <div class="card pro">
    <div class="best">BEST VALUE — Save 42%</div>
    <div class="price">$29</div>
    <div class="products">100 products · 1,500 images</div>
    <div class="per">$0.29/product · $0.02/image</div>
    <a class="btn btn-fill" href="#">Get 1,500 Images</a>
    <div class="note">Most popular for sellers</div>
  </div>
</div>
<div class="trust">
  <span>🔒 Secure payment</span>
  <span>↩ 7-day money-back guarantee</span>
  <span>📧 Instant download link</span>
</div>
</body></html>`;

async function capture(html: string, filename: string) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1270, height: 760, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  const outPath = path.join(OUT, filename);
  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
  const size = fs.statSync(outPath).size;
  console.log(`Saved: ${filename} (${(size / 1024).toFixed(0)}KB)`);
}

async function main() {
  await capture(gallery1_hero, "gallery-1-hero.png");
  await capture(gallery2_backgrounds, "gallery-2-backgrounds.png");
  await capture(gallery3_batch, "gallery-3-batch.png");
  await capture(gallery4_pricing, "gallery-4-pricing.png");
  console.log("\nDone! Upload these 4 images to PH Gallery.");
}

main().catch(console.error);
