# Step 8 — Unit Test and State Verification

**Change:** arrival-sequence (JOS-112)
**Branch:** `feature/arrival-sequence`
**Date:** 2026-08-15

## 8.1 Targeted tests for changed modules

```
npx vitest run components/arrivalSequence.test.tsx components/ArrivalSequenceProvider.test.tsx \
  components/ArrivalSequenceProvider.ssr.test.tsx components/HeroFramer.test.tsx \
  components/HeroLaptop.test.tsx components/HeroCtas.test.tsx components/AmbientSparkleLayer.test.tsx \
  components/accessibilityStructure.test.tsx components/focusVisibility.test.tsx
```
Result: all files passed.

## 8.2 Full suite: `npx vitest run --no-file-parallelism`

First run: one failure in the untouched `components/ChatWidget.test.tsx`
(focus-return-on-close `waitFor` timing) — the same pre-existing CPU-
contention flake documented in prior tickets' Step 7/8 reports this
session. Confirmed unrelated: `ChatWidget.tsx`/`ChatWidget.test.tsx` are
not touched by this change, and `npx vitest run components/ChatWidget.test.tsx`
in isolation passes 8/8. A clean re-run of the full suite passed
**537/537**.

## 8.3 `npx tsc --noEmit`

Clean — no output, exit 0.

## 8.4 `npm run validate:content`

Clean — no output, exit 0. This ticket makes no `/content` changes.

## 8.5 `npm run lint`

Fails with the same pre-existing repo-wide gap documented in every prior
ticket this session: no `eslint.config.js` exists (ESLint 9 requires flat
config; the repo has none). Not caused by this change.

## 8.6 Database state verification

**N/A** — no backend/database in this repo (CLAUDE.md §9).

## Summary

| Check | Result |
|---|---|
| Targeted tests | ✓ pass |
| Full suite (serialized) | ✓ 537/537 pass |
| `tsc --noEmit` | ✓ clean |
| `validate:content` | ✓ clean |
| `lint` | pre-existing config gap, not a regression |
| DB state | N/A — no backend |
