function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

// Every absolute URL on the site (metadataBase, canonical, OpenGraph,
// sitemap, JSON-LD @id) derives from this single resolution, so the
// domain is configuration, not a hardcode — see design.md Decision 2.
export function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return stripTrailingSlash(`https://${vercelUrl}`);
  }

  return "http://localhost:3000";
}
