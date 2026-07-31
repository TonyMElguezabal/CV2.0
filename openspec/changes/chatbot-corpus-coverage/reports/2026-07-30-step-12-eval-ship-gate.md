# Step 12 Report - Live Eval Ship Gate

- Date: 2026-07-30
- Change: chatbot-corpus-coverage
- Agent: Claude Code

## Command Executed

`npm run eval:chat` (= `node --experimental-strip-types --env-file-if-exists=.env.local lib/rag/eval-run.ts`),
run against the live model (`gpt-5.4-mini`) with the rebuilt 86-chunk index, three times total
across two fix iterations (see Iterations below).

## Final Graded Summary

```json
{
  "shipReady": true,
  "byStatus": { "pass": 26, "fail": 0, "manual": 9 },
  "byCategory": {
    "core": { "pass": 0, "fail": 0, "manual": 5 },
    "factual": { "pass": 13, "fail": 0, "manual": 0 },
    "trap": { "pass": 6, "fail": 0, "manual": 0 },
    "injection": { "pass": 7, "fail": 0, "manual": 0 },
    "uncovered": { "pass": 0, "fail": 0, "manual": 4 }
  },
  "failures": []
}
```

**Ship ready: YES.** All 13/13 factual, 6/6 trap, and 7/7 injection cases pass, including the
three new tooling/tenure/site-meta questions this change added (`factual-11`, `factual-12`,
`factual-13`).

## Iterations

**Run 1** (initial): 11 pass, 2 fail —
- `factual-8` (pre-existing question, unmodified by this change): missing `"two junior engineers"`.
- `factual-11` (this change's new tooling question): missing `"Datadog"`.

**Diagnosis:**
- `factual-11`'s question was worded "What AI tools or technologies did Jose use at work?" but
  expected `"Datadog"` — Datadog is an observability tool, not an AI tool. The model correctly
  and appropriately did not claim it was AI-related; this was a test-authoring mismatch on my
  part, not a retrieval or grounding failure. **Fix:** reworded the question to "What tools and
  technologies did Jose use at Envato/Placeit?" — directly testing technologies-chunk coverage
  without the AI-specific framing.
- `factual-8` predates this change (present in `eval-set.ts` before any edits in this branch,
  and `content/experience/envato.yaml`'s leadership text — "coached two junior backend
  developers" — is unchanged by this change). The eval expected the exact substring `"two junior
  engineers"`, but the real, more specific content says `"two junior backend developers"`. This
  is a pre-existing eval/content wording mismatch, out of this change's declared proposal scope.
  **Fix (in passing, flagged explicitly, zero risk):** corrected `expectedSubstrings` to match
  the real content's actual wording. No grounding, retrieval, or generation logic was touched —
  this is a one-line eval-assertion correction, made because the ship-gate DoD requires a green
  `shipReady` signal and the fix carries no risk to any in-scope requirement.

**Run 2** (after the `factual-11` fix): 12 pass, 1 fail (`factual-8` only) — confirmed the
`factual-11` fix resolved the corpus-coverage regression it was meant to catch.

**Run 3** (after the `factual-8` fix): 13 pass, 0 fail — `shipReady: true`.

## Retrieval-Dilution Check (task 12.4)

Neither failure was caused by retrieval dilution (the risk flagged in `design.md` — a tooling
question retrieving 5 chunks from one chapter and missing the meta/technologies source). Both
were eval-question/content wording mismatches, corrected without touching `k`, `RELEVANCE_THRESHOLD`,
or any retrieval logic. **No follow-up change for source-diversity retrieval is needed** from
this eval run.

## Core / Uncovered Manual Review (task 12.3)

All 5 core answers (`core-1`..`core-5`) are accurate, grounded in the corpus, third-person,
concise, and each offers to go deeper — no hallucinated facts, dates, or metrics detected against
`/content`. All 4 uncovered answers (`uncovered-1`..`uncovered-4`) correctly decline without
fabricating specifics and suggest better questions, per the graceful-refusal contract.

## Outcome

- Step 12 status: **PASS**
- Overall ship-readiness: **YES**
- Blocking issues: none.
