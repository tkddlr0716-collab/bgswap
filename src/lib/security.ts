import { ensureDb } from "./db";

// --- Disposable email domain blocking ---
// Common disposable/temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  "guerrillamail.com", "guerrillamail.de", "grr.la", "guerrillamailblock.com",
  "tempmail.com", "temp-mail.org", "throwaway.email", "tempail.com",
  "mailinator.com", "maildrop.cc", "dispostable.com", "yopmail.com",
  "yopmail.fr", "sharklasers.com", "guerrillamail.net", "grr.la",
  "mailnesia.com", "trashmail.com", "trashmail.me", "trashmail.net",
  "10minutemail.com", "10minute.email", "minutemail.com",
  "getnada.com", "nada.email", "tempinbox.com",
  "fakeinbox.com", "mailcatch.com", "tempr.email",
  "discard.email", "discardmail.com", "discardmail.de",
  "tmail.ws", "tmpmail.net", "tmpmail.org",
  "burnermail.io", "inboxkitten.com", "emailondeck.com",
  "mohmal.com", "harakirimail.com", "mailsac.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

// --- IP-based free sample limit ---
export async function hasUsedFreeSample(ip: string, email?: string): Promise<boolean> {
  const db = await ensureDb();
  // Check by IP
  const result = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM free_samples WHERE ip = ?",
    args: [ip],
  });
  if (((result.rows[0].cnt as number) || 0) > 0) return true;
  // Also check by email
  if (email) {
    const emailResult = await db.execute({
      sql: "SELECT COUNT(*) as cnt FROM free_samples WHERE email = ?",
      args: [email],
    });
    if (((emailResult.rows[0].cnt as number) || 0) > 0) return true;
  }
  return false;
}

// --- Rate limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

// --- reCAPTCHA verification ---
export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET_KEY) return true; // Skip in dev if not configured

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });
  const data = await res.json();
  return data.success && data.score >= 0.5;
}
