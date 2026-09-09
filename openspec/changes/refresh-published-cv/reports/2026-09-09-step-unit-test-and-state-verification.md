# Unit Test and State Verification

- Date: 2026-09-09
- Change: refresh-published-cv (JOS-123)
- Agent: Claude Sonnet 5

This repo has no database; `/content` integrity (`validate:content`) and the
test suite are the equivalent state to verify.

## Commands Executed

- `npm run validate:content`
- `npx tsc --noEmit`
- `npm test` (full suite, run twice)
- `npx vitest run components/ChatWidget.test.tsx` (isolated, to characterize
  the one intermittent failure)

## Results

- `validate:content`: clean, no output, exit 0 — both before and after the
  content edits in this change (`content/profile.yaml`, `content/faq.md`)
- `npx tsc --noEmit`: clean
- Full suite, run A: **648/649 passed**, 1 failed —
  `ChatWidget.test.tsx > returns focus to the trigger after the panel closes`
- Full suite, run B: same result, same single test failing
- `ChatWidget.test.tsx` in isolation: **16/16 passed**, 3 consecutive runs

## Assessment

The failure is a pre-existing, timing-sensitive flake, not caused by this
change:
- It fails only under full-suite parallel load (recorded duration 1037ms for
  that one test vs. ~200ms isolated) and passes every isolated run.
- `ChatWidget.test.tsx` renders from hardcoded fixtures
  (`components/ChatWidget.test.tsx`) and never reads `/content` — this
  change's only content edits (`profile.yaml`'s `positioning`/terminal line,
  `faq.md`'s title reference) cannot affect it.
- The same flake was independently reproduced and characterized earlier in
  this session, before any content edit existed on this branch, confirming
  it predates this change.

No fix is in scope for this change; it is a candidate for its own ticket.

## Outcome

- Status: **PASS** (648/649, with the one failure identified as a known,
  pre-existing flake unrelated to this change's edits)
- Blocking issues: none
