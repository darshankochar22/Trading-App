type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple fixed-window limiter for API routes (in-memory; resets on server restart).
 * Returns true when the key should be blocked for this window.
 */
export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    b = { count: 0, windowStart: now };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count > maxRequests;
}

export function clientKey(request: Request, label: string): string {
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]?.trim() : request.headers.get("x-real-ip");
  return `${label}:${ip ?? "unknown"}`;
}
