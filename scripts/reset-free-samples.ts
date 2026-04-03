import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const before = await db.execute("SELECT COUNT(*) as cnt FROM free_samples");
  console.log(`Free samples before: ${before.rows[0].cnt}`);

  await db.execute("DELETE FROM free_samples");

  const after = await db.execute("SELECT COUNT(*) as cnt FROM free_samples");
  console.log(`Free samples after: ${after.rows[0].cnt}`);
  console.log("Done. Free sample limits reset.");
}

main().catch(console.error);
