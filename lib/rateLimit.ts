/**
 * Simple in-memory rate limiter for API routes
 * Limits by IP address, configurable window and max requests
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}, 300_000);

export function rateLimit(
  ip: string,
  windowMs: number = 60_000,   // 1 minute
  maxRequests: number = 30      // 30 req/min
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  
  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  
  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  return {
    ok: entry.count <= maxRequests,
    remaining,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
