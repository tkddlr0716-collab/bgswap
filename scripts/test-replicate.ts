/**
 * Phase 0 테스트 스크립트
 *
 * 사용법:
 *   1. .env.local에 REPLICATE_API_TOKEN 설정
 *   2. 테스트할 셀카 파일 경로를 아래에 입력
 *   3. npx tsx scripts/test-replicate.ts
 *
 * 확인할 것:
 *   - 품질: $29 받을 만한가?
 *   - 비용: 1회 실행 비용?
 *   - 속도: 몇 초 걸리는가?
 *   - Go/No-Go 판단
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import fs from "fs";
import path from "path";

// ============================================================
// 이 값을 수정하세요
const TEST_IMAGE_PATH = "./test-selfie.jpg"; // 본인 셀카 경로
// ============================================================

const STYLES = {
  business:
    "Professional corporate headshot, dark navy suit, white shirt, neutral gray background, soft studio lighting, sharp focus, 85mm portrait lens, shallow depth of field",
  casual:
    "Professional casual headshot, smart casual attire, natural warm lighting, clean blurred background, friendly confident expression, high quality portrait photography",
  creative:
    "Creative professional headshot, modern artistic style, dramatic lighting, colorful but professional background, contemporary portrait photography",
};

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN이 설정되지 않았습니다.");
    console.error("   .env.local 파일에 추가하거나:");
    console.error("   REPLICATE_API_TOKEN=r8_xxx npx tsx scripts/test-replicate.ts");
    process.exit(1);
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  // 이미지 준비 (로컬 파일 또는 URL)
  let imageInput: string;
  if (TEST_IMAGE_PATH.startsWith("http")) {
    imageInput = TEST_IMAGE_PATH;
  } else {
    const absPath = path.resolve(TEST_IMAGE_PATH);
    if (!fs.existsSync(absPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${absPath}`);
      console.error("   TEST_IMAGE_PATH를 수정하세요.");
      process.exit(1);
    }
    const fileBuffer = fs.readFileSync(absPath);
    const base64 = fileBuffer.toString("base64");
    const ext = path.extname(absPath).slice(1);
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    imageInput = `data:${mime};base64,${base64}`;
  }

  console.log("=".repeat(60));
  console.log("  HeadshotAI - Replicate 모델 테스트");
  console.log("=".repeat(60));
  console.log(`\n모델: flux-kontext-apps/professional-headshot`);
  console.log(`이미지: ${TEST_IMAGE_PATH}\n`);

  // 출력 디렉토리
  const outDir = path.resolve("scripts/test-output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results: { style: string; time: number; url: string }[] = [];

  for (const [styleName, prompt] of Object.entries(STYLES)) {
    console.log(`\n▶ ${styleName} 스타일 생성 중...`);
    const start = Date.now();

    try {
      const output = await replicate.run(
        "flux-kontext-apps/professional-headshot",
        {
          input: {
            input_image: imageInput,
            prompt,
          },
        }
      );

      const elapsed = (Date.now() - start) / 1000;
      const url = Array.isArray(output) ? String(output[0]) : String(output);

      console.log(`  ✅ 완료 (${elapsed.toFixed(1)}초)`);
      console.log(`  URL: ${url}`);

      // 다운로드
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outPath = path.join(outDir, `${styleName}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  저장: ${outPath}`);

      results.push({ style: styleName, time: elapsed, url });
    } catch (error) {
      console.error(`  ❌ 실패:`, error);
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("  결과 요약");
  console.log("=".repeat(60));

  if (results.length === 0) {
    console.log("\n❌ 모든 생성이 실패했습니다. API 키와 모델명을 확인하세요.");
    process.exit(1);
  }

  const avgTime = results.reduce((s, r) => s + r.time, 0) / results.length;
  console.log(`\n  생성 성공: ${results.length}/3`);
  console.log(`  평균 시간: ${avgTime.toFixed(1)}초`);
  console.log(`  결과 파일: ${outDir}/`);

  console.log("\n  ┌─────────────────────────────────────────────┐");
  console.log("  │  아래 항목을 확인하세요:                    │");
  console.log("  │                                             │");
  console.log("  │  1. scripts/test-output/ 폴더의 이미지 확인 │");
  console.log("  │  2. 품질: $29 받을 만한가?                  │");
  console.log("  │  3. Replicate 대시보드에서 비용 확인        │");
  console.log("  │     → replicate.com/account/billing         │");
  console.log("  │  4. 10장 세트 비용 = 단가 x 10              │");
  console.log("  │                                             │");
  console.log("  │  Go 조건:                                   │");
  console.log("  │   - 품질 OK + 10장 $8 이하 + 10분 이내     │");
  console.log("  │  조건부 Go:                                 │");
  console.log("  │   - 10장 $8~$10 → 가격 $35로 인상          │");
  console.log("  │  No-Go:                                     │");
  console.log("  │   - 품질 미달 또는 10장 $12+                │");
  console.log("  └─────────────────────────────────────────────┘");

  // Replicate billing 안내
  console.log("\n💰 비용 확인 방법:");
  console.log("   1. https://replicate.com/account/billing 접속");
  console.log("   2. 'Usage' 탭에서 이번 테스트 비용 확인");
  console.log("   3. 3회 생성 비용 / 3 = 1회 단가");
  console.log("   4. 1회 단가 x 10 = 유료 세트 비용");
  console.log("   5. 1회 단가 x 1 (저해상도) ≈ 무료 샘플 비용\n");
}

main().catch(console.error);
