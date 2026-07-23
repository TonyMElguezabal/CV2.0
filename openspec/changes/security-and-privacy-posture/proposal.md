## Why

The site is public with a public AI endpoint, so PRD §9 sets a security & privacy bar: the LLM key stays server-side, the endpoint validates input, responses carry CSP headers, the footer discloses first-party analytics, and the database holds only anonymized data with chat never persisted. A codebase audit shows **four of the five controls already ship** from Epics 5 & 7 — the only missing control is CSP/security **headers** (`next.config.ts` is empty). This story (8.4, JOS-77) is therefore a thin build (the headers) plus a **verification-and-regression-guard pass** that turns the already-true controls into asserted, testable guarantees so they can't silently regress.

## What Changes

- **CSP + security headers (AC3 — the one real build):** add a `headers()` config in `next.config.ts` applying, to all routes, a pragmatic **static-preserving** Content-Security-Policy plus hardening headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security`). The policy locks down `default-src`/`object-src`/`base-uri`/`form-action`/`frame-ancestors`/`connect-src` while allowing `'unsafe-inline'` for scripts (Next's static hydration) and styles (framer-motion inline styles) — the owner-chosen approach that keeps pages statically generated (protecting the 8.1 perf budget) and incidentally covers 8.3's inline JSON-LD.
- **Key-confidentiality regression guard (AC1):** add a test that scans every `"use client"` file for references to secret env names (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `UPSTASH_REDIS_*`) and asserts none appear — locking in the already-true "keys are server-side only" property against future leaks.
- **Chat-not-persisted guarantee (AC5):** assert that the chat path writes no message text to any store (it streams only; `question_asked` records a count, never content) — a durable privacy guarantee.
- **Verification of the already-shipped controls (AC2, AC4, AC5-analytics):** input validation (Zod on `/api/chat` from 5.3 and `/api/events` from 7.3), the footer privacy disclosure (Epic 7 `SiteFooter`), and the anonymized analytics schema (7.3 `schema.ts` — no content/PII columns) are already implemented and tested; this story references those tests and consolidates a short **security & privacy attestation** in the docs rather than re-implementing them.
- **Out of scope:** a strict nonce-based CSP (evaluated and declined — it forces dynamic rendering, conflicting with the static-first perf budget; recorded as a design decision/trade-off); the Lighthouse/perf gate (8.1); SEO (8.3); accessibility (8.2). No new endpoints, no new validation logic, no schema changes.

## Capabilities

### New Capabilities
- `security-and-privacy-posture`: the site-wide security & privacy guarantees not owned by any feature capability — secrets are server-side only, every response carries a CSP and hardening headers, and chat conversations are never persisted server-side.

### Modified Capabilities
_None._ The verification-only ACs map to **existing** capabilities and are not re-spec'd: input validation lives in the chat/events capabilities (`streamed-chat-answers` / `chat-guardrails-and-cost-controls` / `analytics-event-store`), the footer disclosure in `cookieless-analytics-baseline`, and the analytics no-PII schema in `analytics-event-store`. This story asserts the net-new guarantees and verifies the rest against those specs' tests.

## Impact

- **New files:** `lib/security/config.ts` (or inline in `next.config.ts`) exporting the CSP + headers list as a testable value; `lib/security/headers.test.ts` (asserts the CSP directives + hardening headers); `lib/security/noClientSecrets.test.ts` (scans `"use client"` files for secret env names); a chat-not-persisted assertion in `app/api/chat/route.test.ts` (or a dedicated test).
- **Modified files:** `next.config.ts` (add `headers()`); `README.md` and/or `docs/` (a "Security & privacy" attestation section summarizing all five controls + the CSP rationale/limitations); no component or endpoint logic changes.
- **No new dependencies, no new env vars, no database or endpoint changes.** `Strict-Transport-Security` is also provided by Vercel at the edge for custom domains; setting it here is harmless and explicit.
- **Cross-story note:** the CSP is designed to accommodate 8.3's inline JSON-LD (`script-src 'unsafe-inline'`) and 8.1's framer-motion inline styles (`style-src 'unsafe-inline'`), whether or not those are merged first — so 8.4 is not hard-blocked by them, but the policy is validated against both.
