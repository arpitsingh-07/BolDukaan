/**
 * The public base URL, used for absolute links in the sitemap, robots, and
 * OpenGraph tags. Prefers an explicit env var (handy for preview environments),
 * otherwise falls back to the production domain. We deliberately do NOT use
 * Vercel's per-deployment VERCEL_URL here — that would put a throwaway
 * *.vercel.app host into canonical URLs, the sitemap, and share cards.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  return "https://boldukaan.com";
}
