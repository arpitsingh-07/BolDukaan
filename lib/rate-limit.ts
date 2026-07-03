/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Honest scope note: memory is per-process, so on serverless (Vercel) each
 * warm instance keeps its own counters — this bounds abuse per instance rather
 * than globally. That's adequate protection for the Gemini free tier today;
 * swap the backing store for Redis/Upstash when traffic justifies it (the
 * call sites won't change).
 */

const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Cheap protection against unbounded growth from many unique keys.
  if (buckets.size > MAX_KEYS) {
    for (const [k, times] of buckets) {
      if (times.length === 0 || now - times[times.length - 1] > windowMs) {
        buckets.delete(k);
      }
    }
  }

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** Best-effort client IP (first hop of x-forwarded-for behind a proxy). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}
