import type { SiteConfig } from "./build.ts";

// A dynamic import (not `node:fs`) so the generated config is bundled at
// build time as a module reference rather than read from disk at request
// time — see lib/rag/retrieve.ts's loadIndex() for the identical pattern
// and openspec/changes/cloudflare-deployment-readiness for why.
export async function loadSiteConfig(): Promise<SiteConfig> {
  const module = await import("./generated.json", { with: { type: "json" } });
  return module.default as SiteConfig;
}
