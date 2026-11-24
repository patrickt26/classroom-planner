import type { MetadataRoute } from "next";
import { publicPagePaths, siteUrl } from "@/lib/platform";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: publicPagePaths.map((path) => `${path}$`),
      disallow: "/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}
