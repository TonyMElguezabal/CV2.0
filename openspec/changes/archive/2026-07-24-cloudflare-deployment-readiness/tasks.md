## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/cloudflare-deployment-readiness` from `main`
- [x] 0.2 Verify branch creation and current branch status

## 1. RAG index: dynamic import instead of runtime fs read

- [x] 1.1 Write/extend a test for `lib/rag/retrieve.ts`'s `loadIndex()` asserting it returns the parsed index array (regression guard, not a fail-first test — the refactor is behavior-preserving)
- [x] 1.2 Implement: replace `readFileSync(path)` with `await import("./index.json", { with: { type: "json" } })`, making `loadIndex()` async and removing the unused `path` parameter
- [x] 1.3 Update `app/api/chat/route.ts`'s call site to `await loadIndex()`
- [x] 1.4 Run `npx vitest run lib/rag/ app/api/chat/` and confirm green

## 2. Site config artifact: contact + chapterIds, for the two remaining request-time content reads

- [x] 2.1 Write a failing test for a new build-time script (e.g. `lib/site-config/build.ts`) asserting it writes a JSON file shaped `{ contact: ProfileContact, chapterIds: string[] }`, derived from `getProfile()`/`getExperiences()`
- [x] 2.2 Implement the script; wire it into the `prebuild` npm script alongside the existing RAG embed step
- [x] 2.3 Update `app/api/chat/route.ts`'s `rateLimitedResponse()`/`unavailableResponse()` helpers to import the generated site-config JSON for `contact` instead of calling `getProfile()`
- [x] 2.4 Run `npx vitest run` for the affected files and confirm green; confirm `lib/content/read.ts` and its existing fixture-based tests are untouched

## 3. OpenGraph image: no code change (verify the caching fix covers it)

- [x] 3.1 ~~Add an explicit font file~~ — tried, reverted: `fetch(new URL(..., import.meta.url))` for a local font isn't supported by `next build` under this route's runtime target and broke the build outright, independent of Cloudflare (see design.md Decision 2)
- [x] 3.2 Confirm `app/opengraph-image.tsx` is unchanged from its original form and `npm run build` succeeds
- [x] 3.3 Confirm (as part of §8's Cloudflare verification, not locally) that `/opengraph-image` is served correctly once the static-assets cache (§6.4) is populated — this is where the real fix lives, not in this file

## 4. Split root layouts: admin gets its own, no marketing chrome

- [x] 4.1 Move `app/layout.tsx` → `app/(marketing)/layout.tsx` and `app/page.tsx` → `app/(marketing)/page.tsx` (route group — public URL `/` is unchanged); confirm existing tests referencing these paths still pass
- [x] 4.2 Create `app/admin/layout.tsx` as an independent root layout (its own `<html>`/`<body>`) with no hero, chat widget, footer, or structured data — minimal chrome only
- [x] 4.3 Write a test asserting the admin area (rendered under its new layout) contains no hero section, chat trigger, or site footer
- [x] 4.4 Confirm `app/api/**`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, and `favicon.ico` are unaffected by the split (they don't render through a layout) — run their existing tests to confirm

## 5. Admin auth: cookie-session login

- [x] 5.1 Refactor `lib/admin/basicAuth.ts` → `lib/admin/credentials.ts`: keep `constantTimeEquals`, expose `verifyCredentials(user, pass, expected): boolean` directly; delete the Basic-Auth header-parsing/base64-decoding code; move/update `lib/admin/basicAuth.test.ts` → `lib/admin/credentials.test.ts` accordingly
- [x] 5.2 Write failing tests for `lib/admin/session.ts`: issuing a token, verifying a valid unexpired token, rejecting a tampered token, rejecting an expired token — using Web Crypto (`crypto.subtle`), not `node:crypto`
- [x] 5.3 Implement `lib/admin/session.ts` (HMAC-SHA256 sign/verify, `ADMIN_PASSWORD` as the signing key, issued-at + expiry embedded in the token)
- [x] 5.4 Move `app/admin/page.tsx` → `app/admin/(protected)/page.tsx` (dashboard content unchanged except reading `chapterIds` from the Section 2 site-config artifact instead of calling `getExperiences()`); add `app/admin/(protected)/layout.tsx` that reads the session cookie via `cookies()`, verifies it via `lib/admin/session.ts`, and `redirect("/admin/login")` when missing/invalid/expired; move the `robots: { index: false, follow: false }` metadata to the new page/layout location
- [x] 5.5 Add `app/admin/login/page.tsx` — a plain Server Component (no `"use client"`, no JS required) rendering a native `<form method="POST" action="/admin/login">` with username/password fields; declare the same non-indexable `robots` metadata
- [x] 5.6 Add `app/admin/login/route.ts` (POST) — reuse `checkRateLimit`/`createUpstashRateLimitStore` from `lib/chat/rateLimit.ts` (same limit/window as the old proxy: 30/5min per IP), parse form data, verify via `verifyCredentials`, on success set the signed session cookie (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/admin`, `Max-Age` matching the token expiry) and redirect (303) to `/admin`; on failure redirect back to `/admin/login` with an error indicator; on rate-limit exceeded, respond 429
- [x] 5.7 Write tests for the login route and the protected layout: no session → redirect to login; valid credentials → session cookie set + redirect to dashboard; invalid credentials → redirected back, no cookie set; tampered/expired cookie → redirect to login; rate limit exceeded → 429; rate-limit backend error → proceeds to credential check (fail-open)
- [x] 5.8 Delete `proxy.ts` (and update/delete any test specific to it)
- [x] 5.9 Confirm `app/robots.ts`'s existing `disallow: "/admin"` already covers `/admin/login` (standard robots.txt prefix semantics) — no change expected, just a verifying test/read
- [x] 5.10 Run `npx vitest run lib/admin/ app/admin/ lib/security/noClientSecrets.test.ts` and confirm green (the secret-scan test must stay green — the login page must not become a `"use client"` component that references `ADMIN_USER`/`ADMIN_PASSWORD`)

## 6. Dependency bump and Cloudflare tooling

- [x] 6.1 Bump `next` from `16.2.10` to the exact `16.2.11` in `package.json`; run `npm install`; run the full test suite + `npx tsc --noEmit` + `npm run build` to confirm the patch bump introduces no regressions
- [x] 6.2 Add `@opennextjs/cloudflare` and `wrangler` as dependencies
- [x] 6.3 Add `wrangler.jsonc` (compatibility date ≥ `2025-09-01`, `nodejs_compat` flag, `assets` binding at `.open-next/assets`)
- [x] 6.4 Add `open-next.config.ts` configuring the static-assets incremental cache (`incrementalCache: staticAssetsIncrementalCache`, `enableCacheInterception: true`) — required for genuinely static routes (`/`, `/opengraph-image`) to be served from build-time cache rather than re-executing at request time (see design.md Decision 5)
- [x] 6.5 Add `initOpenNextCloudflareForDev()` to `next.config.ts`
- [x] 6.6 Add a `preview` script to `package.json` (`opennextjs-cloudflare build && opennextjs-cloudflare preview`)

## 7. Full verification (standard gates)

- [x] 7.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 7.2 Run `npx tsc --noEmit` clean
- [x] 7.3 Run `npm run validate:content` clean
- [x] 7.4 Run `npm run lint` (note the pre-existing repo-wide ESLint config failure; skip with the same rationale as prior stories)
- [x] 7.5 Run `npm run build` (the standard Next build, independent of Cloudflare) and confirm it still succeeds

## 8. Cloudflare-specific verification (the real check — mirrors both spikes)

- [x] 8.1 Run `npx opennextjs-cloudflare build` and confirm it completes without the `Node.js middleware is not currently supported` error (i.e., `proxy.ts` is gone) and without needing to delete anything to make it pass
- [x] 8.2 Run `npx opennextjs-cloudflare preview` (which populates the static-assets cache automatically — a raw, unpopulated `wrangler dev` gives false negatives for genuinely static routes, see design.md Decision 5) and confirm: the landing page renders (`200`, served from cache); `POST /api/chat` streams a real token/citations/done sequence with no `fs.readFileSync` error; `GET /opengraph-image` returns a valid, correctly-rendered PNG (`200`, served from cache); `POST /api/events` succeeds against Neon (used a clearly-marked test session ID, deleted the test row afterward). Zero `fs.readFileSync` errors across the whole session (confirmed via log grep).
- [x] 8.3 Exercise the full admin flow against the same `preview` run with no `fs.readFileSync` error anywhere: `/admin` with no session redirects to `/admin/login` (307); the login page renders with zero marketing-chrome matches and the correct form action; submitting valid credentials sets the signed `HttpOnly`/`Secure`/`SameSite=strict`/`Path=/admin` session cookie and reaches the dashboard (real "Insights" content, `chapterIds` loaded via `loadSiteConfig()`, zero marketing-chrome matches); a tampered cookie value is rejected back to `/admin/login` (307)
- [x] 8.4 Record the verified Worker bundle size (gzip) somewhere durable (e.g. `README.md`'s existing "Performance budget" section or a new "Cloudflare deployment" section) alongside a note on which Workers plan (free vs paid) it fits, given the ~2.6 MB RAG index alone

## 9. OpenSpec sync

- [x] 9.1 After merge, sync `specs/admin-access-gate/spec.md` and `specs/cloudflare-deployment-compat/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
