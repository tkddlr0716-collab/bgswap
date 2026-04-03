import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, type Client } from "@libsql/client";

// In-memory SQLite for testing
let db: Client;

async function setupDb() {
  db = createClient({ url: ":memory:" });

  await db.batch([
    `CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      download_token TEXT,
      style TEXT DEFAULT 'business',
      options TEXT,
      plan TEXT,
      resume_email_sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT
    )`,
    `CREATE TABLE images (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      type TEXT NOT NULL,
      resolution TEXT NOT NULL DEFAULT 'low',
      style TEXT DEFAULT NULL,
      process_status TEXT,
      retry_count INTEGER DEFAULT 0,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL DEFAULT (datetime('now', '+7 days')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    `CREATE INDEX idx_images_process_status ON images(process_status)`,
  ]);
}

// Helpers
async function insertOrder(id: string, status: string, plan: string | null = null) {
  await db.execute({
    sql: `INSERT INTO orders (id, email, status, plan, paid_at)
          VALUES (?, 'test@test.com', ?, ?, datetime('now'))`,
    args: [id, status, plan],
  });
}

async function insertImage(
  id: string,
  orderId: string,
  processStatus: string,
  retryCount = 0
) {
  await db.execute({
    sql: `INSERT INTO images (id, order_id, r2_key, type, process_status, retry_count)
          VALUES (?, ?, ?, 'upload', ?, ?)`,
    args: [id, orderId, `uploads/${orderId}/${id}.jpg`, processStatus, retryCount],
  });
}

async function getImageStatus(id: string) {
  const r = await db.execute({ sql: "SELECT process_status, retry_count FROM images WHERE id = ?", args: [id] });
  return { status: r.rows[0]?.process_status as string, retryCount: r.rows[0]?.retry_count as number };
}

async function getOrderStatus(id: string) {
  const r = await db.execute({ sql: "SELECT status FROM orders WHERE id = ?", args: [id] });
  return r.rows[0]?.status as string;
}

describe("Phase D: DB schema", () => {
  beforeEach(setupDb);

  it("orders table has plan column", async () => {
    await insertOrder("o1", "paid", "pro");
    const r = await db.execute({ sql: "SELECT plan FROM orders WHERE id = 'o1'", args: [] });
    expect(r.rows[0].plan).toBe("pro");
  });

  it("orders table has resume_email_sent_at column", async () => {
    await insertOrder("o1", "paid");
    await db.execute({
      sql: "UPDATE orders SET resume_email_sent_at = datetime('now') WHERE id = 'o1'",
      args: [],
    });
    const r = await db.execute({ sql: "SELECT resume_email_sent_at FROM orders WHERE id = 'o1'", args: [] });
    expect(r.rows[0].resume_email_sent_at).toBeTruthy();
  });

  it("images table has process_status and retry_count columns", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "pending", 0);
    const { status, retryCount } = await getImageStatus("i1");
    expect(status).toBe("pending");
    expect(retryCount).toBe(0);
  });
});

describe("Phase D: Atomic claim (pending → processing)", () => {
  beforeEach(setupDb);

  it("claims a pending image successfully", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "pending");

    const result = await db.execute({
      sql: `UPDATE images SET process_status = 'processing'
            WHERE id = 'i1' AND process_status = 'pending'`,
      args: [],
    });
    expect(result.rowsAffected).toBe(1);
    expect((await getImageStatus("i1")).status).toBe("processing");
  });

  it("rejects double-claim (already processing)", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "processing");

    const result = await db.execute({
      sql: `UPDATE images SET process_status = 'processing'
            WHERE id = 'i1' AND process_status = 'pending'`,
      args: [],
    });
    expect(result.rowsAffected).toBe(0);
  });

  it("rejects claim on done image", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "done");

    const result = await db.execute({
      sql: `UPDATE images SET process_status = 'processing'
            WHERE id = 'i1' AND process_status = 'pending'`,
      args: [],
    });
    expect(result.rowsAffected).toBe(0);
  });
});

describe("Phase D: Upload limits", () => {
  beforeEach(setupDb);

  it("starter plan allows 10 uploads", async () => {
    await insertOrder("o1", "paid", "starter");
    for (let i = 0; i < 10; i++) {
      await insertImage(`i${i}`, "o1", "pending");
    }
    const r = await db.execute({
      sql: "SELECT COUNT(*) as cnt FROM images WHERE order_id = 'o1'",
      args: [],
    });
    expect(r.rows[0].cnt).toBe(10);
  });

  it("pro plan allows 100 uploads", async () => {
    await insertOrder("o1", "paid", "pro");
    const r = await db.execute({ sql: "SELECT plan FROM orders WHERE id = 'o1'", args: [] });
    const plan = r.rows[0].plan as string;
    const maxPhotos = plan === "pro" ? 100 : 10;
    expect(maxPhotos).toBe(100);
  });

  it("null plan (free tier) defaults to 1", async () => {
    await insertOrder("o1", "uploaded", null);
    const r = await db.execute({ sql: "SELECT plan FROM orders WHERE id = 'o1'", args: [] });
    const plan = r.rows[0].plan;
    const maxPhotos = plan === "pro" ? 100 : plan === "starter" ? 10 : 1;
    expect(maxPhotos).toBe(1);
  });
});

describe("Phase D: Failed image retry logic", () => {
  beforeEach(setupDb);

  it("resets failed images with retry_count < 2 to pending", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "failed", 0);
    await insertImage("i2", "o1", "failed", 1);

    const result = await db.execute({
      sql: `UPDATE images
            SET process_status = 'pending', retry_count = COALESCE(retry_count, 0) + 1
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status = 'failed' AND COALESCE(retry_count, 0) < 2`,
      args: [],
    });
    expect(result.rowsAffected).toBe(2);

    const s1 = await getImageStatus("i1");
    expect(s1.status).toBe("pending");
    expect(s1.retryCount).toBe(1);

    const s2 = await getImageStatus("i2");
    expect(s2.status).toBe("pending");
    expect(s2.retryCount).toBe(2);
  });

  it("does NOT reset failed images with retry_count >= 2", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "failed", 2);

    const result = await db.execute({
      sql: `UPDATE images
            SET process_status = 'pending', retry_count = COALESCE(retry_count, 0) + 1
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status = 'failed' AND COALESCE(retry_count, 0) < 2`,
      args: [],
    });
    expect(result.rowsAffected).toBe(0);
    expect((await getImageStatus("i1")).status).toBe("failed");
  });

  it("completes order when all retries are exhausted", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "done", 0);
    await insertImage("i2", "o1", "failed", 2); // exhausted

    // Retry query returns 0 rows affected
    const retried = await db.execute({
      sql: `UPDATE images
            SET process_status = 'pending', retry_count = COALESCE(retry_count, 0) + 1
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status = 'failed' AND COALESCE(retry_count, 0) < 2`,
      args: [],
    });
    expect(retried.rowsAffected).toBe(0);

    // Check no active images remain
    const stillActive = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM images
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status IN ('pending', 'processing')`,
      args: [],
    });
    expect(stillActive.rows[0].cnt).toBe(0);

    // Mark order completed
    await db.execute({
      sql: "UPDATE orders SET status = 'completed' WHERE id = 'o1'",
      args: [],
    });
    expect(await getOrderStatus("o1")).toBe("completed");
  });
});

describe("Phase D: Order completion", () => {
  beforeEach(setupDb);

  it("order stays paid while images are still pending", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "done");
    await insertImage("i2", "o1", "pending");

    const remaining = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM images
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status IN ('pending', 'processing')`,
      args: [],
    });
    expect((remaining.rows[0].cnt as number) > 0).toBe(true);
    // Should NOT complete
    expect(await getOrderStatus("o1")).toBe("paid");
  });

  it("order completes when all images are done", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "done");
    await insertImage("i2", "o1", "done");

    const remaining = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM images
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status IN ('pending', 'processing')`,
      args: [],
    });
    if ((remaining.rows[0].cnt as number) === 0) {
      await db.execute({
        sql: "UPDATE orders SET status = 'completed' WHERE id = 'o1'",
        args: [],
      });
    }
    expect(await getOrderStatus("o1")).toBe("completed");
  });

  it("order completes with partial results (done + permanently failed)", async () => {
    await insertOrder("o1", "paid");
    await insertImage("i1", "o1", "done");
    await insertImage("i2", "o1", "failed", 2);

    // No retryable images
    const retried = await db.execute({
      sql: `UPDATE images
            SET process_status = 'pending', retry_count = COALESCE(retry_count, 0) + 1
            WHERE order_id = 'o1' AND type = 'upload'
              AND process_status = 'failed' AND COALESCE(retry_count, 0) < 2`,
      args: [],
    });

    if (retried.rowsAffected === 0) {
      const stillActive = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM images
              WHERE order_id = 'o1' AND type = 'upload'
                AND process_status IN ('pending', 'processing')`,
        args: [],
      });
      if ((stillActive.rows[0].cnt as number) === 0) {
        await db.execute({
          sql: "UPDATE orders SET status = 'completed' WHERE id = 'o1'",
          args: [],
        });
      }
    }
    expect(await getOrderStatus("o1")).toBe("completed");
  });
});

// Mirrors the actual webhook plan detection logic
function detectPlan(metadataPlan: string | undefined, productName: string, amount: number): string {
  if (metadataPlan === "pro" || metadataPlan === "starter") {
    return metadataPlan;
  }
  return productName.toLowerCase().includes("pro") || amount >= 2900 ? "pro" : "starter";
}

describe("Phase D: Plan detection from webhook", () => {
  it("uses metadata.plan when present (pro)", () => {
    expect(detectPlan("pro", "", 0)).toBe("pro");
  });

  it("uses metadata.plan when present (starter)", () => {
    expect(detectPlan("starter", "BgSwap Pro", 9900)).toBe("starter");
  });

  it("ignores invalid metadata.plan and falls back", () => {
    expect(detectPlan("invalid" as string, "", 2900)).toBe("pro");
    expect(detectPlan(undefined, "", 499)).toBe("starter");
  });

  it("fallback: detects pro from amount >= 2900", () => {
    expect(detectPlan(undefined, "", 2900)).toBe("pro");
  });

  it("fallback: detects pro from product name", () => {
    expect(detectPlan(undefined, "BgSwap Pro — 100 Products", 0)).toBe("pro");
  });

  it("fallback: defaults to starter for low amounts", () => {
    expect(detectPlan(undefined, "BgSwap Starter", 499)).toBe("starter");
  });
});

describe("Phase D: Resume email deduplication", () => {
  beforeEach(setupDb);

  it("sends email when resume_email_sent_at is null", async () => {
    await insertOrder("o1", "paid");
    const r = await db.execute({
      sql: "SELECT resume_email_sent_at FROM orders WHERE id = 'o1'",
      args: [],
    });
    expect(r.rows[0].resume_email_sent_at).toBeNull();
    // Should proceed to send
  });

  it("blocks email when sent within 30 minutes", async () => {
    await insertOrder("o1", "paid");
    await db.execute({
      sql: "UPDATE orders SET resume_email_sent_at = datetime('now') WHERE id = 'o1'",
      args: [],
    });

    // Query used by cron to filter recent sends
    const stalled = await db.execute({
      sql: `SELECT id FROM orders
            WHERE id = 'o1'
              AND (resume_email_sent_at IS NULL OR resume_email_sent_at < datetime('now', '-30 minutes'))`,
      args: [],
    });
    expect(stalled.rows.length).toBe(0);
  });

  it("allows email after 30 minutes", async () => {
    await insertOrder("o1", "paid");
    // Simulate sent 31 minutes ago
    await db.execute({
      sql: "UPDATE orders SET resume_email_sent_at = datetime('now', '-31 minutes') WHERE id = 'o1'",
      args: [],
    });

    const stalled = await db.execute({
      sql: `SELECT id FROM orders
            WHERE id = 'o1'
              AND (resume_email_sent_at IS NULL OR resume_email_sent_at < datetime('now', '-30 minutes'))`,
      args: [],
    });
    expect(stalled.rows.length).toBe(1);
  });
});
