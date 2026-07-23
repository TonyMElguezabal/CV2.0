## Context

The app has no authentication surface at all: app routes are `/api/chat` and `/api/events`, both public; there is no `middleware.ts`, no auth dependency, no session concept (the only "session" is the cookieless per-tab analytics UUID, which is not identity). PRD §5 F9 requires the insights dashboard to be **owner-only**; PRD §8 says "the only auth is owner access to the admin dashboard"; data-model.md §4 ("Owner access without a users table") records the mechanism as an open question, resolved here. The owner chose **HTTP Basic Auth via a path-scoped middleware, credential in env** during enrichment (2026-07-23). Two prior stories set relevant precedent: 8.4 deliberately avoided middleware (to keep a static-preserving CSP) and enshrined "secrets server-side only" with `lib/security/noClientSecrets.test.ts`; `lib/chat/rateLimit.ts` provides a reusable per-key limiter.

## Goals / Non-Goals

**Goals:**
- Deny every non-owner and admit the authenticated owner to `/admin`, per the two ACs.
- The smallest correct gate: no users table, no dependency, no cookie on the public site — matching PRD §8's minimalism.
- Keep the public site's static rendering, static CSP, and cookieless privacy promise fully intact.

**Non-Goals:**
- Reports/queries/dashboard UI (7.4b).
- A login page, session cookie, logout, or MFA (the owner chose Basic Auth; the browser handles the credential prompt).
- Any visitor-facing auth or accounts (PRD §2/§8 exclude these).

## Decisions

### 1. Path-scoped `proxy.ts` (Next 16's renamed middleware) — and why this doesn't reopen 8.4's "no middleware" decision
`proxy.ts` (exporting `proxy`, per Next 16.2.10's rename of `middleware.ts`/`export function middleware` — the old name is deprecated and warns at build time) with `export const config = { matcher: ["/admin/:path*"] }`. It reads `Authorization: Basic <base64>`, decodes `user:pass`, and verifies against `ADMIN_USER`/`ADMIN_PASSWORD`. 8.4 avoided this layer specifically because a **site-wide nonce** CSP would force every page into dynamic rendering — that reasoning is about the *public* pages and a *nonce*. A matcher scoped to `/admin/:path*` never runs on the public static routes, so their static generation, the 8.1 perf budget, and 8.4's static CSP are all preserved. This is a targeted auth gate, not a site-wide interceptor.
- **Bonus discovered during implementation:** Proxy always runs on the Node.js runtime (Next enforces this — setting a `runtime` export in a proxy file is a build error), unlike the old middleware convention's default Edge runtime. This resolved a real build warning: `@upstash/redis` (used by the reused rate limiter) reads `process.version`, which the Edge runtime doesn't support. Using `proxy.ts` sidesteps that incompatibility entirely rather than requiring a different limiter.
- *Alternative considered:* a per-route guard inside `app/admin/layout.tsx` instead of a proxy/middleware file. Rejected — this layer blocks the request before any admin code runs (defense-in-depth), and a matcher keeps it off public routes just as cleanly.

### 2. Fail-closed on missing credentials
If `ADMIN_USER` or `ADMIN_PASSWORD` is empty/unset, the verifier returns `false` and the gate denies all access. A misconfigured deploy yields an inaccessible admin area, **never** an open one. This is the single most important safety property and is asserted directly in the verifier's tests.

### 3. Constant-time comparison in a pure, runtime-agnostic helper
The credential check lives in `lib/admin/basicAuth.ts` as a pure function `verifyBasicAuth(authHeader, expected)` returning a boolean, so it is unit-testable with no network and no Next runtime. It compares with a **constant-time** byte fold (XOR-accumulate over the max length, folding in a length difference) rather than `===`, avoiding a timing side-channel on the password. It is written in plain JS (`TextEncoder`/`atob` + XOR) with no `node:crypto` dependency — harmless now that Proxy is Node-only (Decision 1), but keeping it dependency-free costs nothing and keeps the helper trivially portable.
- *Rationale:* for a single-owner gate the timing risk is low, but constant-time is cheap and correct; keeping the helper pure is what makes the security-critical logic testable.

### 4. Per-IP throttling reusing the existing limiter
The proxy calls `checkRateLimit(createUpstashRateLimitStore(), \`admin:${ip}\`, LIMIT, WINDOW)` (per `x-forwarded-for`) before/around the auth check; on limit exceeded it returns `429`. This reuses `lib/chat/rateLimit.ts` verbatim — no new limiter code — and, like the chat/events endpoints, **fails open** if Upstash is unavailable (the credential remains the primary gate; throttling is defense-in-depth against brute force). A generous limit (owner hits `/admin` rarely) still defeats password-guessing.

### 5. The protected surface is a minimal, non-indexed shell
`app/admin/page.tsx` is a server component (`export const runtime = "nodejs"`) rendering an "Insights" heading + a "Reports coming soon" placeholder, with `export const metadata = { robots: { index: false, follow: false } }`. `app/robots.ts` additionally gains `disallow: "/admin"`. 7.4b replaces the placeholder body; the gate and shell are all this story ships. The admin page is dynamic and owner-only, so it is outside the public performance budget by design.

### 6. Privacy + secret-hygiene stay honest
Basic Auth sets **no cookie**, so the public "cookieless, no personal data" promise (footer, 8.2/8.4) remains literally true — worth stating in the README security note. The new `ADMIN_USER`/`ADMIN_PASSWORD` are secrets: they are added to `lib/security/noClientSecrets.test.ts`'s scanned names so any future client-side reference fails CI, extending 8.4's guarantee to cover them. `docs/data-model.md` §4 is updated to record the resolved mechanism (its own text requires updating the doc once the access mechanism is decided).

## Risks / Trade-offs

- **[Risk]** Basic Auth is single-factor and the browser caches the credential until the window closes (no clean logout). → **Mitigation:** accepted for a single-owner internal dashboard; HTTPS + HSTS (8.4) protect it in transit; rate limiting throttles guessing; a login-form + session-cookie upgrade (evaluated in enrichment) remains available later if richer UX is wanted.
- **[Risk]** A misconfiguration could leave the gate open. → **Mitigation:** fail-closed by construction (Decision 2), asserted in tests.
- **[Risk]** Middleware adds a per-request Upstash call on `/admin`. → **Mitigation:** `/admin` is owner-only and low-traffic; the limiter fails open, so an Upstash outage never locks the owner out.
- **[Trade-off]** No login page/logout/session. Accepted — it's the minimal correct gate the owner chose; 7.4a is deliberately the smallest thing that satisfies both ACs.

## Migration Plan

Implement per `tasks.md` (test-first on the pure verifier) → set placeholder `ADMIN_USER`/`ADMIN_PASSWORD` in `.env.local` → `npm test` / `tsc` / `validate:content` clean → `next build` (confirm `proxy.ts` compiles cleanly — no deprecation warning, no Edge-runtime incompatibility warning — and public routes stay static) → dev-server curl: no credential → 401, wrong → 401, correct → 200 shell; confirm `/robots.txt` disallows `/admin` → set real credentials in Vercel post-merge. Rollback is a plain revert of `proxy.ts` + the admin route; nothing else depends on it yet (7.4b is not built).

## Open Questions

- None blocking. The mechanism is owner-resolved (Basic Auth). Real production credentials are an owner deploy-time step (like `DATABASE_URL`/Upstash), not a code decision.
