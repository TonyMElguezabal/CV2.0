## Why

The chatbot ships changes to its prompt and content with no repeatable way to check for regressions — no adversarial coverage proving refusals still hold, no hallucination check on factual answers, no gate before merging a prompt/content change (PRD §7 quality bar, §12 hallucination risk). A partial harness exists from the JOS-61 spike and was extended ad hoc during 5.4's own verification, but it has no grading, isn't wired to a repeatable command, and doesn't cover all seven career chapters. With 5.4 (refusals/injection resistance) now merged, this eval set can finally serve as a genuine ship gate rather than landing ahead of the behavior it's meant to measure.

## What Changes

- Rename `lib/rag/eval-sample.ts` → `lib/rag/eval-set.ts` and expand it from 17 to ~32 questions: all 5 PRD §1 core questions (was 3), 10 factual questions covering all 7 experience chapters and both projects (was 3, oracle/envato/tcs-banamex only), 6 traps (was 4), 7 injection attempts (was 5), 4 professionally-plausible-but-uncovered questions (was 2). This is close to but not exactly the PRD's "~40" — real, content-grounded, non-redundant questions were prioritized over padding to hit an exact count; noted as extensible later if more coverage is wanted.
- Add `lib/rag/eval-grade.ts`: pure grading logic (no API calls) producing a pass/fail/manual verdict per question and an overall `shipReady` boolean, using a **heuristic**, not an LLM judge — factual questions are graded by expected/forbidden substring matching; trap/injection questions are graded by checking the answer contains the exact canonical refusal phrase already defined in `lib/rag/generate.ts` (reused, not duplicated), plus a system-prompt-leak check for injection cases; core/uncovered questions are always flagged for manual human review, since "answered well" is inherently qualitative.
- Wire `lib/rag/eval-run.ts` to call the grader and print a per-category summary plus the `shipReady` verdict; add an `eval:chat` npm script.
- Document the eval run as the required pre-merge gate for prompt/content changes in `README.md`'s existing "Chatbot operations" section (added by 5.3).
- **Live-run the expanded set against the real model** as part of this change (`OPENAI_API_KEY` is available) and report actual results — the same verification discipline 5.4 used, not just scaffolding.
- **Out of scope**: no production code changes — `generate.ts`, `route.ts`, `ChatWidget.tsx`, and `SYSTEM_PROMPT` are untouched. No LLM-as-judge grading (decided against — see design.md). No CI/`npm test` gating — the eval run makes live API calls and stays a manual, owner-executed procedure, consistent with this repo's no-live-network-calls-in-unit-tests convention.

## Capabilities

### New Capabilities
- `chatbot-eval-and-ship-gate`: the adversarial/factual/core eval set, its grading logic, and the repeatable run procedure used as a pre-merge gate for prompt/content changes.

### Modified Capabilities
_None._ No existing capability's requirements change — this adds a new, separate dev-tooling capability.

## Impact

- **Modified files**: `lib/rag/eval-run.ts` (call the grader, print summary, write a report file), `package.json` (`eval:chat` script), `README.md` (document the gate).
- **Renamed + expanded**: `lib/rag/eval-sample.ts` → `lib/rag/eval-set.ts`.
- **New files**: `lib/rag/eval-grade.ts`, `lib/rag/eval-set.test.ts`, `lib/rag/eval-grade.test.ts`.
- **No new dependencies, no HTTP surface change, no production code touched.**
