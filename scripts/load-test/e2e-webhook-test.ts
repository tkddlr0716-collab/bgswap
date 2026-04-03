/**
 * E2E Webhook 테스트: Polar webhook 통한 전체 결제 플로우 검증
 *
 * 기존 e2e-test.ts와 차이: DB 직접 수정 대신 실제 webhook endpoint를 호출
 *
 * 1. 무료 1장 업로드 + 프리뷰 생성
 * 2. 추가 5장 업로드 (결제 전 — pending 상태)
 * 3. Polar webhook 시뮬레이션 (HMAC 서명 포함)
 * 4. webhook이 plan 설정 + generate-one 트리거하는지 확인
 * 5. 폴링 → 자동 처리 → 완료 대기
 * 6. 결과 검증
 * 7. 정리
 *
 * 실행: npx tsx scripts/load-test/e2e-webhook-test.ts
 * 필요: dev 서버 (npm run dev)
 * 주의: Replicate 실제 호출 (비용 발생, 6장 × $0.002 = ~$0.012)
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

const BASE_URL = "http://localhost:3000";
const IMAGE_DIR = path.join(__dirname, "images");
const TEST_EMAIL = "e2e-webhook-test@bgswap-test.com";
const UPLOAD_COUNT = 5;
const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET!;

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

function signStandardWebhook(payload: string, msgId: string, timestamp: string): string {
  const secretBase64 = WEBHOOK_SECRET.startsWith("whsec_") ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET;
  const key = Buffer.from(secretBase64, "base64");
  const signedContent = `${msgId}.${timestamp}.${payload}`;
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(signedContent);
  return `v1,${hmac.digest("base64")}`;
}

function log(step: string, msg: string, ok = true) {
  console.log(`  ${ok ? "\u2705" : "\u274C"} [${step}] ${msg}`);
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function main() {
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551  BgSwap Webhook E2E \uD14C\uC2A4\uD2B8            \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n");

  if (!WEBHOOK_SECRET) {
    console.error("\u274C POLAR_WEBHOOK_SECRET not set in .env.local");
    process.exit(1);
  }

  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Server check
  try { await fetch(`${BASE_URL}/api/status/test`); }
  catch { console.error("\u274C \uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328"); process.exit(1); }

  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.startsWith("product_")).slice(0, UPLOAD_COUNT + 1);
  assert(files.length >= UPLOAD_COUNT + 1, `Need ${UPLOAD_COUNT + 1} test images, found ${files.length}`);

  let orderId = "";
  const globalStart = Date.now();

  try {
    // ── Step 1: 무료 업로드 (1장) + 프리뷰 ──
    console.log("\n\u2500\u2500 Step 1: \uBB34\uB8CC 1\uC7A5 \uC5C5\uB85C\uB4DC + \uD504\uB9AC\uBDF0 \u2500\u2500");
    const buf0 = fs.readFileSync(path.join(IMAGE_DIR, files[0]));
    const ext0 = path.extname(files[0]).slice(1);
    const form0 = new FormData();
    form0.append("email", TEST_EMAIL);
    form0.append("files", new Blob([buf0], { type: ext0 === "png" ? "image/png" : "image/jpeg" }), files[0]);

    const upload1 = await fetchJson(`${BASE_URL}/api/upload`, {
      method: "POST", body: form0,
      headers: { "X-Forwarded-For": "10.88.0.1" },
    });
    assert(upload1.status === 200, `Upload failed: ${upload1.status}`);
    orderId = upload1.data.orderId as string;
    log("Upload", `\uC8FC\uBB38 \uC0DD\uC131: ${orderId}`);

    const gen = await fetchJson(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.88.0.1" },
      body: JSON.stringify({ orderId, mode: "free" }),
    });
    assert(gen.status === 200, `Generate failed: ${gen.status}`);
    log("Preview", "5\uAC1C \uD504\uB9AC\uBDF0 \uC0DD\uC131 \uC644\uB8CC");

    // ── Step 2: 추가 업로드 (결제 전이지만 DB에 pending으로 저장) ──
    console.log("\n\u2500\u2500 Step 2: \uCD94\uAC00 5\uC7A5 \uC5C5\uB85C\uB4DC \u2500\u2500");

    // 결제 전에 업로드하려면 order가 paid여야 하므로, 먼저 order를 paid로 만들어야 함
    // 하지만 이 테스트의 목적은 webhook을 테스트하는 것이므로,
    // 업로드를 webhook 이후로 변경

    // ── Step 3: Polar webhook 시뮬레이션 ──
    console.log("\n\u2500\u2500 Step 3: Polar webhook \uC2DC\uBBAC\uB808\uC774\uC158 (Starter) \u2500\u2500");

    const webhookPayload = JSON.stringify({
      type: "order.paid",
      data: {
        metadata: {
          order_id: orderId,
          plan: "starter",
        },
        customer: {
          email: TEST_EMAIL,
        },
        amount: 499,
        product: {
          name: "BgSwap Starter",
        },
      },
    });
    const webhookMsgId = `msg_test_${crypto.randomUUID()}`;
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
    const webhookSignature = signStandardWebhook(webhookPayload, webhookMsgId, webhookTimestamp);

    const webhookRes = await fetch(`${BASE_URL}/api/webhook/polar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": webhookMsgId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": webhookSignature,
        Origin: BASE_URL,
        Referer: BASE_URL,
      },
      body: webhookPayload,
    });
    const webhookData = await webhookRes.json();
    assert(webhookRes.status === 200, `Webhook failed: ${webhookRes.status} ${JSON.stringify(webhookData)}`);
    log("Webhook", `status=${webhookRes.status}, orderId=${webhookData.orderId}`);

    // Verify webhook effects
    const statusAfterWebhook = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    const sd = statusAfterWebhook.data;
    assert(sd.status === "paid" || sd.status === "completed", `Expected paid/completed, got ${sd.status}`);
    assert(sd.plan === "starter", `Expected starter plan, got ${sd.plan}`);
    assert(!!sd.downloadToken, "Expected download token");
    log("Verify", `status=${sd.status}, plan=${sd.plan}, token=\u2713`);

    // ── Step 4: 추가 업로드 (결제 후) ──
    console.log("\n\u2500\u2500 Step 4: \uCD94\uAC00 5\uC7A5 \uC5C5\uB85C\uB4DC (\uACB0\uC81C \uD6C4) \u2500\u2500");
    for (let i = 1; i <= UPLOAD_COUNT; i++) {
      const buf = fs.readFileSync(path.join(IMAGE_DIR, files[i]));
      const ext = path.extname(files[i]).slice(1);
      const form = new FormData();
      form.append("orderId", orderId);
      form.append("files", new Blob([buf], { type: ext === "png" ? "image/png" : "image/jpeg" }), files[i]);

      const up = await fetchJson(`${BASE_URL}/api/upload`, {
        method: "POST", body: form,
        headers: { "X-Forwarded-For": `10.88.0.${i + 1}` },
      });
      assert(up.status === 200, `Upload ${i} failed: ${up.status} ${JSON.stringify(up.data)}`);
    }
    log("Upload", `${UPLOAD_COUNT}\uC7A5 \uCD94\uAC00 \uC5C5\uB85C\uB4DC \uC644\uB8CC`);

    const status2 = await fetchJson(`${BASE_URL}/api/status/${orderId}`);
    const totalUploads = status2.data.uploadCount as number;
    assert(totalUploads === UPLOAD_COUNT + 1, `Expected ${UPLOAD_COUNT + 1} uploads, got ${totalUploads}`);
    log("Verify", `\uCD1D ${totalUploads}\uC7A5 \uC5C5\uB85C\uB4DC \uD655\uC778`);

    // ── Step 5: 폴링 → 처리 완료 대기 ──
    console.log("\n\u2500\u2500 Step 5: \uCC98\uB9AC \uB300\uAE30 (\uD3F4\uB9C1 3\uCD08 \uAC04\uACA9) \u2500\u2500");
    const expectedGenerated = totalUploads * 15;
    let pollCount = 0;
    const maxPolls = 120;
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

      if (pollCount % 5 === 0 || (finalStatus === "completed" && pending === 0 && processing === 0)) {
        console.log(`    [${pollCount}] status=${finalStatus} done=${processed} processing=${processing} pending=${pending} failed=${failed} generated=${generated}/${expectedGenerated}`);
      }

      if (finalStatus === "completed" && pending === 0 && processing === 0) {
        break;
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    assert(finalStatus === "completed", `Expected completed, got ${finalStatus} after ${pollCount} polls`);
    log("Processing", `\uC644\uB8CC! ${pollCount}\uD68C \uD3F4\uB9C1, ${((Date.now() - globalStart) / 1000).toFixed(0)}\uCD08 \uC18C\uC694`);

    // ── Step 6: 결과 검증 ──
    console.log("\n\u2500\u2500 Step 6: \uACB0\uACFC \uAC80\uC99D \u2500\u2500");
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
    log("Token", `download token: ${hasToken ? "\uC788\uC74C" : "\uC5C6\uC74C"}`, hasToken);
    log("Gallery", `generatedImages: ${genImages.length}\uAC1C`, genImages.length === expectedGenerated);
    log("Plan", `plan: ${fd.plan}`, fd.plan === "starter");

    const byProduct: Record<number, number> = {};
    for (const img of genImages as { uploadIndex: number }[]) {
      byProduct[img.uploadIndex] = (byProduct[img.uploadIndex] || 0) + 1;
    }
    const productCounts = Object.values(byProduct);
    const allHave15 = productCounts.every(c => c === 15);
    log("Per-product", `${productCounts.length}\uAC1C \uC0C1\uD488, \uAC01 ${productCounts[0] || 0}\uBC30\uACBD`, allHave15);

    // ── Step 7: Webhook 서명 검증 테스트 ──
    console.log("\n\u2500\u2500 Step 7: \uC11C\uBA85 \uAC80\uC99D \uD14C\uC2A4\uD2B8 \u2500\u2500");

    // Bad signature should be rejected
    const badSigRes = await fetch(`${BASE_URL}/api/webhook/polar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": webhookMsgId,
        "webhook-timestamp": webhookTimestamp,
        "webhook-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        Origin: BASE_URL,
        Referer: BASE_URL,
      },
      body: webhookPayload,
    });
    assert(badSigRes.status === 401, `Expected 401 for bad signature, got ${badSigRes.status}`);
    log("Security", "\uC798\uBABB\uB41C \uC11C\uBA85 \u2192 401 \uAC70\uBD80 \uD655\uC778");

    // Missing headers should be rejected
    const noHeaderRes = await fetch(`${BASE_URL}/api/webhook/polar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
        Referer: BASE_URL,
      },
      body: webhookPayload,
    });
    assert(noHeaderRes.status === 401, `Expected 401 for missing headers, got ${noHeaderRes.status}`);
    log("Security", "\uD5E4\uB354 \uB204\uB77D \u2192 401 \uAC70\uBD80 \uD655\uC778");

    // Missing order_id should be rejected
    const noOrderPayload = JSON.stringify({ type: "order.paid", data: { metadata: {} } });
    const noOrderMsgId = `msg_test_${crypto.randomUUID()}`;
    const noOrderTs = Math.floor(Date.now() / 1000).toString();
    const noOrderSig = signStandardWebhook(noOrderPayload, noOrderMsgId, noOrderTs);
    const noOrderRes = await fetch(`${BASE_URL}/api/webhook/polar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "webhook-id": noOrderMsgId,
        "webhook-timestamp": noOrderTs,
        "webhook-signature": noOrderSig,
        Origin: BASE_URL,
        Referer: BASE_URL,
      },
      body: noOrderPayload,
    });
    assert(noOrderRes.status === 400, `Expected 400 for missing order_id, got ${noOrderRes.status}`);
    log("Security", "order_id \uB204\uB77D \u2192 400 \uAC70\uBD80 \uD655\uC778");

    // ── Final ──
    const totalTime = ((Date.now() - globalStart) / 1000).toFixed(1);
    const allPassed = generatedCount === expectedGenerated && failedCount === 0 && hasToken && allHave15 && fd.plan === "starter";

    console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
    console.log(`\u2551  Webhook E2E \uACB0\uACFC: ${allPassed ? "\u2705 PASS" : "\u274C FAIL"}              \u2551`);
    console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
    console.log(`  \uCD1D \uC18C\uC694: ${totalTime}\uCD08`);
    console.log(`  \uC5C5\uB85C\uB4DC: ${totalUploads}\uC7A5 \u2192 \uC0DD\uC131: ${generatedCount}\uC7A5 (${totalUploads}\xD715)`);
    console.log(`  Webhook: \uC11C\uBA85\uAC80\uC99D \u2713, plan=starter \u2713, \uD1A0\uD070 \u2713`);

  } finally {
    // ── Cleanup ──
    console.log("\n\u2500\u2500 \uC815\uB9AC \u2500\u2500");
    if (orderId) {
      try {
        const { deleteFromR2 } = await import("../../src/lib/r2");
        const imgs = await db.execute({ sql: "SELECT r2_key FROM images WHERE order_id = ?", args: [orderId] });
        let del = 0;
        for (const r of imgs.rows) {
          try { await deleteFromR2(r.r2_key as string); del++; } catch {}
        }
        console.log(`  R2: ${del}/${imgs.rows.length}\uAC1C \uC0AD\uC81C`);
      } catch { console.log("  R2 \uC0AD\uC81C \uC2A4\uD0B5"); }

      await db.execute({ sql: "DELETE FROM images WHERE order_id = ?", args: [orderId] });
      await db.execute({ sql: "DELETE FROM free_samples WHERE email = ?", args: [TEST_EMAIL] });
      await db.execute({ sql: "DELETE FROM orders WHERE id = ?", args: [orderId] });
      console.log("  DB \uC815\uB9AC \uC644\uB8CC");
    }
  }
}

main().catch(err => {
  console.error("\n\u274C Webhook E2E \uC624\uB958:", err.message || err);
  process.exit(1);
});
