import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

export async function ensureDb(): Promise<Client> {
  const db = getDb();
  if (!_initialized) {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        download_token TEXT,
        style TEXT DEFAULT 'business',
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
      `CREATE INDEX IF NOT EXISTS idx_images_order_id ON images(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_images_type ON images(type)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_download_token ON orders(download_token)`,
      `CREATE INDEX IF NOT EXISTS idx_free_samples_ip ON free_samples(ip)`,
      `CREATE INDEX IF NOT EXISTS idx_free_samples_created_at ON free_samples(created_at)`,
    ]);

    // Add options column if missing (Phase B migration)
    try {
      await db.execute(`ALTER TABLE orders ADD COLUMN options TEXT`);
    } catch {
      // Column already exists — ignore
    }

    // Phase D migrations: bulk upload support
    try {
      await db.execute(`ALTER TABLE orders ADD COLUMN plan TEXT`);
    } catch {
      // Column already exists — ignore
    }
    try {
      await db.execute(`ALTER TABLE images ADD COLUMN process_status TEXT`);
    } catch {
      // Column already exists — ignore
    }
    try {
      await db.execute(`ALTER TABLE images ADD COLUMN retry_count INTEGER DEFAULT 0`);
    } catch {
      // Column already exists — ignore
    }
    try {
      await db.execute(`ALTER TABLE orders ADD COLUMN resume_email_sent_at TEXT`);
    } catch {
      // Column already exists — ignore
    }
    try {
      await db.execute(`ALTER TABLE images ADD COLUMN processing_started_at TEXT`);
    } catch {
      // Column already exists — ignore
    }

    // Index for finding pending images efficiently
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_images_process_status ON images(process_status)`
    );

    _initialized = true;
  }
  return db;
}
