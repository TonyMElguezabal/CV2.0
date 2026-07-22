## Context

JOS-61's spike built the chunking → embedding → static-index pipeline and proved it against real content (66 chunks), but as manually-invoked scripts (`node lib/rag/embed.ts`, run by hand with `--env-file=.env.local`). This story is the first slice of the split JOS-63 ([5.2a] per the 2026-07-20 grooming), turning that prototype into a real build-time step per PRD §7/§8.

The user was asked directly (via AskUserQuestion) whether `npm run build` should require `OPENAI_API_KEY` and regenerate the index on every build, versus keeping the build key-free with a separate manual/CI-only regeneration step. After walking through the trade-off — a separate step either requires committing the generated index (staleness risk if forgotten) or a Vercel-only build-command override (still needs the key somewhere, just hides that from local builds) — the user chose to wire regeneration directly into `npm run build`.

## Goals / Non-Goals

**Goals:**
- Regenerate `lib/rag/index.json` automatically every time `next build` runs, from current `/content` — no manual step to forget.
- Keep local dev (`npm run dev`, `npx vitest`, `npx tsc --noEmit`, `npm run validate:content`) unaffected — only `npm run build` gains the new dependency.
- Fail loudly, not silently, if `OPENAI_API_KEY` is absent when the build step runs — matching `validate:content`'s existing "block the build on a real problem" precedent.
- Add real, cost-free unit test coverage for `buildEmbeddingIndex`'s chunk→index transformation (metadata survival, failure on a missing embedding).

**Non-Goals:**
- Not adding content-change detection/hashing to skip regeneration when nothing changed — at 66 chunks and $0.02/MTok, a full re-embed costs a fraction of a cent per build; the added complexity of diffing isn't justified at this scale.
- Not configuring the actual Vercel project's build environment variables — that's a deployment-console action the site owner performs, not a code change (tracked as a task the agent cannot complete).
- Not building 5.2b's retrieval-grounded generation itself — this story only guarantees the index feeding it is fresh.

## Decisions

- **`prebuild` npm lifecycle script, not a custom build wrapper.** `npm run build` already triggers `prebuild` automatically (npm's standard pre/post hook convention) — no need to rewrite `"build": "next build"` into a manual chain. Keeps `next build` itself unchanged and directly invocable.
- **`node --env-file-if-exists=.env.local lib/rag/embed.ts`, not `--env-file` or a dotenv package.** `--env-file` (unlike `-if-exists`) errors when the file is missing, which would break every CI/Vercel build since `.env.local` is gitignored and never present there. `--env-file-if-exists` loads it locally (dev) and silently no-ops in CI/Vercel, where the platform injects `OPENAI_API_KEY` directly into `process.env`. No new dependency needed — Node 26 (this repo's runtime) supports the flag natively, matching the existing `validate:content` precedent of running `.ts` files directly via `node` without a transpiler.
- **No change to `buildEmbeddingIndex`'s signature or behavior.** It already accepts an injected `Pick<OpenAI, "embeddings">` client (from the JOS-61 spike), which is exactly what makes it unit-testable without a real API call — a fake client with a canned `.embeddings.create()` response is enough to verify metadata survival and the missing-embedding failure path.
- **Missing-key behavior stays a hard build failure** (`console.error` + `process.exit(1)`, already implemented in `embed.ts`'s `main()`) rather than a soft warning that lets the build continue with a stale or missing index — an out-of-date retrieval index would silently degrade every future chatbot answer's grounding, which is a worse failure mode than a loud build break.
- **Deployment note, not code:** the Vercel project's build environment must have `OPENAI_API_KEY` configured (Project Settings → Environment Variables) for production builds to succeed. This is called out explicitly in tasks.md as a step the site owner must perform themselves.

## Risks / Trade-offs

- [Risk] Every build now costs a small real amount and takes slightly longer (one batched embeddings API call for 66 chunks) → Mitigation: cost is ~$0.0003/build at `text-embedding-3-small` pricing (JOS-61 spike), and the call is a single batched request, not one per chunk — latency impact is minimal.
- [Risk] A build run without `OPENAI_API_KEY` configured (e.g., a contributor's first local build, or a misconfigured CI job) now fails where it previously succeeded → Mitigation: this is an intentional, documented trade-off from the user's own decision; the failure message is explicit (`"OPENAI_API_KEY is required to build the embedding index."`) rather than a cryptic downstream error.
- [Risk] Forgetting to configure the key in Vercel's build environment blocks the very first production deploy after this change merges → Mitigation: called out as an explicit, non-completable-by-agent task in tasks.md, surfaced to the site owner before archiving.
