import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Lazily create the Neon SQL client. Lazy (not module-level) so a missing
 * DATABASE_URL surfaces as a handled 503 in the route rather than crashing the
 * whole server at import time.
 *
 * The Neon serverless driver talks to Postgres over HTTP — it works in Next's
 * Node runtime for local dev and in serverless/edge on Vercel, with no
 * connection pool to manage.
 */
let cached: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!cached) {
    cached = neon(url);
  }
  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
