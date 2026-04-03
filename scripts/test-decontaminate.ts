/**
 * 유리병 decontamination 테스트 — 기존 removed.png로 재합성
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { compositeProductOnBg, BG_OPTIONS } from "../src/lib/compositor";

const PORTFOLIO = path.join(__dirname, "launch-assets/portfolio");

async function main() {
  const removedPng = fs.readFileSync(path.join(PORTFOLIO, "perfume-removed.png"));

  // Dark background test
  const darkBg = BG_OPTIONS.find(b => b.name === "dark")!;
  const whiteBg = BG_OPTIONS.find(b => b.name === "white")!;

  const darkResult = await compositeProductOnBg(removedPng, darkBg.color, { size: 1024, padding: 0.8 });
  fs.writeFileSync(path.join(PORTFOLIO, "perfume-dark-v2.jpg"), darkResult);
  console.log("Saved perfume-dark-v2.jpg");

  const whiteResult = await compositeProductOnBg(removedPng, whiteBg.color, { size: 1024, padding: 0.8 });
  fs.writeFileSync(path.join(PORTFOLIO, "perfume-white-v2.jpg"), whiteResult);
  console.log("Saved perfume-white-v2.jpg");
}

main().catch(console.error);
