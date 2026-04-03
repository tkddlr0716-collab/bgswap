import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  try {
    await db.execute("ALTER TABLE orders ADD COLUMN options TEXT DEFAULT NULL");
    console.log("OK: options column added");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("duplicate column")) {
      console.log("OK: column already exists");
    } else {
      console.error("Error:", msg);
    }
  }
}
main();
