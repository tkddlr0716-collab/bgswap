/**
 * 실제 Replicate + R2 + Sharp 파이프라인 비용/시간 측정
 * 소수 이미지(3장)로 실측 후 100장 추정
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const BASE_URL = "http://localhost:3000";
const IMAGE_DIR = path.join(__dirname, "images");
const TEST_EMAIL = "costtest@bgswap-test.com";
const TEST_COUNT = 3;

const ORIGIN_HEADERS: Record<string, string> = {
  Origin: BASE_URL,
  Referer: `${BASE_URL}/upload`,
};

async function fetchJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(ORIGIN_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  const res = await fetch(url, { ...init, headers });
  return { status: res.status, data: (await res.json()) as Record<string, unknown> };
}

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║  BgSwap 비용/시간 실측 테스트         ║");
  console.log("╚═══════════════════════════════════════╝\n");

  // 서버 확인
  try {
    await fetch(`${BASE_URL}/api/status/test`);
  } catch {
    console.error("❌ 서버 연결 실패. npm run dev 먼저 실행하세요.");
    process.exit(1);
  }

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // 1. 주문 생성 + 이미지 업로드
  console.log(`── 1. ${TEST_COUNT}장 업로드 ──\n`);
  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.startsWith("product_")).slice(0, TEST_COUNT);

  // 첫 장: 주문 생성
  const firstBuf = fs.readFileSync(path.join(IMAGE_DIR, files[0]));
  const firstExt = path.extname(files[0]).slice(1);
  const form1 = new FormData();
  form1.append("email", TEST_EMAIL);
  form1.append("files", new Blob([firstBuf], { type: firstExt === "png" ? "image/png" : "image/jpeg" }), files[0]);
  const { data: uploadData } = await fetchJson(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form1,
    headers: { "X-Forwarded-For": "10.88.0.1" },
  });
  const orderId = uploadData.orderId as string;
  console.log(`  주문: ${orderId}`);

  // 결제 시뮬레이션
  await db.execute({
    sql: `UPDATE orders SET status = 'paid', plan = 'pro', paid_at = datetime('now'),
          download_token = 'test-cost' WHERE id = ?`,
    args: [orderId],
  });

  // 나머지 장 업로드
  for (let i = 1; i < files.length; i++) {
    const buf = fs.readFileSync(path.join(IMAGE_DIR, files[i]));
    const ext = path.extname(files[i]).slice(1);
    const form = new FormData();
    form.append("orderId", orderId);
    form.append("files", new Blob([buf], { type: ext === "png" ? "image/png" : "image/jpeg" }), files[i]);
    await fetchJson(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: form,
      headers: { "X-Forwarded-For": `10.88.0.${i + 1}` },
    });
  }
  console.log(`  ${files.length}장 업로드 완료\n`);

  // 2. 이미지 목록 조회
  const images = await db.execute({
    sql: "SELECT id FROM images WHERE order_id = ? AND type = 'upload' ORDER BY uploaded_at",
    args: [orderId],
  });
  const imageIds = images.rows.map(r => r.id as string);

  // Replicate 사전 prediction 수 확인
  const replicateToken = process.env.REPLICATE_API_TOKEN!;
  const beforePreds = await fetch("https://api.replicate.com/v1/predictions?limit=1", {
    headers: { Authorization: `Bearer ${replicateToken}` },
  }).then(r => r.json()) as { results: { id: string }[] };

  // 3. generate-one 실행 + 시간 측정
  console.log(`── 2. ${TEST_COUNT}장 처리 (generate-one) ──\n`);

  const timings: { imageId: string; durationMs: number; success: boolean; error?: string }[] = [];

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i];
    console.log(`  [${i + 1}/${imageIds.length}] 처리 중...`);

    const start = Date.now();
    const { status, data } = await fetchJson(`${BASE_URL}/api/generate-one`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, imageId }),
    });
    const duration = Date.now() - start;

    const success = status === 200;
    timings.push({
      imageId,
      durationMs: duration,
      success,
      error: success ? undefined : JSON.stringify(data),
    });

    console.log(`  [${i + 1}/${imageIds.length}] ${success ? "✅" : "❌"} ${(duration / 1000).toFixed(1)}s${success ? "" : " — " + JSON.stringify(data)}`);
  }

  // 4. Replicate predictions 조회 (새로 생긴 것)
  console.log(`\n── 3. Replicate 비용 분석 ──\n`);

  // 약간 대기 (prediction 반영)
  await new Promise(r => setTimeout(r, 2000));

  const afterPreds = await fetch("https://api.replicate.com/v1/predictions?limit=10", {
    headers: { Authorization: `Bearer ${replicateToken}` },
  }).then(r => r.json()) as { results: { id: string; model: string; status: string; metrics: { predict_time: number; total_time: number } }[] };

  const newPreds = afterPreds.results.filter(
    p => p.model === "bria/remove-background" && p.status === "succeeded" &&
    !beforePreds.results.some(bp => bp.id === p.id)
  );

  console.log(`  새 prediction 수: ${newPreds.length}`);

  if (newPreds.length > 0) {
    const predictTimes = newPreds.map(p => p.metrics.predict_time);
    const totalTimes = newPreds.map(p => p.metrics.total_time);
    const avgPredict = predictTimes.reduce((a, b) => a + b, 0) / predictTimes.length;
    const avgTotal = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;

    // Replicate 가격 추정 (T4 ~ L40S 범위)
    const costT4 = avgPredict * 0.000225;
    const costL40S = avgPredict * 0.000975;

    console.log(`  predict_time — 평균: ${avgPredict.toFixed(2)}s, 범위: ${Math.min(...predictTimes).toFixed(2)}~${Math.max(...predictTimes).toFixed(2)}s`);
    console.log(`  total_time   — 평균: ${avgTotal.toFixed(2)}s`);
    console.log(`  추정 비용/장 — T4: $${costT4.toFixed(5)} | L40S: $${costL40S.toFixed(5)}`);

    console.log(`\n── 4. 100장 추정 ──\n`);

    const avgProcessMs = timings.filter(t => t.success).reduce((s, t) => s + t.durationMs, 0) / timings.filter(t => t.success).length;
    const successRate = timings.filter(t => t.success).length / timings.length;

    console.log(`  처리 시간/장 — 평균: ${(avgProcessMs / 1000).toFixed(1)}s (Replicate + Sharp 합성 + R2 업로드 전부 포함)`);
    console.log(`  성공률: ${(successRate * 100).toFixed(0)}%`);
    console.log(`  `);
    console.log(`  ┌──────────────────────┬────────────────┬──────────────────┐`);
    console.log(`  │                      │   Starter(10)  │    Pro(100)      │`);
    console.log(`  ├──────────────────────┼────────────────┼──────────────────┤`);
    console.log(`  │ Replicate 비용 (T4)  │ $${(costT4 * 10).toFixed(4).padStart(11)} │ $${(costT4 * 100).toFixed(4).padStart(15)} │`);
    console.log(`  │ Replicate 비용 (L40S)│ $${(costL40S * 10).toFixed(4).padStart(11)} │ $${(costL40S * 100).toFixed(4).padStart(15)} │`);
    console.log(`  │ 소요 시간 (순차)     │ ${((avgProcessMs * 10) / 1000 / 60).toFixed(1).padStart(10)}분 │ ${((avgProcessMs * 100) / 1000 / 60).toFixed(1).padStart(14)}분 │`);
    console.log(`  │ 소요 시간 (3병렬)    │ ${((avgProcessMs * 10) / 1000 / 60 / 3).toFixed(1).padStart(10)}분 │ ${((avgProcessMs * 100) / 1000 / 60 / 3).toFixed(1).padStart(14)}분 │`);
    console.log(`  │ 매출                 │ $${(4.99).toFixed(2).padStart(12)} │ $${(29.0).toFixed(2).padStart(16)} │`);
    console.log(`  │ 마진 (T4)            │ ${((1 - costT4 * 10 / 4.99) * 100).toFixed(1).padStart(11)}% │ ${((1 - costT4 * 100 / 29) * 100).toFixed(1).padStart(15)}% │`);
    console.log(`  │ 마진 (L40S)          │ ${((1 - costL40S * 10 / 4.99) * 100).toFixed(1).padStart(11)}% │ ${((1 - costL40S * 100 / 29) * 100).toFixed(1).padStart(15)}% │`);
    console.log(`  └──────────────────────┴────────────────┴──────────────────┘`);
  }

  // 5. DB에서 생성된 이미지 수 확인
  console.log(`\n── 5. 생성 결과 확인 ──\n`);

  const genCount = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = ? AND type = 'generated'",
    args: [orderId],
  });
  const removedCount = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = ? AND type = 'removed'",
    args: [orderId],
  });
  const orderStatus = await db.execute({
    sql: "SELECT status FROM orders WHERE id = ?",
    args: [orderId],
  });

  console.log(`  generated: ${genCount.rows[0].cnt}장 (기대: ${TEST_COUNT * 15}장)`);
  console.log(`  removed: ${removedCount.rows[0].cnt}장 (기대: ${TEST_COUNT}장)`);
  console.log(`  order status: ${orderStatus.rows[0].status}`);

  // 6. 정리
  console.log(`\n── 6. 정리 ──\n`);

  try {
    const { deleteFromR2 } = await import("../../src/lib/r2");
    const allImages = await db.execute({
      sql: "SELECT r2_key FROM images WHERE order_id = ?",
      args: [orderId],
    });
    let deleted = 0;
    for (const row of allImages.rows) {
      try {
        await deleteFromR2(row.r2_key as string);
        deleted++;
      } catch { /* ignore */ }
    }
    console.log(`  R2 삭제: ${deleted}/${allImages.rows.length}개`);
  } catch {
    console.log("  R2 삭제 스킵");
  }

  await db.execute({ sql: "DELETE FROM images WHERE order_id = ?", args: [orderId] });
  await db.execute({ sql: "DELETE FROM orders WHERE id = ?", args: [orderId] });
  console.log("  DB 정리 완료");
}

main().catch(err => {
  console.error("\n❌ 오류:", err);
  process.exit(1);
});
