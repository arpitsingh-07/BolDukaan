/**
 * The public base URL, used for absolute links in the sitemap, robots, and
 * OpenGraph tags. Prefers an explicit env var, falls back to Vercel's, then the
 * known production domain.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://boldukaan-ochre.vercel.app";
}
