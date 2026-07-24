import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// This site is static-first (PRD/README) — prerendered pages should be
// served directly from Workers Static Assets, bypassing the server
// function entirely, rather than re-executing the Next.js render (which
// would re-run request-time-incompatible content reads) on every request.
// The few genuinely dynamic routes (/admin, /api/chat, /api/events) are
// Route Handlers / force-dynamic pages, unaffected by this — they bypass
// the cache and hit the server function directly, as intended. See
// openspec/changes/cloudflare-deployment-readiness.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
