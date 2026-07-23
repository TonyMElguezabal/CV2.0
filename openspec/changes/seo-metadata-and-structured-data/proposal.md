## Why

The PRD calls the share preview "part of the first impression" (§9 SEO) — yet today `app/layout.tsx` exports only a bare `title` + `description`. A link to the site pasted into LinkedIn, Slack, or iMessage renders no card, and search engines and rich-result validators see no `Person`/`ProfilePage` structured data. For a site whose entire premise is a premium professional first impression, the impression currently starts blank. This is story 8.3 of the Epic 8 quality gate (JOS-76).

## What Changes

- Replace the minimal root `metadata` with a complete set built from `content/profile.yaml`: `title`, `description`, `metadataBase`, canonical URL, full **OpenGraph** (type `profile`, title, description, url, image), and **Twitter** (`summary_large_image`) tags — so any SSG page's `<head>` carries proper metadata (AC1) and a shared link renders a designed card (AC2).
- Generate the OpenGraph share image **from content** via `app/opengraph-image.tsx` (`next/og` `ImageResponse`) — a branded dark card rendering the profile's name + positioning, DRY with `profile.yaml`, no external asset to maintain.
- Emit valid **JSON-LD structured data** (`Person` + `ProfilePage`, `@context: https://schema.org`) on the landing page, sourced from profile name/positioning/summary/links, so Google Rich Results and schema.org validators pass (AC3).
- Add Next App Router **`robots.ts`** and **`sitemap.ts`** so crawlers get a valid robots policy and sitemap (part of AC1 "proper metadata" and lifting the Lighthouse SEO sub-score for 8.1).
- Resolve the canonical site URL from **`NEXT_PUBLIC_SITE_URL`** (fallback to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`), so the domain is configuration, not a hardcode. The owner supplies the real value in `.env.local` (local) and the Vercel project env (production).
- **Out of scope**: the Lighthouse ≥90 gate itself (8.1, JOS-74 — this story lifts the SEO sub-score but doesn't own the audit); per-page metadata beyond the single landing route (the site is one page today); a favicon/app-icon redesign (`favicon.ico` already ships).

## Capabilities

### New Capabilities
- `seo-metadata-and-structured-data`: the site's discoverability and share-preview surface — complete head metadata, an OpenGraph/Twitter card with a content-generated image, `Person`/`ProfilePage` JSON-LD, and robots/sitemap — all sourced from validated profile content.

### Modified Capabilities
_None._ This adds a new metadata/SEO surface; it changes no existing capability's requirements. Existing specs (hero, chapters, chat, analytics) are untouched.

## Impact

- **New files**: `lib/seo/metadata.ts` (+ `metadata.test.ts`) — pure builders for the `Metadata` object and the JSON-LD graph; `components/StructuredData.tsx` — server component emitting the `<script type="application/ld+json">`; `app/opengraph-image.tsx` — `next/og` image route; `app/robots.ts`; `app/sitemap.ts`.
- **Modified files**: `app/layout.tsx` (export the built `metadata`, set `metadataBase`, render `<StructuredData />`); `.env.local` (placeholder `NEXT_PUBLIC_SITE_URL`); `README.md` (a short "SEO / site URL" ops note); possibly `docs/PRD.md` cross-reference only if needed (no change expected).
- **No new runtime dependencies** — `next/og` ships with Next 16. `zod`/content pipeline already validate the profile fields consumed here.
- **New environment variable**: `NEXT_PUBLIC_SITE_URL` (canonical origin), local in `.env.local` (gitignored) + Vercel project env for production; falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then a localhost default for dev.
- **No HTTP endpoints, no database.** Testing is unit-level on the pure builders (metadata shape + JSON-LD validity) plus external-validator/manual checks for the rendered card and rich results (per the ticket's "external validators as the test").
