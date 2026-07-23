## Why

The analytics event store (7.3, JOS-72) ships anonymized visitor data, and the admin insights dashboard (PRD §5 F9) must surface it — but F9 is explicitly **owner-only** ("Access restricted to the site owner; no visitor-facing accounts or auth"). The site has **no auth of any kind** today: no middleware, no auth library, no `/admin` route, no session concept. This story (7.4a, JOS-88) builds the access gate — the first and only authentication surface in the app — and a protected empty dashboard shell that 7.4b (JOS-89) fills with reports. The owner has chosen the mechanism: **HTTP Basic Auth via a path-scoped middleware, credential in an env var** — the smallest correct gate, with no users table and no cookie on the public site (data-model.md §4; PRD §8 "the only auth is owner access").

## What Changes

- **A `/admin` access gate** via a new `proxy.ts` (Next 16's renamed `middleware.ts`) scoped to `matcher: ["/admin/:path*"]`: it reads the `Authorization: Basic` header, verifies the credential against env vars with a **constant-time comparison**, and — on missing/invalid credentials — responds `401` with `WWW-Authenticate: Basic realm="Admin"`; on valid credentials it passes through. The matcher means this layer **never touches the public static routes**, so 8.1's static-first budget and 8.4's static CSP are untouched. (Using `proxy.ts` also means it runs on the Node.js runtime, avoiding an Edge-runtime incompatibility in the reused rate limiter's `@upstash/redis` dependency.)
- **Fail-closed:** if the admin credential env vars are unset, the gate denies all access (the admin area is never accidentally public).
- **Brute-force throttling:** reuse the existing `checkRateLimit` + Upstash limiter (`lib/chat/rateLimit.ts`) to rate-limit `/admin` requests per IP, returning `429` when exceeded (fail-open on limiter outage, as elsewhere).
- **A protected dashboard shell** at `app/admin/page.tsx` (`runtime = "nodejs"`, `robots: { index: false }`) — a minimal "Insights" placeholder that 7.4b replaces with real reports.
- **Crawler exclusion:** `app/robots.ts` (from 8.3) gains a `disallow: /admin` rule.
- **Secret-leak guard extended:** add the admin credential names to `lib/security/noClientSecrets.test.ts`'s scan so a future accidental client-side reference fails the test (strengthening 8.4's existing guarantee for the new secret).
- **Docs:** record the resolved access mechanism in `docs/data-model.md` §4 (its own instructions require this) and add a README "Admin access" note.
- **Out of scope:** the reports, queries, and dashboard UI (7.4b, JOS-89 — this ships only the gate + empty shell); any visitor-facing auth (explicitly excluded by PRD §2/§8); a login page, session cookie, or logout (the owner chose Basic Auth — the browser handles the credential prompt/caching).

## Capabilities

### New Capabilities
- `admin-access-gate`: owner-only access control for the admin area — a Basic-Auth gate that denies non-owners and admits the authenticated owner to a protected dashboard surface, with no users table and no cookie on the public site.

### Modified Capabilities
_None._ This is a new owner-facing surface. It does not change `security-and-privacy-posture`'s requirements — the existing CSP/hardening headers already apply to `/admin` (via `next.config.ts`'s `/:path*` rule), and "secrets are server-side only" already covers the new admin credential (this change merely extends that guard's scan list to include the new names).

## Impact

- **New files:** `proxy.ts`; `lib/admin/basicAuth.ts` (+ test) — the pure, constant-time credential verifier; `app/admin/page.tsx` + `components/AdminDashboardShell.tsx` (+ SSR test) — the protected shell.
- **Modified files:** `app/robots.ts` (+ its test) — disallow `/admin`; `lib/security/noClientSecrets.test.ts` — add `ADMIN_USER`/`ADMIN_PASSWORD` to the scanned secret names; `.env.local` (placeholder credential); `README.md` (Admin access note); `docs/data-model.md` (§4 — resolved mechanism).
- **New environment variables:** `ADMIN_USER` + `ADMIN_PASSWORD`, server-side only (never `NEXT_PUBLIC`), local in `.env.local` (gitignored) + the Vercel project env. Without them the gate fails closed.
- **No new dependencies** (`next/server`'s proxy/middleware layer + the existing Upstash limiter), no database changes, no changes to the public site's behavior or bundle.
- **Unblocks 7.4b (JOS-89)**, which fills the shell this ships.
