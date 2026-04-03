import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function main() {
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
  const baseUrl = process.env.R2_PUBLIC_URL!;
  const orderId = "2f3abfeb-c295-49b6-9585-dab4ad5bc4cb";

  const upload = await db.execute({ sql: "SELECT r2_key FROM images WHERE order_id = ? AND type = 'upload' LIMIT 1", args: [orderId] });
  const gen = await db.execute({ sql: "SELECT r2_key, style FROM images WHERE order_id = ? AND type = 'generated' AND r2_key LIKE '%-p0-%' ORDER BY style", args: [orderId] });

  console.log("UPLOAD:" + baseUrl + "/" + upload.rows[0].r2_key);
  for (const r of gen.rows) console.log(r.style + ":" + baseUrl + "/" + r.r2_key);
}
main().catch(console.error);
