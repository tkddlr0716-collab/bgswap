/**
 * BgSwap Phase D 부하 테스트
 *
 * 테스트 항목:
 * 1. 100장 순차 업로드 성능 (실제 API 호출)
 * 2. Status API 폴링 성능
 * 3. DB 상태 전이 정합성 검증
 * 4. 메모리 사용량 추적
 *
 * 실행: npx tsx scripts/load-test/run.ts
 * 필요: dev 서버 실행 중 (npm run dev)
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load .env.local for DB access
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const IMAGE_DIR = path.join(__dirname, "images");
const TEST_EMAIL = "loadtest@bgswap-test.com";

interface UploadResult {
  index: number;
  file: string;
  sizeKB: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

interface StatusResult {
  durationMs: number;
  status: string;
  uploadCount: number;
  processedCount: number;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
}

// ─── Helpers ───

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function memoryMB(): number {
  return Math.round(process.memoryUsage.rss() / 1024 / 1024);
}

// Origin/Referer headers required by CSRF protection middleware
const ORIGIN_HEADERS: Record<string, string> = {
  "Origin": BASE_URL,
  "Referer": `${BASE_URL}/upload`,
};

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(ORIGIN_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  const res = await fetch(url, { ...init, headers });
  const data = await res.json() as Record<string, unknown>;
  return { status: res.status, data };
}

// ─── Phase 1: 무료 업로드로 주문 생성 ───

async function createOrder(): Promise<string> {
  console.log("\n── Phase 1: 주문 생성 (1장 무료 업로드) ──\n");

  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.startsWith("product_"));
  const firstFile = files[0];
  const filePath = path.join(IMAGE_DIR, firstFile);
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(firstFile).slice(1);
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  const form = new FormData();
  form.append("email", TEST_EMAIL);
  form.append("files", new Blob([buffer], { type: mimeType }), firstFile);

  const start = Date.now();
  const { status, data } = await fetchJson(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
    headers: { "X-Forwarded-For": "10.99.99.1" },
  });

  const duration = Date.now() - start;
  const orderId = data.orderId as string;

  if (status !== 200 || !orderId) {
    throw new Error(`주문 생성 실패: ${status} ${JSON.stringify(data)}`);
  }

  console.log(`  주문 생성 OK: ${orderId}`);
  console.log(`  소요: ${formatMs(duration)}`);
  return orderId;
}

// ─── Phase 2: 결제 시뮬레이션 (DB 직접 수정) ───

async function simulatePayment(orderId: string): Promise<void> {
  console.log("\n── Phase 2: 결제 시뮬레이션 ──\n");

  // DB에 직접 paid + pro 설정 (실제로는 Polar webhook이 하는 일)
  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await db.execute({
    sql: `UPDATE orders SET status = 'paid', plan = 'pro', paid_at = datetime('now'),
          download_token = ? WHERE id = ?`,
    args: [`test-token-${Date.now()}`, orderId],
  });

  const verify = await db.execute({
    sql: "SELECT status, plan FROM orders WHERE id = ?",
    args: [orderId],
  });

  console.log(`  상태: ${verify.rows[0].status}, 플랜: ${verify.rows[0].plan}`);
}

// ─── Phase 3: 100장 순차 업로드 ───

async function uploadBulk(orderId: string): Promise<UploadResult[]> {
  console.log("\n── Phase 3: 100장 순차 업로드 ──\n");

  const files = fs.readdirSync(IMAGE_DIR)
    .filter(f => f.startsWith("product_"))
    .sort()
    .slice(0, 100);

  const results: UploadResult[] = [];
  const globalStart = Date.now();
  let consecutiveErrors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(IMAGE_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).slice(1);
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    const sizeKB = Math.round(buffer.length / 1024);

    const form = new FormData();
    form.append("orderId", orderId);
    form.append("files", new Blob([buffer], { type: mimeType }), file);

    // Rotate X-Forwarded-For to avoid rate limit (3/min per IP)
    // Each "batch" of 2 uploads gets a unique IP
    const fakeIp = `10.0.${Math.floor(i / 2) % 256}.${i % 256}`;

    const start = Date.now();
    let success = false;
    let error: string | undefined;
    let attempts = 0;
    const maxAttempts = 5;

    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        const { status, data } = await fetchJson(`${BASE_URL}/api/upload`, {
          method: "POST",
          body: form,
          headers: { "X-Forwarded-For": fakeIp },
        });

        if (status === 200) {
          success = true;
          consecutiveErrors = 0;
        } else if (status === 429) {
          // Rate limited — exponential backoff
          const wait = Math.min(2000 * Math.pow(2, attempts - 1), 30000);
          error = `rate limited (attempt ${attempts}, waiting ${wait}ms)`;
          await new Promise(r => setTimeout(r, wait));
        } else {
          error = `${status}: ${JSON.stringify(data)}`;
          break; // Non-retryable error
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        break;
      }
    }
    if (!success && !error) error = "max retries exceeded";

    const duration = Date.now() - start;
    results.push({ index: i + 1, file, sizeKB, durationMs: duration, success, error });

    if (!success) consecutiveErrors++;
    if (consecutiveErrors >= 5) {
      console.log(`  ❌ 5회 연속 실패, 중단`);
      break;
    }

    // Progress
    if ((i + 1) % 10 === 0 || !success) {
      const elapsed = Date.now() - globalStart;
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      const avgMs = Math.round(elapsed / (i + 1));
      console.log(
        `  ${String(i + 1).padStart(3)}/100 | ` +
        `OK:${successCount} FAIL:${failCount} | ` +
        `avg:${formatMs(avgMs)}/장 | ` +
        `메모리:${memoryMB()}MB` +
        (!success ? ` | ⚠ ${error}` : "")
      );
    }
  }

  const totalTime = Date.now() - globalStart;
  const successResults = results.filter(r => r.success);
  const failResults = results.filter(r => !r.success);
  const avgDuration = successResults.length
    ? Math.round(successResults.reduce((s, r) => s + r.durationMs, 0) / successResults.length)
    : 0;
  const p95 = successResults.length
    ? successResults.map(r => r.durationMs).sort((a, b) => a - b)[Math.floor(successResults.length * 0.95)]
    : 0;

  console.log(`\n  ── 업로드 결과 ──`);
  console.log(`  총 시간: ${formatMs(totalTime)}`);
  console.log(`  성공: ${successResults.length}장 / 실패: ${failResults.length}장`);
  console.log(`  평균: ${formatMs(avgDuration)}/장 | P95: ${formatMs(p95)}/장`);
  console.log(`  처리량: ${(successResults.length / (totalTime / 1000)).toFixed(1)}장/초`);

  if (failResults.length) {
    console.log(`  실패 상세:`);
    for (const f of failResults.slice(0, 5)) {
      console.log(`    #${f.index} ${f.file}: ${f.error}`);
    }
    if (failResults.length > 5) console.log(`    ... 외 ${failResults.length - 5}건`);
  }

  return results;
}

// ─── Phase 4: DB 상태 검증 ───

async function verifyDbState(orderId: string): Promise<void> {
  console.log("\n── Phase 4: DB 상태 검증 ──\n");

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // 주문 상태
  const order = await db.execute({
    sql: "SELECT status, plan FROM orders WHERE id = ?",
    args: [orderId],
  });
  console.log(`  주문: status=${order.rows[0].status}, plan=${order.rows[0].plan}`);

  // 이미지 상태 분포
  const images = await db.execute({
    sql: `SELECT process_status, COUNT(*) as cnt
          FROM images WHERE order_id = ? AND type = 'upload'
          GROUP BY process_status`,
    args: [orderId],
  });

  console.log(`  이미지 상태 분포:`);
  let totalImages = 0;
  for (const row of images.rows) {
    const status = row.process_status as string;
    const count = row.cnt as number;
    totalImages += count;
    console.log(`    ${status}: ${count}장`);
  }
  console.log(`    총: ${totalImages}장`);

  // 전부 pending인지 확인 (아직 처리 안 했으므로)
  const pendingCount = images.rows.find(r => r.process_status === "pending")?.cnt as number || 0;
  if (pendingCount === totalImages) {
    console.log(`  ✅ 전부 pending 상태 (정상 — 처리 시작 전)`);
  } else {
    console.log(`  ⚠ pending이 아닌 이미지 존재`);
  }
}

// ─── Phase 5: Status API 폴링 성능 ───

async function testPollingPerformance(orderId: string): Promise<void> {
  console.log("\n── Phase 5: Status API 폴링 성능 ──\n");

  const iterations = 50;
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const { status, data } = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    const duration = Date.now() - start;
    durations.push(duration);

    if (i === 0) {
      console.log(`  첫 응답: ${JSON.stringify({
        status: data.status,
        uploadCount: data.uploadCount,
        processedCount: data.processedCount,
        pendingCount: data.pendingCount,
      })}`);
    }
  }

  durations.sort((a, b) => a - b);
  const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
  const min = durations[0];
  const max = durations[durations.length - 1];
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  console.log(`  ${iterations}회 폴링 결과:`);
  console.log(`    평균: ${formatMs(avg)} | P50: ${formatMs(p50)} | P95: ${formatMs(p95)} | P99: ${formatMs(p99)}`);
  console.log(`    최소: ${formatMs(min)} | 최대: ${formatMs(max)}`);

  if (p95 > 500) {
    console.log(`  ⚠ P95가 500ms 초과 — 쿼리 최적화 필요`);
  } else {
    console.log(`  ✅ 폴링 성능 양호`);
  }
}

// ─── Phase 6: 동시 폴링 테스트 (race condition) ───

async function testConcurrentPolling(orderId: string): Promise<void> {
  console.log("\n── Phase 6: 동시 폴링 (경쟁 조건 테스트) ──\n");

  // 10개 동시 요청
  const concurrent = 10;
  const start = Date.now();
  const promises = Array.from({ length: concurrent }, () =>
    fetchJson(`${BASE_URL}/api/status/${orderId}`)
  );

  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  const statuses = results.map(r => r.data.status);
  const allSame = statuses.every(s => s === statuses[0]);

  console.log(`  ${concurrent}개 동시 요청 완료: ${formatMs(duration)}`);
  console.log(`  응답 일관성: ${allSame ? "✅ 전부 동일" : "⚠ 불일치 발견"}`);
  console.log(`  상태: ${statuses[0]}`);
}

// ─── Phase 7: 정리 ───

async function cleanup(orderId: string): Promise<void> {
  console.log("\n── Phase 7: 테스트 데이터 정리 ──\n");

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // R2에 업로드된 파일 삭제 (r2 모듈 사용)
  const images = await db.execute({
    sql: "SELECT r2_key FROM images WHERE order_id = ?",
    args: [orderId],
  });

  let r2Deleted = 0;
  try {
    const { deleteFromR2 } = await import("../../src/lib/r2");
    for (const row of images.rows) {
      try {
        await deleteFromR2(row.r2_key as string);
        r2Deleted++;
      } catch { /* ignore */ }
    }
  } catch {
    console.log("  R2 삭제 스킵 (모듈 로드 불가)");
  }

  // DB 삭제
  await db.execute({ sql: "DELETE FROM images WHERE order_id = ?", args: [orderId] });
  await db.execute({ sql: "DELETE FROM orders WHERE id = ?", args: [orderId] });

  console.log(`  R2 파일 삭제: ${r2Deleted}개`);
  console.log(`  DB 레코드 삭제: 주문 1건, 이미지 ${images.rows.length}건`);
  console.log(`  ✅ 정리 완료`);
}

// ─── Main ───

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   BgSwap Phase D 부하 테스트             ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n서버: ${BASE_URL}`);
  console.log(`이미지: ${IMAGE_DIR}`);
  console.log(`시작 메모리: ${memoryMB()}MB`);

  // 서버 연결 확인
  try {
    await fetch(`${BASE_URL}/api/status/nonexistent`);
  } catch {
    console.error(`\n❌ 서버 연결 실패: ${BASE_URL}`);
    console.error("   'npm run dev'로 서버를 먼저 시작하세요.");
    process.exit(1);
  }

  const globalStart = Date.now();
  let orderId: string | null = null;

  try {
    orderId = await createOrder();
    await simulatePayment(orderId);
    const uploadResults = await uploadBulk(orderId);
    await verifyDbState(orderId);
    await testPollingPerformance(orderId);
    await testConcurrentPolling(orderId);

    // ── 최종 리포트 ──
    const totalTime = Date.now() - globalStart;
    const successUploads = uploadResults.filter(r => r.success).length;
    const failUploads = uploadResults.filter(r => !r.success).length;

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   최종 결과                              ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`  총 소요: ${formatMs(totalTime)}`);
    console.log(`  업로드: ${successUploads} OK / ${failUploads} FAIL`);
    console.log(`  최종 메모리: ${memoryMB()}MB`);

    if (failUploads === 0) {
      console.log(`  ✅ 부하 테스트 통과`);
    } else if (failUploads <= 5) {
      console.log(`  ⚠ 부하 테스트 조건부 통과 (${failUploads}건 실패)`);
    } else {
      console.log(`  ❌ 부하 테스트 실패 (${failUploads}건 실패)`);
    }
  } finally {
    if (orderId) {
      await cleanup(orderId);
    }
  }
}

main().catch((err) => {
  console.error("\n❌ 부하 테스트 중 치명적 오류:", err);
  process.exit(1);
});
