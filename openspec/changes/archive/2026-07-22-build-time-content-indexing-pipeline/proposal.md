## Why

The JOS-61 spike proved the chunking → embedding → static-index pipeline works and selected GPT-5.4-mini + build-time static-file retrieval, but the pipeline is currently a manually-invoked script (`node lib/rag/embed.ts`), not part of the actual build. `lib/rag/index.json` can silently drift out of sync with `/content` the moment a chapter is edited and nobody remembers to re-run the script. Story 5.2b (retrieval-grounded answer generation) needs a retrieval index it can trust is current.

## What Changes

- Wire embedding-index generation into `npm run build` as a `prebuild` step, so the index is regenerated from current content every time the site builds — no separate manual step to forget.
- Load `.env.local` for the API key when present (local dev) via Node's `--env-file-if-exists`, falling back to the platform's real environment variables when it's absent (CI/Vercel) — no dev-only path assumption baked into the script itself.
- Add real unit test coverage for `buildEmbeddingIndex` (currently untested) using an injected fake embeddings client — verifies chunk metadata (source/chapterId/anchor) survives indexing and that a missing embedding in the API response fails loudly, without any real API call or cost.
- Document the new build-time requirement: `OPENAI_API_KEY` must be present wherever `next build` runs, including the Vercel project's build environment.

## Capabilities

### New Capabilities
- `content-indexing-pipeline`: build-time regeneration of the retrieval index from current `/content`, with chunk metadata required for later citation deep-links, and defined failure behavior when the required API key is absent.

### Modified Capabilities
(none — `llm-retrieval-decision` recorded the provider/retrieval *choice*; this change operationalizes it into the actual build, without changing that decision)

## Impact

- `package.json`: new `prebuild` script.
- `lib/rag/embed.ts`: no behavioral change to `buildEmbeddingIndex` itself; `main()`'s API-key-loading path is unaffected (already reads `process.env.OPENAI_API_KEY`) — only the invocation mechanism (npm lifecycle + env-file flag) changes.
- New `lib/rag/embed.test.ts`.
- Deployment: Vercel project's build environment needs `OPENAI_API_KEY` configured (a deployment-console change, not code — called out in tasks.md, cannot be completed by the agent).
