# Step 9 Report - Unit Tests and Corpus/Index Verification

- Date: 2026-07-30
- Change: chatbot-corpus-coverage
- Agent: Claude Code

This repo has no database — see the adaptation note at the top of `tasks.md`.
"Database state" is mapped to the generated retrieval corpus
(`getContentChunks()` output) and `lib/rag/index.json`, per that note.

## Commands Executed

- `npx vitest run lib/content lib/rag components/SkillsSection.test.tsx components/SkillsSection.ssr.test.tsx components/ChatWidget.ssr.test.tsx components/ChatWidget.test.tsx` (targeted)
- `npm test` (full suite, run twice)
- `npm run validate:content`
- `npx tsc --noEmit`
- `md5sum lib/rag/index.json` (before and after the full run)
- `git stash -u` / `npm test` / `git stash pop` (baseline comparison — see Notes)

## Unit Test Results

- Targeted tests (content + rag + affected components): **120 passed, 0 failed** (19 files)
- Full suite: **362 passed, 1 failed** (out of 363), run twice with the identical failure both times
- Runtime: ~4.2s for the full suite
- Notes: the 1 failure (`components/ChatWidget.test.tsx:99`, a `waitFor` focus-return-after-close
  timing assertion) passes reliably in isolation (8/8) and is **not caused by this change** — see
  Baseline Verification below.

## Baseline Verification (flake, not regression)

To confirm the `ChatWidget.test.tsx` failure pre-dates this change, all tracked and untracked
changes were stashed (`git stash -u`) to restore the exact original branch state, and `npm test`
was run again before restoring the stash (`git stash pop`):

- **Original branch state**: `npm test` → same failure, same line (`ChatWidget.test.tsx:99`),
  336 passed / 1 failed (out of 337 — the smaller pre-change test count, as expected)
- **This change's state**: same failure, same line, 362 passed / 1 failed (out of 363)

The failure is a pre-existing test-isolation/timing flake under full-suite parallel load,
unrelated to this change. All changes were confirmed fully restored after the stash round-trip
(`git status --short` matched the pre-stash working tree).

## Corpus / Index State Verification

- Pre-test baseline (captured before any Group 9 test run):
  - `lib/rag/index.json` MD5: `f6e605da586f4838a0bcff43ce9f968c`
  - Corpus (post Groups 1-8, pre Group 9 tests): 86 chunks
- Post-test validation:
  - `lib/rag/index.json` MD5: `f6e605da586f4838a0bcff43ce9f968c` (unchanged — no test wrote to it)
  - `git status --short content/ lib/rag/index.json`: only this change's own Group 5 authoring
    edits (`content/faq.md`, `content/skills.yaml` modified; `content/meta.md` new) — no
    unexpected mutation from running tests
  - Corpus after full suite run: 86 chunks, `{"profile":1,"experience":62,"skill":9,"project":2,"faq":9,"meta":3}`
- State restored: N/A — no unintended mutation occurred, so nothing needed restoring
- Restoration actions: none required

## Outcome

- Step 9 status: **PASS**
- Blocking issues: none. The one full-suite failure is a documented pre-existing flake, not a
  regression from this change (see Baseline Verification).
