import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { isDbConfigured } from "@/lib/db";
import { listActiveShopSlugs } from "@/lib/shops";

// Shops change, so build the sitemap on request rather than caching it.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/nearby`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/support`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let shops: MetadataRoute.Sitemap = [];
  if (isDbConfigured()) {
    try {
      const rows = await listActiveShopSlugs();
      shops = rows.map((s) => ({
        url: `${base}/s/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    } catch {
      // DB hiccup — still return the static pages rather than 500 the sitemap.
    }
  }

  return [...staticPages, ...shops];
}
