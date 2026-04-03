/**
 * DB 초기화 스크립트
 * Turso 가입 후 실행: npx tsx scripts/init-db.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("❌ TURSO_DATABASE_URL이 설정되지 않았습니다.");
    console.error("   .env.local에 추가하세요.");
    process.exit(1);
  }

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("DB 초기화 중...");

  await db.batch([
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      download_token TEXT,
      style TEXT DEFAULT 'all',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      type TEXT NOT NULL,
      resolution TEXT NOT NULL DEFAULT 'low',
      style TEXT DEFAULT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    `CREATE TABLE IF NOT EXISTS free_samples (
      id TEXT PRIMARY KEY,
      ip TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ]);

  console.log("✅ 테이블 3개 생성 완료:");
  console.log("   - orders");
  console.log("   - images");
  console.log("   - free_samples");

  // 확인
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("\n현재 테이블:", tables.rows.map(r => r.name).join(", "));
}

main().catch(console.error);
