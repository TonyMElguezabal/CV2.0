import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "../lib/seo/siteUrl.ts";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
  ];
}
