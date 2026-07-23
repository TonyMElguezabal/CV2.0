## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-77-84-security-and-privacy-posture` (Linear-provided branch name for JOS-77) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: four of the five controls already ship
(Epics 5 & 7); the only build is CSP + hardening headers. No database, no
new endpoint, no new validation logic. Unit tests cover the header shape,
the no-client-secrets scan, and the chat-not-persisted guarantee (all pure
/ fs-scan, no network). The live emitted-headers check is a dev-server
`curl -I` plus a post-deploy owner re-check. AC2/AC4/analytics-AC5 are
verified against EXISTING tests, not re-implemented. Applicable gates: TDD
where new, `npx vitest run`, `npx tsc --noEmit`, `npm run validate:content`,
`npm run lint` (broken repo-wide, same skip), and the dev-server header
check, all agent-executed.
-->

## 1. CSP + hardening headers (AC3, TDD)

- [x] 1.1 Write failing tests in `lib/security/headers.test.ts`: the exported headers value contains a `Content-Security-Policy` whose directives include `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and `connect-src 'self'`; and includes `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, a `Permissions-Policy`, and a `Strict-Transport-Security` header
- [x] 1.2 Implement `lib/security/config.ts` exporting the CSP string + hardening headers as a testable value (see design.md Decision 1 for the exact policy — pragmatic static-preserving, `'unsafe-inline'` for script/style)
- [x] 1.3 Wire it into `next.config.ts` via `async headers()` applying the headers to `source: "/:path*"` — verified `next.config.ts` can import `lib/security/config.ts` at build time via `next build`
- [x] 1.4 Run `npx vitest run lib/security/headers.test.ts` and confirm all cases pass

## 2. Key-confidentiality regression guard (AC1, TDD)

- [x] 2.1 Write `lib/security/noClientSecrets.test.ts`: walk the source tree (`app/`, `components/`, `lib/`), select files whose first non-empty line is `"use client"`, and assert none reference `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, or `UPSTASH_REDIS_*`; also assert no `NEXT_PUBLIC_*` name contains a secret value pattern. Confirmed it passes against the current tree — the audit's claim that all secret reads are server-side holds
- [x] 2.2 Run `npx vitest run lib/security/noClientSecrets.test.ts` and confirm it passes

## 3. Chat-not-persisted guarantee (AC5, TDD)

- [x] 3.1 Added `app/api/chat/route.noPersistence.test.ts`: confirmed the chat route has **no persistence collaborator at all** today (only `createUpstashRateLimitStore`, a rate limiter, not a content store) — so the strongest, most honest guard is structural: assert the route source imports no database/analytics-store marker (`recordEvent`, `AnalyticsStore`, `@neondatabase/serverless`, `DATABASE_URL`, `INSERT INTO`, etc.), catching a future change that adds conversation persistence
- [x] 3.2 Run the chat test and confirm it passes

## 4. Verify the already-shipped controls (AC2, AC4, analytics-AC5)

- [x] 4.1 Confirmed the existing tests cover the verification ACs and run green (31/31): `app/api/chat/route.test.ts` + `app/api/events/route.test.ts` (input validation, AC2), `components/SiteFooter.ssr.test.tsx` (footer disclosure, AC4), `lib/analytics/schema.test.ts` "no field that accepts question or message text" (anonymized analytics, AC5). No new code — reference only

## 5. Documentation / attestation

- [x] 5.1 Added a "Security & privacy" section to `README.md` attesting to all five controls: (1) secrets server-side only, (2) endpoint input validation, (3) CSP + hardening headers with the pragmatic-`'unsafe-inline'` rationale + limitations, (4) footer disclosure, (5) anonymized analytics with no chat persistence; noted the post-deploy live-header re-check and that a strict nonce CSP was deliberately declined (static/perf trade-off, design.md Decision 2)

## 6. Full verification (agent executes all of this itself)

- [x] 6.1 Run `npx vitest run` (full suite) and confirm no regressions — 269 tests pass
- [x] 6.2 Run `npx tsc --noEmit` clean
- [x] 6.3 Run `npm run validate:content` clean
- [x] 6.4 Run `npm run lint` — same pre-existing repo-wide failure (missing `eslint.config.mjs`); skipped with the same rationale
- [x] 6.5 Started the dev server and confirmed via `curl` (both `/` and a `POST /api/chat`) that all six headers are present exactly as configured. Confirmed via claude-in-chrome the page renders correctly with no CSP violations in the console; explicitly verified the two `'unsafe-inline'`-dependent surfaces both still work — the chat panel opens with framer-motion's inline `style` attribute applied, and the JSON-LD `<script type="application/ld+json">` parses correctly (`@type: ProfilePage`). Live-domain header re-check remains a documented post-deploy owner follow-up
- [x] 6.6 Stopped the dev server; confirmed no stray processes left running

## 7. OpenSpec sync

- [ ] 7.1 After merge, sync `specs/security-and-privacy-posture/spec.md` into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
