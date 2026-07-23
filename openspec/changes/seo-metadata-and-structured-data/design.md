## Context

`app/layout.tsx` exports `metadata = { title, description }` and nothing else — no `metadataBase`, OpenGraph, Twitter, JSON-LD, robots, or sitemap. `content/profile.yaml` already holds everything the metadata needs (`name`, `positioning`, `summary`, `links.linkedin`/`github`/`website`) and is Zod-validated at the content gate. The site is a single landing route (App Router). Next 16 provides first-class metadata: the `Metadata` export, file conventions (`opengraph-image`, `robots`, `sitemap`), and `next/og`'s `ImageResponse`. Two owner decisions were taken up front: the canonical URL comes from an env var (not a hardcode), and the OG image is generated from content (not an owner-supplied asset).

## Goals / Non-Goals

**Goals:**
- Every SSG page carries complete, correct head metadata sourced from validated profile content (AC1).
- A shared link renders a designed OpenGraph/Twitter card (AC2), with the image generated from content so it can never drift from the profile.
- Valid `Person` + `ProfilePage` JSON-LD on the landing page, passing schema.org / Google Rich Results validation (AC3).
- Metadata logic lives in **pure, unit-testable builders** — the shape and JSON-LD validity are proven in `npm test`, not just eyeballed.

**Non-Goals:**
- The Lighthouse ≥90 gate and audit tooling — that's 8.1 (JOS-74); this story only lifts the SEO sub-score by making metadata/robots/structured-data exist.
- Multi-page/per-route metadata — one landing route today; the builders take a route's data but only the root is wired now.
- Owner-designed static art, icon/favicon redesign, or a full manifest/PWA surface.

## Decisions

### 1. Pure builders in `lib/seo/metadata.ts`, wired in `app/layout.tsx`
`buildRootMetadata(profile, siteUrl)` returns a Next `Metadata` object; `buildPersonJsonLd(profile, siteUrl)` and `buildProfilePageJsonLd(profile, siteUrl)` return plain JSON-LD objects. `app/layout.tsx` imports `getProfile()` + `resolveSiteUrl()` and exports the built metadata; a `<StructuredData />` server component serializes the JSON-LD. Keeping the logic in pure functions (not inline in the layout) is what makes it unit-testable — mirrors how `lib/analytics/schema.ts` and `lib/seo` peers isolate pure logic from the framework surface.
- *Alternative considered:* inline `metadata` object literal in `layout.tsx`. Rejected — not unit-testable, and the JSON-LD builder is non-trivial enough to warrant assertions on required fields.

### 2. Canonical URL resolved once, from env, with safe fallbacks
A single `resolveSiteUrl()` helper returns, in order: `NEXT_PUBLIC_SITE_URL` → `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `http://localhost:3000` (dev). Every absolute URL (`metadataBase`, canonical, OG `url`/`image`, sitemap entries, JSON-LD `url`/`@id`) derives from that one value, so there is exactly one place the domain is configured. The owner sets `NEXT_PUBLIC_SITE_URL` in `.env.local` and Vercel; a placeholder + README note document it.
- *Alternative considered:* hardcode the domain. Rejected (owner chose env-var) — avoids a code change when the domain is finalized and keeps preview deploys self-referencing correct.

### 3. OpenGraph image generated from content via `next/og`
`app/opengraph-image.tsx` uses `ImageResponse` to render a 1200×630 branded dark card showing the profile `name` and `positioning`, matching the site's aesthetic (dark ground, light type). Sourcing the text from `getProfile()` keeps the card DRY with content — it can't drift from the site. `next/og` ships with Next 16 (no new dependency) and runs on the edge runtime by default.
- *Font:* use `ImageResponse`'s built-in default font family to keep the story S-sized and avoid bundling/`fetch`ing a font file; if the default proves visually off, a single self-hosted font can be embedded later (noted as a follow-up, not blocking AC2).
- *Alternative considered:* owner-supplied static `/public` image. Rejected (owner chose generated) — a static asset would be bespoke but drifts from content and adds a collection pause.

### 4. JSON-LD as `Person` + `ProfilePage`, injected via a `<script>` server component
`ProfilePage` (`mainEntity` → the `Person`) is the schema.org type for exactly this page kind; `Person` carries `name`, `jobTitle`/`description` (from positioning/summary), `url`, and `sameAs` (the profile's LinkedIn/GitHub/website links). `StructuredData.tsx` is a server component rendering `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />`. `dangerouslySetInnerHTML` is safe here: the input is our own validated profile content serialized by `JSON.stringify`, not visitor input, and `JSON.stringify` escapes the payload. (This is the one inline `<script>` the future CSP work in 8.4 must accommodate — flagged for that story.)
- *Alternative considered:* Next's metadata API doesn't emit arbitrary JSON-LD, so a `<script>` is the standard approach (per Next's own SEO docs).

### 5. `robots.ts` + `sitemap.ts` via App Router conventions
`app/robots.ts` allows all crawlers and points `sitemap` at `${siteUrl}/sitemap.xml`. `app/sitemap.ts` lists the single landing route with `lastModified`. Both use `resolveSiteUrl()`. These are declarative, satisfy AC1's "proper metadata," and directly raise the Lighthouse SEO category that 8.1 will later gate on.

### 6. Testing strategy matches the ticket ("external validators as the test")
- **Unit (npm test):** `buildRootMetadata` produces the expected `title`/`description`/`openGraph`/`twitter`/`alternates.canonical`/`metadataBase`; the JSON-LD builders produce objects with correct `@context`/`@type` (`Person`, `ProfilePage`), required fields populated from a fixture profile, `sameAs` derived from links, and no `null`/`undefined` required fields. `resolveSiteUrl()` honors env precedence.
- **Manual/external (owner gate, not CI):** paste the deployed URL into a share-debugger for the card (AC2), and run the landing page through Google Rich Results / schema.org validator for the structured data (AC3). Documented in tasks + README, same pattern as the Lighthouse/eval/Upstash manual gates.

## Risks / Trade-offs

- **[Risk]** Without a real `NEXT_PUBLIC_SITE_URL`, absolute URLs fall back to localhost/preview and OG/sitemap point at the wrong origin in production. → **Mitigation:** README ops note + `.env.local` placeholder + Vercel env; the fallback chain keeps dev/preview self-consistent, and the value is a one-line config, not code.
- **[Risk]** `next/og` `ImageResponse` runs on the edge runtime with a constrained CSS subset and default-font typography — the card could look plainer than a bespoke design. → **Mitigation:** keep the layout simple (name + positioning on a branded ground); a self-hosted font is a bounded follow-up if needed; AC2 is "renders as designed," and the design is deliberately restrained.
- **[Risk]** The JSON-LD inline `<script>` will collide with a strict CSP if 8.4 forbids inline scripts. → **Mitigation:** explicitly handed off to 8.4 (JOS-77) — its CSP must allow this one first-party inline script (via hash or nonce); recorded here and in the epic enrichment so the sequencing is deliberate.
- **[Trade-off]** Generated-from-content OG image is maintainable but less bespoke than hand-designed art. Accepted per the owner decision; content-DRedness and zero asset drift outweigh bespoke polish for an S-sized story.

## Migration Plan

No data migration, no dependencies to install. Implement per `tasks.md` → set a placeholder `NEXT_PUBLIC_SITE_URL` → `npm test` / `tsc` / `validate:content` clean → verify the built `<head>`, the `/opengraph-image` route, `/robots.txt`, `/sitemap.xml`, and the JSON-LD in the rendered page locally → owner sets the real domain + runs the external validators post-deploy. Rollback is a plain revert; nothing else reads these surfaces.

## Open Questions

- None blocking. The real production domain is owner-supplied config (Decision 2), collected at deploy time rather than pre-resolved here.
