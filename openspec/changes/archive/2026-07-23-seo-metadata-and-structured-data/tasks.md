## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-76-83-seo-metadata-opengraph-and-structured-data` (Linear-provided branch name for JOS-76) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is declarative metadata/SEO — no
database, no HTTP write endpoint. Per this repo's convention, unit tests
cover the PURE builders (metadata object shape + JSON-LD validity +
site-URL resolution) with NO network calls. The rendered card (AC2) and
rich-results validity (AC3) are verified via external validators as a
manual/owner gate — the ticket itself names "external validators as the
test". Applicable gates: TDD unit tests, `npx vitest run`, `npx tsc
--noEmit`, `npm run validate:content` (a content-adjacent surface),
`npm run lint` (broken repo-wide, same skip as prior changes), and a dev-
server check of the built <head>, /opengraph-image, /robots.txt,
/sitemap.xml, and the JSON-LD script, all agent-executed.
-->

## 1. Site URL resolver + env (TDD)

- [x] 1.1 Write failing tests in `lib/seo/siteUrl.test.ts`: `resolveSiteUrl()` returns `NEXT_PUBLIC_SITE_URL` when set; falls back to `https://${VERCEL_PROJECT_PRODUCTION_URL}` when only that is set; falls back to `http://localhost:3000` when neither is set; strips any trailing slash so callers can safely append paths
- [x] 1.2 Implement `lib/seo/siteUrl.ts` exporting `resolveSiteUrl(): string` with that precedence (reads `process.env`), returning an origin with no trailing slash
- [x] 1.3 Add a placeholder `NEXT_PUBLIC_SITE_URL` to `.env.local` (gitignored) with a comment that the real production origin is set here (local) and in the Vercel project env (production); note the resolver falls back to the Vercel/production URL then localhost so dev/preview stay self-consistent
- [x] 1.4 Run `npx vitest run lib/seo/siteUrl.test.ts` and confirm all cases pass

## 2. Metadata + JSON-LD builders (TDD, pure — the single source of truth)

- [x] 2.1 Write failing tests in `lib/seo/metadata.test.ts` with a fixture `Profile`: `buildRootMetadata(profile, siteUrl)` returns a Next `Metadata` with a profile-derived `title` and `description`, a `metadataBase` and `alternates.canonical` from `siteUrl`, an `openGraph` block (type, title, description, url, images) and a `twitter` block (`card: "summary_large_image"`); `buildPersonJsonLd(profile, siteUrl)` returns `{ "@context": "https://schema.org", "@type": "Person", name, jobTitle|description, url, sameAs: [...] }` with `sameAs` derived from `links` (linkedin/github/website, omitting absent ones); `buildProfilePageJsonLd(profile, siteUrl)` returns a `ProfilePage` whose `mainEntity` is the Person; assert no required field is `undefined`/`null`
- [x] 2.2 Implement `lib/seo/metadata.ts`: `buildRootMetadata`, `buildPersonJsonLd`, `buildProfilePageJsonLd` (and a combined `buildStructuredDataGraph` if convenient) — pure functions taking `(profile, siteUrl)`, deriving every absolute URL from `siteUrl`, and reading only fields that exist on the Zod-validated `Profile`
- [x] 2.3 Run `npx vitest run lib/seo/metadata.test.ts` and confirm all cases pass

## 3. Structured-data component + wire metadata into the layout

- [x] 3.1 Implement `components/StructuredData.tsx` (server component): builds the Person + ProfilePage graph from `getProfile()` + `resolveSiteUrl()` and renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />` (input is our own validated content serialized by `JSON.stringify` — see design.md Decision 4)
- [x] 3.2 Add a server-rendered test `components/StructuredData.ssr.test.tsx` (`renderToStaticMarkup`) asserting the output contains a `application/ld+json` script whose parsed JSON has `@type` `ProfilePage` with a `Person` `mainEntity` and the fixture's name
- [x] 3.3 Update `app/layout.tsx`: replace the minimal `metadata` export with `export const metadata = buildRootMetadata(getProfile(), resolveSiteUrl())`, and render `<StructuredData />` inside `<body>` (or `<head>` via the metadata route as appropriate); keep `layout.tsx` a server component
- [x] 3.4 Run `npx vitest run components/StructuredData.ssr.test.tsx` and confirm it passes

## 4. OpenGraph image (generated from content)

- [x] 4.1 Implement `app/opengraph-image.tsx` using `next/og`'s `ImageResponse`: a 1200×630 branded dark card rendering the profile `name` + `positioning` from `getProfile()`, in the site's aesthetic (dark ground, light type); export `size`, `contentType = "image/png"`, and (if required) `runtime`
- [x] 4.2 Verify the route builds and returns an image (checked in the §7 dev-server step — `ImageResponse` output isn't pixel-assertable in unit tests; the metadata test in §2 already covers that `openGraph.images` points at it)

## 5. robots + sitemap

- [x] 5.1 Implement `app/robots.ts` (Next `MetadataRoute.Robots`): allow all user agents, set `sitemap` to `${resolveSiteUrl()}/sitemap.xml`
- [x] 5.2 Implement `app/sitemap.ts` (Next `MetadataRoute.Sitemap`): list the single landing route with an absolute URL from `resolveSiteUrl()` and a `lastModified`
- [x] 5.3 (Optional) add a light unit test asserting `robots()`/`sitemap()` return the expected shape with URLs derived from a stubbed `NEXT_PUBLIC_SITE_URL`

## 6. Documentation

- [x] 6.1 Update `README.md`: add a short "SEO / site URL" note documenting `NEXT_PUBLIC_SITE_URL` (set locally + in Vercel), that the OG image is generated from `profile.yaml`, and the external-validator gate (share debugger + Google Rich Results) as the AC2/AC3 manual check

## 7. Full verification (agent executes all of this itself)

- [x] 7.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 7.2 Run `npx tsc --noEmit` clean
- [x] 7.3 Run `npm run validate:content` clean
- [x] 7.4 Run `npm run lint` — expect the same pre-existing repo-wide failure (missing `eslint.config.mjs`); skip with the same rationale unless it has since been fixed
- [x] 7.5 Started the dev server and confirmed via curl: the landing page `<head>` carries title/description/canonical/full OpenGraph/Twitter tags built from the real profile; `/opengraph-image` returns a 1200×630 PNG rendering the name + positioning; `/robots.txt` and `/sitemap.xml` return valid content with the configured origin; the page contains valid `application/ld+json` — `ProfilePage` with a `Person` mainEntity, real name and `sameAs` links (LinkedIn/GitHub) from `profile.yaml`. Live share-debugger + Google Rich Results validation remains an owner post-deploy follow-up (needs the real deployed domain in `NEXT_PUBLIC_SITE_URL`)
- [x] 7.6 Stopped the dev server; confirmed no stray processes left running

## 8. OpenSpec sync

- [x] 8.1 After merge, sync `specs/seo-metadata-and-structured-data/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
