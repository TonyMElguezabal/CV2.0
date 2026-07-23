import { getProfile } from "../lib/content/read.ts";
import { resolveSiteUrl } from "../lib/seo/siteUrl.ts";
import { buildProfilePageJsonLd } from "../lib/seo/metadata.ts";

// Input is our own validated profile content, serialized by JSON.stringify
// (which escapes it) — not visitor input. See design.md Decision 4.
export function StructuredData() {
  const graph = buildProfilePageJsonLd(getProfile(), resolveSiteUrl());

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
