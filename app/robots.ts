import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Public pages are crawlable; app/owner surfaces and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/create", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
