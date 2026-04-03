/**
 * E2E 테스트: 전체 사용자 플로우 검증
 *
 * 1. 무료 1장 업로드 → 프리뷰 생성
 * 2. 결제 시뮬레이션 (DB 직접 + webhook과 동일 로직)
 * 3. 결제 후 5장 추가 업로드 (Starter 시뮬레이션)
 * 4. 폴링 → 자동 처리 → 완료 대기
 * 5. 결과 검증 (이미지 수, 상태, 다운로드 토큰)
 * 6. 정리
 *
 * 실행: npx tsx scripts/load-test/e2e-test.ts
 * 필요: dev 서버 (npm run dev)
 * 주의: Replicate 실제 호출 (비용 발생, 5장 × $0.002 = ~$0.01)
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

// Override BASE_URL for local testing — status API uses this to trigger generate-one
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

const BASE_URL = "http://localhost:3000";
const IMAGE_DIR = path.join(__dirname, "images");
const TEST_EMAIL = "e2e-test@bgswap-test.com";
const UPLOAD_COUNT = 5; // Starter-size test

const ORIGIN = { Origin: BASE_URL, Referer: `${BASE_URL}/upload` };

async function fetchJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(ORIGIN)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json()) as Record<string, unknown>;
  return { status: res.status, data };
}

function log(step: string, msg: string, ok = true) {
  console.log(`  ${ok ? "✅" : "❌"} [${step}] ${msg}`);
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  BgSwap E2E 테스트                    ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Server check
  try { await fetch(`${BASE_URL}/api/status/test`); }
  catch { console.error("❌ 서버 연결 실패"); process.exit(1); }

  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.startsWith("product_")).slice(0, UPLOAD_COUNT + 1);
  let orderId = "";
  const globalStart = Date.now();

  try {
    // ── Step 1: 무료 업로드 (1장) ──
    console.log("\n── Step 1: 무료 1장 업로드 ──");
    const buf0 = fs.readFileSync(path.join(IMAGE_DIR, files[0]));
    const ext0 = path.extname(files[0]).slice(1);
    const form0 = new FormData();
    form0.append("email", TEST_EMAIL);
    form0.append("files", new Blob([buf0], { type: ext0 === "png" ? "image/png" : "image/jpeg" }), files[0]);

    const upload1 = await fetchJson(`${BASE_URL}/api/upload`, {
      method: "POST", body: form0,
      headers: { "X-Forwarded-For": "10.77.0.1" },
    });
    assert(upload1.status === 200, `Upload failed: ${upload1.status}`);
    orderId = upload1.data.orderId as string;
    log("Upload", `주문 생성: ${orderId}`);

    // ── Step 2: 무료 프리뷰 생성 ──
    console.log("\n── Step 2: 무료 프리뷰 생성 ──");
    const gen = await fetchJson(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.77.0.1" },
      body: JSON.stringify({ orderId, mode: "free" }),
    });
    assert(gen.status === 200, `Generate failed: ${gen.status} ${JSON.stringify(gen.data)}`);
    const previews = gen.data.previews as { name: string; url: string }[];
    assert(previews.length === 5, `Expected 5 previews, got ${previews.length}`);
    log("Preview", `5개 프리뷰 생성 완료`);

    // Status check
    const status1 = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    assert(status1.data.status === "sample_generated", `Expected sample_generated, got ${status1.data.status}`);
    log("Status", `order status: ${status1.data.status}`);

    // ── Step 3: 결제 시뮬레이션 ──
    console.log("\n── Step 3: 결제 시뮬레이션 (Starter) ──");
    const downloadToken = crypto.randomUUID();
    await db.execute({
      sql: `UPDATE orders SET status = 'paid', plan = 'starter', download_token = ?, paid_at = datetime('now') WHERE id = ?`,
      args: [downloadToken, orderId],
    });
    log("Payment", `plan=starter, token=${downloadToken.slice(0, 8)}...`);

    // ── Step 4: 추가 업로드 (5장, Starter limit=10) ──
    console.log("\n── Step 4: 추가 5장 업로드 ──");
    for (let i = 1; i <= UPLOAD_COUNT; i++) {
      const buf = fs.readFileSync(path.join(IMAGE_DIR, files[i]));
      const ext = path.extname(files[i]).slice(1);
      const form = new FormData();
      form.append("orderId", orderId);
      form.append("files", new Blob([buf], { type: ext === "png" ? "image/png" : "image/jpeg" }), files[i]);

      const up = await fetchJson(`${BASE_URL}/api/upload`, {
        method: "POST", body: form,
        headers: { "X-Forwarded-For": `10.77.0.${i + 1}` },
      });
      assert(up.status === 200, `Upload ${i} failed: ${up.status} ${JSON.stringify(up.data)}`);
    }
    log("Upload", `${UPLOAD_COUNT}장 추가 업로드 완료`);

    // Verify upload count
    const status2 = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    const totalUploads = status2.data.uploadCount as number;
    assert(totalUploads === UPLOAD_COUNT + 1, `Expected ${UPLOAD_COUNT + 1} uploads, got ${totalUploads}`);
    log("Verify", `총 ${totalUploads}장 업로드 확인`);

    // ── Step 5: 폴링 → 처리 완료 대기 ──
    console.log("\n── Step 5: 처리 대기 (폴링 3초 간격) ──");
    const expectedGenerated = totalUploads * 15;
    let pollCount = 0;
    const maxPolls = 120; // 6분 제한 (120 × 3초)
    let finalStatus = "";

    while (pollCount < maxPolls) {
      pollCount++;
      const s = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
      const d = s.data;
      const processed = (d.processedCount as number) || 0;
      const pending = (d.pendingCount as number) || 0;
      const processing = (d.processingCount as number) || 0;
      const failed = (d.failedCount as number) || 0;
      const generated = (d.generatedCount as number) || 0;
      finalStatus = d.status as string;

      if (pollCount % 5 === 0 || finalStatus === "completed") {
        console.log(`    [${pollCount}] status=${finalStatus} done=${processed} processing=${processing} pending=${pending} failed=${failed} generated=${generated}/${expectedGenerated}`);
      }

      if (finalStatus === "completed" && pending === 0 && processing === 0) {
        break;
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    assert(finalStatus === "completed", `Expected completed, got ${finalStatus} after ${pollCount} polls`);
    log("Processing", `완료! ${pollCount}회 폴링, ${((Date.now() - globalStart) / 1000).toFixed(0)}초 소요`);

    // ── Step 6: 결과 검증 ──
    console.log("\n── Step 6: 결과 검증 ──");
    const final = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    const fd = final.data;

    const generatedCount = fd.generatedCount as number;
    const processedCount = (fd.processedCount as number) || 0;
    const failedCount = (fd.failedCount as number) || 0;
    const hasToken = !!fd.downloadToken;
    const genImages = (fd.generatedImages as unknown[]) || [];

    log("Images", `generated: ${generatedCount}/${expectedGenerated}`, generatedCount === expectedGenerated);
    log("Processed", `done: ${processedCount}/${totalUploads}`, processedCount === totalUploads);
    log("Failed", `failed: ${failedCount}`, failedCount === 0);
    log("Token", `download token: ${hasToken ? "있음" : "없음"}`, hasToken);
    log("Gallery", `generatedImages: ${genImages.length}개`, genImages.length === expectedGenerated);

    // Verify each product has 15 backgrounds
    const byProduct: Record<number, number> = {};
    for (const img of genImages as { uploadIndex: number }[]) {
      byProduct[img.uploadIndex] = (byProduct[img.uploadIndex] || 0) + 1;
    }
    const productCounts = Object.values(byProduct);
    const allHave15 = productCounts.every(c => c === 15);
    log("Per-product", `${productCounts.length}개 상품, 각 ${productCounts[0] || 0}배경`, allHave15);

    // ── Final ──
    const totalTime = ((Date.now() - globalStart) / 1000).toFixed(1);
    const allPassed = generatedCount === expectedGenerated && failedCount === 0 && hasToken && allHave15;

    console.log("\n╔═══════════════════════════════════════╗");
    console.log(`║  E2E 결과: ${allPassed ? "✅ PASS" : "❌ FAIL"}                      ║`);
    console.log("╚═══════════════════════════════════════╝");
    console.log(`  총 소요: ${totalTime}초`);
    console.log(`  업로드: ${totalUploads}장 → 생성: ${generatedCount}장 (${totalUploads}×15)`);
    console.log(`  처리 시간: ${((Date.now() - globalStart) / 1000 / totalUploads).toFixed(1)}초/장 (전체 E2E 포함)`);

  } finally {
    // ── Cleanup ──
    console.log("\n── 정리 ──");
    if (orderId) {
      try {
        const { deleteFromR2 } = await import("../../src/lib/r2");
        const imgs = await db.execute({ sql: "SELECT r2_key FROM images WHERE order_id = ?", args: [orderId] });
        let del = 0;
        for (const r of imgs.rows) {
          try { await deleteFromR2(r.r2_key as string); del++; } catch {}
        }
        console.log(`  R2: ${del}/${imgs.rows.length}개 삭제`);
      } catch { console.log("  R2 삭제 스킵"); }

      await db.execute({ sql: "DELETE FROM images WHERE order_id = ?", args: [orderId] });
      await db.execute({ sql: "DELETE FROM free_samples WHERE email = ?", args: [TEST_EMAIL] });
      await db.execute({ sql: "DELETE FROM orders WHERE id = ?", args: [orderId] });
      console.log("  DB 정리 완료");
    }
  }
}

main().catch(err => {
  console.error("\n❌ E2E 오류:", err.message || err);
  process.exit(1);
});
