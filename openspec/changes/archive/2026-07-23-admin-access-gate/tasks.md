## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-88-74a-admin-dashboard-owner-only-access-gate` (Linear-provided branch name for JOS-88) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: this is the first auth surface in the repo,
but there is still no local database in `npm test`. The security-critical
logic (credential verification, fail-closed, constant-time) lives in a PURE
helper (`lib/admin/basicAuth.ts`) that is fully unit-tested with no network.
The middleware itself is a thin wrapper; its request→allow/deny decision is
exercised via the pure helper's tests plus a dev-server curl gate (no
credential → 401, valid → 200). Reuses the existing Upstash limiter (fake in
tests, fail-open live). Applicable gates: TDD on the verifier, `npx vitest
run`, `npx tsc --noEmit`, `npm run validate:content`, `npm run lint` (broken
repo-wide, same skip), `next build` (middleware compiles, public routes stay
static), and the curl gate. "OpenAPI documentation" is N/A (no JSON endpoint).
-->

## 1. Credential verifier (pure, constant-time — the security core) (TDD)

- [x] 1.1 Write failing tests in `lib/admin/basicAuth.test.ts`: `verifyBasicAuth(authHeader, { user, pass })` returns `true` for a correct `Authorization: Basic base64(user:pass)` header; `false` for wrong password, wrong user, missing header, non-Basic scheme, malformed base64, and missing `:`; returns `false` (fail closed) when the configured `user` or `pass` is empty/undefined; and the comparison is constant-time (a byte-fold over the max length, not `===`)
- [x] 1.2 Implement `lib/admin/basicAuth.ts`: parse the Basic header, base64-decode `user:pass`, and compare each field against the expected value with a runtime-agnostic constant-time compare (`TextEncoder` + XOR fold, no `node:crypto`); return `false` if either expected value is empty
- [x] 1.3 Run `npx vitest run lib/admin/basicAuth.test.ts` and confirm all cases pass

## 2. Path-scoped Basic-Auth middleware (AC1, AC2)

- [x] 2.1 Implement `proxy.ts` (Next 16.2.10 deprecated `middleware.ts`/`export function middleware` in favor of `proxy.ts`/`export function proxy` — build warns otherwise; **bonus:** Proxy always runs on Node.js, which also resolved an Edge-runtime incompatibility warning from the reused Upstash rate limiter) with `export const config = { matcher: ["/admin/:path*"] }`: read `x-forwarded-for` and call `checkRateLimit(createUpstashRateLimitStore(), \`admin:${ip}\`, LIMIT, WINDOW)` — on not-allowed return `429`; then read the `Authorization` header and call `verifyBasicAuth(...)` against `process.env.ADMIN_USER`/`ADMIN_PASSWORD` — on `false` return `401` with `WWW-Authenticate: Basic realm="Admin"`; on `true` return `NextResponse.next()`
- [x] 2.2 Add placeholder `ADMIN_USER` / `ADMIN_PASSWORD` to `.env.local` (gitignored) with a comment that the real values are set here (local) and in the Vercel project env, and that leaving them unset fails the gate closed (admin inaccessible)

## 3. Protected dashboard shell + robots exclusion (AC2, indexing)

- [x] 3.1 Implement `app/admin/page.tsx` (server component, `export const runtime = "nodejs"`, `export const metadata = { robots: { index: false, follow: false } }`): a minimal "Insights" heading + a "Reports coming soon (7.4b)" placeholder, styled consistently with the site (reuse existing section/heading classes). **Deviation from the task's literal path:** the presentational content lives in `components/AdminDashboardShell.tsx` (+ `AdminDashboardShellStyles.ts`) tested via `components/AdminDashboardShell.ssr.test.tsx`, matching this repo's established convention that `page.tsx` files are thin, untested wrappers and testable content lives in `components/` — `app/**/*.test.tsx` isn't in the vitest include globs (only `app/**/*.test.ts`), so a page-level `.test.tsx` wasn't the right fit anyway
- [x] 3.2 Update `app/robots.ts` to add a `disallow: "/admin"` rule (keep the existing allow-all for the rest); update `app/robots.test.ts` to assert `/admin` is disallowed
- [x] 3.3 Run `npx vitest run components/AdminDashboardShell.ssr.test.tsx app/robots.test.ts` and confirm all cases pass

## 4. Secret-hygiene + docs

- [x] 4.1 Extend `lib/security/noClientSecrets.test.ts`'s scanned secret names to include `ADMIN_USER` and `ADMIN_PASSWORD`, so a future accidental client-side reference fails the test; run it and confirm it still passes against the current tree
- [x] 4.2 Update `docs/data-model.md` §4 ("Owner access without a users table"): record the resolved mechanism — HTTP Basic Auth via a path-scoped `proxy.ts`, credential in env, no database entities
- [x] 4.3 Update `README.md`: add an "Admin access" note (the `/admin` gate, `ADMIN_USER`/`ADMIN_PASSWORD` env vars set locally + in Vercel, fail-closed behavior, `noindex`, and that Basic Auth sets no cookie so the public cookieless promise is unaffected)

## 5. Full verification (agent executes all of this itself)

- [x] 5.1 Run `npx vitest run` (full suite) and confirm no regressions — 282/282 pass. (One `ChatWidget.test.tsx` case showed intermittent flakiness under full-suite parallel execution on an earlier run but passes reliably in isolation; confirmed zero changes to any chat-related file this session — pre-existing, out of scope for this change)
- [x] 5.2 Run `npx tsc --noEmit` clean
- [x] 5.3 Run `npm run validate:content` clean
- [x] 5.4 Run `npm run lint` — same pre-existing repo-wide failure (missing `eslint.config.mjs`); skipped with the same rationale
- [x] 5.5 Ran `next build --webpack`: clean build, no warnings (confirmed `proxy.ts` compiles with no deprecation warning and no Edge-runtime incompatibility warning — the initial build with `middleware.ts` showed both, resolved by the rename per Decision 1). Public routes (`/`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`) remain `○ Static`; `/admin` is separately gated via the `ƒ Proxy (Middleware)` layer — the matcher did not pull public pages into dynamic rendering
- [x] 5.6 Started the dev server with the placeholder credentials from `.env.local` and confirmed via curl: no credential → `401` with `WWW-Authenticate: Basic realm="Admin"` (and all 8.4 CSP/hardening headers still present, confirming `proxy.ts` and `next.config.ts`'s `headers()` compose correctly); wrong password → `401`; wrong user → `401`; correct credential (`-u owner:change-me-locally`) → `200` serving the real shell HTML (`<h1>Insights</h1>`, "Reports coming soon (7.4b)", `<meta name="robots" content="noindex, nofollow">`); public route `/` → `200` with no auth challenge; `/robots.txt` → `Disallow: /admin` confirmed. The unset-credentials fail-closed case is covered by 3 dedicated unit tests in `basicAuth.test.ts` (didn't restart the server without credentials to duplicate that check live)
- [x] 5.7 Stopped the dev server; confirmed no stray processes left running

## 6. OpenSpec sync

- [x] 6.1 After merge, sync `specs/admin-access-gate/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
