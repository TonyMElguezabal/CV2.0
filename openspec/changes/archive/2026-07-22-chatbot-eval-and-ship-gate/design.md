## Context

`lib/rag/eval-sample.ts` (17 questions: 3 core, 3 factual, 4 trap, 5 injection, 2 uncovered) and `lib/rag/eval-run.ts` (runs the set against the live model, writes `lib/rag/eval-results.json`, gitignored) exist from the JOS-61 spike and were extended during 5.4's own verification. Neither has grading — a human has to eyeball `eval-results.json` to judge pass/fail, there's no npm script, and factual coverage is only 3 of 7 chapters. 5.4 (merged) already hardened the actual refusal/injection behavior: `SYSTEM_PROMPT` was tightened to the exact canonical refusal phrase, and a deterministic relevance-threshold guard now short-circuits clearly off-topic questions before the LLM is ever called. `generate.ts` exports `OFF_TOPIC_REFUSAL` and `SYSTEM_PROMPT` as constants — the exact strings this eval set's grading needs to check against.

5.4's live eval run (documented in its PR) showed every trap/injection answer either was or began with the exact `OFF_TOPIC_REFUSAL` string, whether the deterministic guard fired or the LLM produced it via the prompt. That's the empirical basis for choosing heuristic grading over an LLM judge (Decision 1).

## Goals / Non-Goals

**Goals:**
- Full-ish coverage per PRD §7: all 5 core questions, at least one factual per chapter/project (9 sources), meaningful trap/injection surface.
- A pass/fail verdict a human doesn't have to derive by reading raw JSON — `npm run eval:chat` prints a summary and a `shipReady` boolean.
- Zero added cost/non-determinism from grading itself — no second LLM call per question.
- Reuse `OFF_TOPIC_REFUSAL`/`SYSTEM_PROMPT` from `generate.ts` as the single source of truth for what the grader checks against — never a duplicated copy that could drift.

**Non-Goals:**
- Exactly ~40 questions — landed at ~32, real and content-grounded, not padded. Documented as extensible, not as a shortfall to silently ignore.
- LLM-as-judge grading — rejected (Decision 1).
- CI/`npm test` gating of the live eval — it costs real API calls; stays a manual, owner-executed procedure like 5.4's verification was.
- Grading "core questions answered well" automatically — inherently qualitative, stays a human-review category.

## Decisions

### 1. Heuristic grading, not LLM-as-judge
5.4's live run is the direct evidence: every trap/injection response either exactly matched or began with `OFF_TOPIC_REFUSAL`. A substring check against that one constant (imported from `generate.ts`, not duplicated) reliably grades the refusal behavior this ship gate cares about, with zero added API cost and full determinism. Factual grading is substring-based (expected present, forbidden absent) — the same style already sketched in the original `eval-sample.ts`'s `expectedSubstring` field, just extended to arrays and given a pass/fail verdict instead of a boolean the human still had to interpret.
- *Alternative considered:* LLM-as-judge (reuse `LlmProvider` with a grading rubric). Rejected — doubles API cost per eval run, introduces a second non-deterministic system that itself needs trust, and the empirical evidence from 5.4 shows the simpler heuristic already works for this content.

### 2. `eval-grade.ts` is pure and fully unit-testable — no live calls
`gradeResult(question, result)` and `summarizeGrades(results, questions)` take plain data in, return plain data out. No network, no file I/O. This is what makes `lib/rag/eval-grade.test.ts` possible with fixture `EvalRunResult` objects and no `OPENAI_API_KEY`, matching this repo's established fake-injection/no-live-calls testing convention (`generateGroundedAnswer`'s tests, `streamChat`'s tests, etc.).

### 3. Core and uncovered categories are always "manual," never auto-pass/fail
"Answered well" (core) and "gracefully declines without fabricating" (uncovered) are qualitative judgments a substring check can't reliably make — a technically-present keyword doesn't mean the answer is *good*. Rather than fake a pass/fail with a weak heuristic, `gradeResult` returns `status: "manual"` for these categories, and `shipReady` is computed only from factual+trap+injection (the categories where heuristic grading is trustworthy). The human reviewer's job is explicit and bounded: read the core/uncovered answers, not everything.
- *Alternative considered:* a word-count/keyword-presence heuristic for "answered well." Rejected — too weak to mean anything; a confidently wrong answer could still pass it.

### 4. `eval-set.ts` composition: ~32 questions, not padded to exactly 40
5 core (all of PRD §1, verbatim) + 10 factual (covering all 9 chapter/project sources, two chapters get a second fact where the content supports a clean, distinct, verifiable claim) + 6 trap + 7 injection + 4 uncovered. Every new factual question's `expectedSubstring` was checked against the actual content file before being written (not invented) — see tasks.md for the specific facts and their source files. Reaching exactly ~40 would mean either duplicating question intent (multiple trivial rephrasings of the same trap) or reaching into weaker, less certain claims — both worse than an honestly-smaller, fully-grounded set.

### 5. Report artifact, not just console output
`eval-run.ts` writes `lib/rag/eval-report.json` (gitignored, same pattern as `eval-results.json`) containing `summarizeGrades`'s output, alongside the existing raw results file. This lets a reviewer inspect the graded summary without re-running the (costly) live eval, and gives future story 5.6-adjacent work (or a future CI integration, if ever added) something structured to consume instead of console text.

## Risks / Trade-offs

- **[Risk]** A future prompt change could alter `OFF_TOPIC_REFUSAL`'s exact wording without updating the grader's expectations. → **Mitigation:** the grader imports the constant directly from `generate.ts` rather than hardcoding a copy — a wording change automatically flows through to what's graded as a "pass," which is the correct behavior (the ship gate should track the real prompt, not a frozen snapshot of it).
- **[Risk]** Heuristic substring matching for injection's system-prompt-leak check could have false negatives if the model paraphrases instead of quoting verbatim. → **Mitigation:** accepted — this is a defense-in-depth check on top of the primary refusal-phrase check, not the only signal; a paraphrased leak would still very likely fail to contain `OFF_TOPIC_REFUSAL` and would be caught by category grading regardless, or would be visible to the human reviewer who reads flagged failures.
- **[Trade-off]** ~32 questions instead of ~40 is a smaller-than-literal-AC1 set. Documented explicitly rather than silently under-delivering; extending further is cheap (same pattern, more questions) whenever the owner wants it.

## Migration Plan

No data migration, no new dependencies, no environment variables (reuses `OPENAI_API_KEY`, already present). Rollout: implement per `tasks.md` → `npm test`/`tsc --noEmit` clean → live-run `npm run eval:chat` against the real model, review the graded summary and any manual-category answers → merge. Rollback is a plain revert; purely additive dev tooling, no schema/state to unwind.

## Open Questions

None blocking. Question-set size (~32 vs ~40) and grading mechanism (heuristic vs LLM-judge) were both decided with the owner before this proposal.
