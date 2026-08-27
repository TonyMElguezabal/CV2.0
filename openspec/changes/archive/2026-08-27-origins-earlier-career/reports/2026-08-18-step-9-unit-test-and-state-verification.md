# Step 9 Report - Unit Tests and State Verification

- Date: 2026-08-18
- Change: origins-earlier-career
- Agent: Claude Code

## Commands Executed
- `npx vitest run lib/content/ lib/rag/eval-set.test.ts components/CareerTimeline.test.tsx components/oneScrollIndicator.test.tsx`
- `npx vitest run --no-file-parallelism` (run twice)
- `npx tsc --noEmit`
- `npm run validate:content`

## Unit Test Results
- Targeted: 93 passed, 0 failed, 8 files
- Full suite, first run: 569 passed, 1 failed (`ChatWidget.test.tsx`, a `waitFor`/focus timing assertion) — the same documented pre-existing CPU-contention flake seen across multiple prior sessions in this repo, unrelated to this change
- Full suite, second run: 570 passed, 0 failed — confirms the failure was flaky, not a regression
- Runtime: ~41-42s per full run

## Type/Content Checks
- `npx tsc --noEmit`: clean, no errors
- `npm run validate:content`: clean, exit 0

## Corrections Made Mid-Implementation

Three real gaps surfaced while implementing, each fixed and documented at the
point they were found (see the corresponding task entries for detail):

1. **`OriginsSchema` needed a top-level `period` field** (Task Group 5) —
   the timeline node's display meta had nowhere to come from otherwise;
   entry-level periods are free text and not aggregable.
2. **`OriginEntrySchema` needed an optional `phase` field** (Task Group 6) —
   the two-beat rendering structure needed a content-driven grouping
   signal rather than hardcoded ids or positional logic in the component.
3. **The origins record's overall span was unretrievable** (Task Group 7) —
   only per-entry periods were woven into chunk text; the top-level period
   was orphaned. Added a dedicated `origins-summary` chunk to carry it,
   which is also what made `factual-21` ("how long has he been in
   technology?") answerable at all.

None of these were caused by errors elsewhere in this change; they were
gaps in the original task list's field enumeration, surfaced by actually
building the feature end to end rather than assumed away.

## Database State Verification
- **N/A** — no backend/database in this repo (CLAUDE.md §9)

## Outcome
- Step 9 status: PASS
- Blocking issues: none
