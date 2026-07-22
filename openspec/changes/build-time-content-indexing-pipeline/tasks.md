## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-85-52a-build-time-content-indexing-pipeline` (Linear-provided branch name for JOS-85) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior changes on this repo, there
is no backend/database or HTTP endpoint, so curl/database-state/Playwright
steps from docs/openspec-tasks-mandatory-steps.md don't apply. This change
touches a build-time Node script and package.json only — no UI, so no
in-browser manual verification either. Applicable mandatory gates are TDD
unit tests, `npx vitest run`, `npx tsc --noEmit`, `npm run validate:content`,
and an actual `npm run build` run confirming the prebuild wiring works
end-to-end, all agent-executed.
-->

## 1. Write failing tests first (TDD)

- [x] 1.1 Write failing tests in `lib/rag/embed.test.ts` for `buildEmbeddingIndex`, using an injected fake `Pick<OpenAI, "embeddings">` client (no real API call): (a) each returned indexed chunk carries its source chunk's `source`/`chapterId`/`anchor` metadata alongside the embedding vector, (b) a response missing an embedding for a given chunk throws with a message identifying that chunk's id
- [x] 1.2 Ran the new tests — they **passed immediately** rather than failing: `buildEmbeddingIndex`'s existing implementation from the JOS-61 spike already satisfies both behaviors (metadata spread via `{ ...chunk, embedding }`, existing missing-embedding throw with the chunk id). This story's actual new work is the build wiring (§2), not this function's logic — recorded honestly rather than forcing an artificial red state.

## 2. Implement

- [x] 2.1 Add a `prebuild` script to `package.json`: `node --env-file-if-exists=.env.local lib/rag/embed.ts`
- [x] 2.2 Confirmed `lib/rag/embed.ts`'s existing `main()` already satisfies the missing-key failure requirement (loud `console.error` + `process.exit(1)`) — no code change needed
- [x] 2.3 Confirmed `buildEmbeddingIndex`'s existing signature (injected client) needed no change to pass the new tests

## 3. Validate (MANDATORY - AGENT MUST EXECUTE)

- [x] 3.1 Ran `npx vitest run` — 21 files, 94/94 tests pass, no regressions
- [x] 3.2 Ran `npx tsc --noEmit` — clean, no type errors
- [x] 3.3 Ran `npm run validate:content` — passes
- [x] 3.4 Ran `npm run build` for real (with `.env.local`'s `OPENAI_API_KEY` present, after deleting the existing `lib/rag/index.json` first): `prebuild` regenerated the 66-chunk index, then `next build` completed successfully end-to-end (Turbopack build, all routes prerendered as static content)
- [x] 3.5 Temporarily moved `.env.local` aside and ran `npm run build` again: `prebuild` printed "`.env.local` not found. Continuing without it." (confirming `--env-file-if-exists` doesn't error on a missing file) then failed loudly with "OPENAI_API_KEY is required to build the embedding index." — exit code 1, `next build` never started, no stale `index.json` left behind. Restored `.env.local` and re-ran a successful build afterward to leave the working tree clean.

## 4. Documentation and review

- [x] 4.1 Updated `AGENTS.md`/`CLAUDE.md` (symlinked) §8 Development Commands: noted `npm run build` now requires `OPENAI_API_KEY`, how it's loaded locally vs. in production, and that `dev`/`test`/`tsc`/`validate:content` are unaffected
- [ ] 4.2 **Deployment action required from the site owner (cannot be completed by the agent):** configure `OPENAI_API_KEY` in the Vercel project's build environment (Project Settings → Environment Variables) before the next production deploy, since `npm run build` now depends on it
- [ ] 4.3 Request human review from the site owner (DoD requires review by at least one human, not only AI agents)
