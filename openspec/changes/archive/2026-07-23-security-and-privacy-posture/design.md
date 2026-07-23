## Context

A codebase audit (2026-07-23) shows 8.4's controls are largely already in place after Epics 5 & 7:

| AC | Status | Evidence |
|---|---|---|
| AC1 key server-side | ✅ done | `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`DATABASE_URL`/`UPSTASH_*` read only in `app/api/chat/route.ts`, `lib/analytics/store.ts`, and node scripts — no `"use client"` file references them; no `NEXT_PUBLIC_` secret exists |
| AC2 input validation | ✅ done | Zod on `/api/chat` (5.3, question 1–500) and `/api/events` (7.3, `EventPayloadSchema`), with tests |
| AC3 CSP headers | ❌ **missing** | `next.config.ts` is empty — no `headers()`, no CSP, no hardening headers |
| AC4 footer privacy note | ✅ done | `SiteFooter` (Epic 7) discloses cookieless first-party analytics + 180-day retention; SSR-tested |
| AC5 anonymized DB / no chat persistence | ✅ done | `analytics-event-store` schema has no content/PII columns (7.3, tested); chat route streams and persists nothing |

So the build is **CSP + hardening headers**; the rest is verification turned into regression guards. There is no middleware today, and the owner chose a **pragmatic, static-preserving** CSP over a strict nonce-based one.

## Goals / Non-Goals

**Goals:**
- Ship a meaningful CSP + hardening headers on every response (AC3) **without** giving up static generation.
- Convert the already-true controls (AC1, AC5) into asserted, regression-proof tests.
- Consolidate all five controls into one written security & privacy attestation.

**Non-Goals:**
- A strict nonce-based CSP (declined — see Decision 2's trade-off).
- Re-implementing input validation, the footer, or the analytics schema (already shipped/tested — verify, don't rebuild).
- Perf (8.1), SEO (8.3), a11y (8.2).

## Decisions

### 1. CSP + hardening headers as a static policy in `next.config.ts` `headers()`
Set the headers via Next's `async headers()` (an HTTP-response mechanism that works on statically-generated pages — no dynamic rendering needed). Export the policy from `lib/security/config.ts` as a plain value so it's unit-testable, and reference it from `next.config.ts`. Applied to all routes (`source: "/:path*"`). The policy:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

Plus: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (belt-and-suspenders with `frame-ancestors 'none'`), `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- `connect-src 'self'` covers the same-origin analytics beacon (`/api/events`) and chat fetch (`/api/chat`) — no third-party origins exist.
- `img-src`/`font-src` allow `data:` for any inlined asset (and the same-origin `next/og` OG image is `'self'`).

### 2. `'unsafe-inline'` for script/style is the deliberate, owner-approved trade-off
A static Next.js page contains inline hydration/streaming `<script>` tags with no nonce (nonces require per-request uniqueness → dynamic rendering), and framer-motion sets inline `style` attributes (which nonces don't cover anyway). So a static CSP must allow `'unsafe-inline'` for `script-src` and `style-src`. This weakens XSS defense-in-depth, accepted because: no third-party scripts load; all dynamic data (chat stream, citations) is rendered by React as **text**, not HTML; and the only inline script we author (8.3's JSON-LD) is our own validated content. The strict alternative (middleware + per-request nonce + `force-dynamic`) was declined by the owner: it sacrifices static generation and the 8.1 perf budget for a marginal gain given this threat model. Recorded here so the posture is a conscious choice, not an oversight.
- *Consequence for 8.3:* the inline JSON-LD needs no nonce under this policy — resolves the cross-story flag raised in the SEO change's design.
- *Consequence for 8.1:* framer-motion's inline styles remain allowed whether it's imported eagerly or lazy-loaded — the policy is stable across that refactor.

### 3. Key confidentiality as a scanning regression test (AC1)
Rather than only asserting "it's true today," add `lib/security/noClientSecrets.test.ts` that walks the source tree, selects files beginning with `"use client"`, and asserts none reference any secret env name. This catches a future leak (e.g. someone reading `process.env.OPENAI_API_KEY` in a client component) at test time. The current server-only reads (`route.ts`, `store.ts`, node scripts) are unaffected.

### 4. Chat-not-persisted as an explicit assertion (AC5)
The chat route streams tokens and writes to no store; `question_asked` analytics records a count with no text (7.3 schema has no content field). Add an assertion (in the chat route test or a dedicated test) that exercising the chat path performs no store write of message content — encoding the privacy guarantee so a future "log the conversation" change fails the test. The analytics no-PII column rule stays owned by `analytics-event-store`'s existing test.

### 5. Verify-don't-duplicate for AC2 / AC4 / analytics-AC5
Input validation, the footer disclosure, and the anonymized schema are already spec'd and tested under their owning capabilities. This story does not add duplicate requirements or code; tasks reference the existing tests as the verification, and a `README`/docs "Security & privacy" section attests to all five controls in one place (the human-readable audit surface AC5's "when audited" implies).

## Risks / Trade-offs

- **[Risk]** `'unsafe-inline'` scripts weaken CSP's XSS protection. → **Mitigation:** documented threat model (no third-party JS, all dynamic data rendered as text); the CSP still blocks base-tag hijacking, framing/clickjacking, form exfiltration to other origins, plugin/object embedding, and non-self connect/img/font origins. A strict nonce upgrade remains possible later if the app adds dynamic rendering for other reasons.
- **[Risk]** An over-tight `connect-src`/`img-src` could break a future third-party integration. → **Mitigation:** the policy is a single testable value in `lib/security/config.ts`; adding an origin is a one-line, reviewed change with the header test guarding the shape.
- **[Risk]** `headers()` from `next.config.ts` applies to page routes but Vercel may layer its own headers. → **Mitigation:** verify the emitted headers on a running server (dev + note to re-check on the deployed site); HSTS in particular is also set by Vercel for custom domains (harmless duplication).
- **[Trade-off]** Treating AC2/AC4/analytics-AC5 as verification rather than new requirements keeps the spec non-duplicative but means this change's spec is smaller than the ticket's five ACs suggest — intentional, and called out in the proposal.

## Migration Plan

Implement per `tasks.md` → `npm test` (header shape, no-client-secrets scan, chat-not-persisted) / `tsc` / `validate:content` clean → start the dev server and `curl -I` a page to confirm the CSP + hardening headers are emitted → write the docs attestation → merge. Post-deploy, re-check the headers on the live URL (and confirm the CSP doesn't break the JSON-LD/OG/motion once 8.3/8.1 land). Rollback is a plain revert of `next.config.ts`; no data or interface changes.

## Open Questions

- None blocking. CSP strictness is resolved (Decision 2, owner-approved). The live-header re-check is a post-deploy owner step once a domain is attached.
