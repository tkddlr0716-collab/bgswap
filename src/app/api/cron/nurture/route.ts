import { NextRequest, NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { sendNurtureEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await ensureDb();
  let sent24h = 0, sent48h = 0, sent7d = 0;

  // Find free sample users who haven't converted to paid
  // 24h: created 23~25 hours ago
  const users24h = await db.execute({
    sql: `SELECT fs.email, o.id as order_id
          FROM free_samples fs
          JOIN orders o ON o.email = fs.email
          WHERE fs.created_at BETWEEN datetime('now', '-25 hours') AND datetime('now', '-23 hours')
            AND o.status = 'sample_generated'
            AND NOT EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = fs.email AND o2.status IN ('paid', 'completed'))`,
    args: [],
  });

  for (const row of users24h.rows) {
    try {
      await sendNurtureEmail(row.email as string, row.order_id as string, "24h");
      sent24h++;
    } catch (err) {
      console.error(`Nurture 24h failed for ${row.email}:`, err);
    }
  }

  // 48h: created 47~49 hours ago
  const users48h = await db.execute({
    sql: `SELECT fs.email, o.id as order_id
          FROM free_samples fs
          JOIN orders o ON o.email = fs.email
          WHERE fs.created_at BETWEEN datetime('now', '-49 hours') AND datetime('now', '-47 hours')
            AND o.status = 'sample_generated'
            AND NOT EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = fs.email AND o2.status IN ('paid', 'completed'))`,
    args: [],
  });

  for (const row of users48h.rows) {
    try {
      await sendNurtureEmail(row.email as string, row.order_id as string, "48h");
      sent48h++;
    } catch (err) {
      console.error(`Nurture 48h failed for ${row.email}:`, err);
    }
  }

  // 7d: created 6d23h~7d1h ago
  const users7d = await db.execute({
    sql: `SELECT fs.email, o.id as order_id
          FROM free_samples fs
          JOIN orders o ON o.email = fs.email
          WHERE fs.created_at BETWEEN datetime('now', '-7 days', '-1 hours') AND datetime('now', '-6 days', '-23 hours')
            AND o.status = 'sample_generated'
            AND NOT EXISTS (SELECT 1 FROM orders o2 WHERE o2.email = fs.email AND o2.status IN ('paid', 'completed'))`,
    args: [],
  });

  for (const row of users7d.rows) {
    try {
      await sendNurtureEmail(row.email as string, row.order_id as string, "7d");
      sent7d++;
    } catch (err) {
      console.error(`Nurture 7d failed for ${row.email}:`, err);
    }
  }

  return NextResponse.json({
    sent: { "24h": sent24h, "48h": sent48h, "7d": sent7d },
    total: sent24h + sent48h + sent7d,
  });
}
