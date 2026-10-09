# Step 10 Report — Unit Tests and State Verification

- Date: 2026-10-06
- Change: disruptive-footer (JOS-191)
- Agent: Claude (opsx:apply)
- Branch: `feature/disruptive-footer` from `main` (ce9b83a)

## Commands Executed

- `npm test` (full Vitest suite)
- `npx vitest run lib/content/ lib/seo/` — content schema and SEO fixtures
- `npx vitest run lib/analytics/ components/admin/` — analytics targets, SQL constraint, admin labels
- `npx vitest run app/` — WhatsApp route, robots
- `npx vitest run components/palette.test.tsx` — raised-surface contrast
- `npx vitest run components/SiteFooter components/FooterIllustration components/SocialIcons components/accessibilityStructure components/focusVisibility components/oneScrollIndicator components/anchorClearance`
- `npx tsc --noEmit`
- `npm run validate:content`
- `npm run lint` — **could not run** (see Outcome)

## Unit Test Results

- Baseline on `main` before any change: **648 passed, 1 failed**. The failure is `components/ChatWidget.test.tsx` › "returns focus to the trigger after the panel closes". It fails deterministically on `main` and is unrelated to this change.
- Full suite after this change: **714 passed, 1 failed**. The one failure is the same pre-existing `ChatWidget` test. Net: +66 passing tests, no new failures.
- Targeted suites: all green (`lib/content` 92/92 incl. footer schema; `lib/analytics` + `components/admin` 63/63; `app/` 47/47; palette 26/26; footer, illustration and icon suites green).
- `npx tsc --noEmit`: clean (exit 0).
- `npm run validate:content`: passes (exit 0) against the new `footer` block.
- `npm run lint`: **blocked, pre-existing.** The `lint` script runs `eslint`, but `main` has no ESLint config file (`eslint.config.*` is absent on `main`). This change does not add one. Lint was not run and is not reported as passing.

## Database State Verification

- Pre-test baseline: no database access. Unit tests use fakes: the WhatsApp route test mocks `createUpstashRateLimitStore`; the analytics store is not constructed by any new test (checked by grep).
- Post-test validation: no persistent state changed by the test runs.
- State restored: N/A (nothing written).
- **Live database not touched.** `.env.local` holds a live `DATABASE_URL` and live Upstash credentials. The owner-run migration `lib/analytics/migrations/2026-10-disruptive-footer-contact-targets.sql` has **not** been applied.

## Outcome

- Step 10 status: **PASS for tests and types; lint BLOCKED (pre-existing config gap); live state check N/A.**
- Blocking issues:
  1. `npm run lint` cannot run: no ESLint config on `main`. Needs a separate fix.
  2. The pre-existing `ChatWidget` focus test fails on `main`. Out of scope for this change.
  3. Until the owner applies the contact-target migration, `github`/`whatsapp` contact clicks will be rejected by the live database's `CHECK` constraint.

## 2026-10-08 follow-up re-run

Re-ran the full suite as more of Task Group 6/7's reveal/illustration work
landed since this report was first written:

- `npm test`: **714 passed, 2 failed** — the pre-existing `ChatWidget`
  failure, plus a new one: `SiteFooter.reveal.test.tsx` › "animates the
  headline to fully visible once revealed", `Expected: "1", Received:
  "0.993..."`.
- **Root cause, not flakiness**: the test's `waitFor()` used its default
  1000ms timeout, but `SectionReveal`'s animation duration
  (`components/motionPace.ts`'s `pace.duration`) is 1.4s — the assertion
  was checking before the animation could possibly finish. Re-running in
  isolation reproduced the same ~0.99 value every time, confirming it was
  deterministic, not a timing race.
- **Fixed**: `components/SiteFooter.reveal.test.tsx` now passes `{
  timeout: 2000 }` to `waitFor()`. Re-ran: **715 passed, 1 failed** (only
  the pre-existing `ChatWidget` failure remains).
- `npx tsc --noEmit`: clean. `npm run validate:content`: clean.
  `npm run lint`: still blocked, same pre-existing missing-config reason
  (confirmed `eslint.config.*` is absent on `main`'s git history too, not
  just the working tree).
- Net vs. the 0.3 baseline (648 passed, 1 pre-existing failure): **+67
  passing tests, 0 new failures** after the fix.
