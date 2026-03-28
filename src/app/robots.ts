import type { MetadataRoute } from "next";

/**
 * robots.ts — Disallow all crawlers (private enterprise application).
 * Update to `allow: "/"` only for public-facing marketing pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
