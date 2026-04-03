/**
 * 배경제거 모델 A/B 비교 테스트
 *
 * 검수 포인트:
 *   1. 손이 포함된 상품 사진 → 제품만 분리되는가?
 *   2. 해상도 유지 (입력 대비 출력 해상도)
 *   3. 엣지 품질 (반투명 잔상, 잘림)
 *   4. 속도 / 비용
 *
 * 사용법:
 *   npx tsx scripts/test-rmbg-compare.ts
 *
 * 테스트 이미지:
 *   test-products/ 폴더에 상품 사진 넣기 (jpg/png/webp)
 *   - 손으로 잡은 상품 사진 필수 포함
 *   - 없으면 Unsplash 샘플 사용
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// ── 비교 대상 모델 ──
const MODELS: {
  key: string;
  label: string;
  model: `${string}/${string}` | `${string}/${string}:${string}`;
  inputFn: (url: string) => Record<string, unknown>;
}[] = [
  {
    key: "bria",
    label: "BRIA RMBG (현재)",
    model: "bria/remove-background",
    inputFn: (url) => ({ image: url }),
  },
  {
    key: "birefnet",
    label: "BiRefNet (lucataco)",
    model: "lucataco/remove-bg",
    inputFn: (url) => ({ image: url }),
  },
  {
    key: "birefnet-v2",
    label: "BiRefNet v2 (zhengpeng7)",
    model: "zhengpeng7/birefnet",
    inputFn: (url) => ({ image: url }),
  },
];

// ── 샘플 이미지 (test-products/ 없을 때 폴백) ──
const FALLBACK_SAMPLES = [
  {
    name: "shoe-hand",
    url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200",
    desc: "손으로 잡은 신발",
  },
  {
    name: "product-clean",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200",
    desc: "깔끔한 배경 신발 (대조군)",
  },
];

async function main() {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const outDir = path.resolve("scripts/test-output/rmbg-compare");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // ── 테스트 이미지 수집 ──
  const images: { name: string; url: string; desc: string }[] = [];

  const localDir = path.resolve("test-products");
  if (fs.existsSync(localDir)) {
    const files = fs.readdirSync(localDir).filter((f) =>
      /\.(jpg|jpeg|png|webp)$/i.test(f)
    );
    for (const f of files) {
      const buf = fs.readFileSync(path.join(localDir, f));
      const rotated = await sharp(buf).rotate().jpeg({ quality: 92 }).toBuffer();
      const b64 = `data:image/jpeg;base64,${rotated.toString("base64")}`;
      images.push({
        name: f.replace(/\.[^.]+$/, ""),
        url: b64,
        desc: `로컬: ${f}`,
      });
    }
    console.log(`로컬 이미지 ${files.length}개 로드`);
  }

  if (images.length === 0) {
    console.log("test-products/ 폴더 없음 → Unsplash 샘플 사용");
    images.push(...FALLBACK_SAMPLES);
  }

  // ── 결과 테이블 ──
  const results: {
    image: string;
    model: string;
    time: number;
    outW: number;
    outH: number;
    file: string;
    error?: string;
  }[] = [];

  console.log("\n" + "=".repeat(70));
  console.log("  배경제거 모델 A/B 비교");
  console.log("  모델: " + MODELS.map((m) => m.key).join(" vs "));
  console.log("  이미지: " + images.length + "개");
  console.log("=".repeat(70));

  for (const img of images) {
    console.log(`\n── ${img.name} (${img.desc}) ──`);

    // 원본 저장
    let origBuf: Buffer;
    if (img.url.startsWith("data:")) {
      origBuf = Buffer.from(img.url.split(",")[1], "base64");
    } else {
      const res = await fetch(img.url);
      origBuf = Buffer.from(await res.arrayBuffer());
    }
    const origMeta = await sharp(origBuf).metadata();
    fs.writeFileSync(path.join(outDir, `${img.name}-original.jpg`), origBuf);
    console.log(`  원본: ${origMeta.width}x${origMeta.height}`);

    for (const model of MODELS) {
      const tag = `${img.name}-${model.key}`;
      console.log(`  ▶ ${model.label}...`);
      const start = Date.now();

      try {
        const output = await replicate.run(model.model as `${string}/${string}`, {
          input: model.inputFn(img.url),
          signal: AbortSignal.timeout(60_000),
        });
        const elapsed = (Date.now() - start) / 1000;

        // output 파싱
        let url: string;
        if (typeof output === "string") {
          url = output;
        } else if (output instanceof ReadableStream || (typeof output === "object" && output !== null && Symbol.asyncIterator in output)) {
          const chunks: string[] = [];
          for await (const chunk of output as AsyncIterable<unknown>) {
            chunks.push(String(chunk));
          }
          url = chunks[0] || "";
        } else {
          url = String(output);
        }

        if (!url.startsWith("http")) {
          throw new Error(`유효하지 않은 출력: ${url.slice(0, 100)}`);
        }

        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        const meta = await sharp(buf).metadata();
        const outFile = `${tag}.png`;
        fs.writeFileSync(path.join(outDir, outFile), buf);

        console.log(`    ✅ ${elapsed.toFixed(1)}초 | ${meta.width}x${meta.height} | ${outFile}`);
        results.push({
          image: img.name,
          model: model.key,
          time: elapsed,
          outW: meta.width || 0,
          outH: meta.height || 0,
          file: outFile,
        });

        // 흰배경 합성본도 생성 (육안 비교용)
        const size = 2048;
        const trimmed = await sharp(buf).trim().toBuffer();
        const tMeta = await sharp(trimmed).metadata();
        const tw = tMeta.width || 100;
        const th = tMeta.height || 100;
        const scale = Math.min((size * 0.8) / tw, (size * 0.8) / th);
        const fw = Math.floor(tw * scale);
        const fh = Math.floor(th * scale);
        const resized = await sharp(trimmed).resize(fw, fh, { fit: "fill" }).toBuffer();

        const composite = await sharp({
          create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
        })
          .composite([{
            input: resized,
            top: Math.floor((size - fh) / 2),
            left: Math.floor((size - fw) / 2),
          }])
          .jpeg({ quality: 92 })
          .toBuffer();

        fs.writeFileSync(path.join(outDir, `${tag}-white.jpg`), composite);
      } catch (err: unknown) {
        const elapsed = (Date.now() - start) / 1000;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`    ❌ ${elapsed.toFixed(1)}초 | ${msg.slice(0, 150)}`);
        results.push({
          image: img.name,
          model: model.key,
          time: elapsed,
          outW: 0,
          outH: 0,
          file: "",
          error: msg.slice(0, 100),
        });
      }

      // rate limit 방지
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // ── 결과 요약 ──
  console.log("\n" + "=".repeat(70));
  console.log("  결과 요약");
  console.log("=".repeat(70));
  console.log(
    "\n" +
      [
        "이미지".padEnd(20),
        "모델".padEnd(15),
        "시간".padEnd(8),
        "해상도".padEnd(14),
        "상태",
      ].join(" | ")
  );
  console.log("-".repeat(70));

  for (const r of results) {
    console.log(
      [
        r.image.padEnd(20),
        r.model.padEnd(15),
        `${r.time.toFixed(1)}s`.padEnd(8),
        r.error ? "-" : `${r.outW}x${r.outH}`.padEnd(14),
        r.error ? `❌ ${r.error.slice(0, 40)}` : "✅",
      ].join(" | ")
    );
  }

  console.log(`\n파일: ${outDir}`);
  console.log("비용: replicate.com/account/billing");
  console.log("\n검수 포인트:");
  console.log("  1. *-bria.png vs *-birefnet.png: 손이 제거됐나?");
  console.log("  2. *-white.jpg 비교: 엣지 품질 (잔상, 헤일로)");
  console.log("  3. 해상도: 입력 대비 출력 크기 비교");
  console.log("  4. 속도/비용 비교\n");
}

main().catch(console.error);
