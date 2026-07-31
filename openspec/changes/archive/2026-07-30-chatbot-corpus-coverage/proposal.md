Linear-Issue: JOS-101

## Why

Visitors asking specific questions ("What AI tools does Jose use?", "When did he work at Envato?") get a correct-but-empty refusal, because the retrieval corpus does not contain the answer — not because the grounding contract is wrong. Measured on current `main`, `getContentChunks()` emits 66 chunks that omit every `technologies` list, every `dates` range, every `mission` statement, all of `profile.yaml`, and any description of the site itself; the 9 skill chunks are bare ID lists averaging under 80 characters. The chatbot is the site's headline feature (PRD §1, §7) and it currently cannot answer questions whose evidence already exists in `/content` but never reaches the index.

## What Changes

- Add a new `content/meta.md` content source describing CareerDNA itself — its content-first architecture, build-time embedding index, and retrieval-grounded generation — so questions about the site and its AI stack are answerable from real, indexed evidence rather than refused.
- Surface already-validated but unindexed experience fields (`technologies`, `mission`, `dates`) as retrievable chunks.
- Add `profile.yaml`'s positioning and summary to the corpus, which today is never chunked at all.
- **BREAKING** (content schema): `skills.yaml` entries gain a required `summary` field carrying prose evidence, replacing today's ID-list-only skill chunks. All 9 existing entries must be authored in the same change.
- Add curated FAQ pairs covering AI tooling and how the site was built.
- Extend the eval set with factual questions for tooling, tenure, and site-meta so the ship gate proves the corpus gap is closed and stays closed.
- Model identifiers used in self-describing content are injected from the existing `MODEL` / `EMBEDDING_MODEL` constants at chunk time, never written as literals in content, so they cannot drift when the provider changes.

Explicitly out of scope: the system prompt's grounding rules, the relevance threshold, the retrieval algorithm (stays flat top-k=5), and the LLM provider. Answer quality improves by supplying more real evidence, not by loosening the answer-only-from-context contract.

## Capabilities

### New Capabilities

None. Every change extends an existing capability's requirements.

### Modified Capabilities

- `content-model`: adds the site-meta content source shape (`content/meta.md`) and makes `summary` a required field on every `skills.yaml` entry.
- `content-validation`: validates the new meta source's presence and shape, and treats an empty or missing skill `summary` as a missing required field.
- `content-indexing-pipeline`: adds a requirement that the index cover every retrievable content facet — profile positioning/summary, per-chapter mission and date range, per-chapter technologies, prose-bearing skills, and the site-meta source — with model identifiers resolved from code at index-build time.
- `chatbot-eval-and-ship-gate`: extends eval-set coverage requirements to include tooling, tenure, and site-meta factual questions, so the ship gate fails if any of these regress.

## Impact

- **Content**: new `content/meta.md`; `content/skills.yaml` (9 entries gain `summary`); `content/faq.md` (new pairs). `content/experience/*.yaml` need no edits — their fields already exist and validate.
- **Code**: `lib/content/schemas.ts` (required `summary`, new meta schema), `lib/content/read.ts` (new `getMeta()`; `getProfile()` gains the `contentRoot` parameter its sibling readers already accept), `lib/content/chunk.ts` (new emitters; `source` union gains `profile` and `meta`), `lib/content/validate.ts`, `lib/rag/eval-set.ts`.
- **Unaffected**: `lib/rag/embed.ts` consumes `getContentChunks()` and picks up new chunks automatically; `lib/rag/generate.ts` and `lib/rag/retrieve.ts` are untouched.
- **Consumers of the changed schema**: `components/StructuredData.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/layout.tsx`, `app/opengraph-image.tsx`, `lib/site-config/build.ts` read content and must still type-check against the required `summary`.
- **Index size**: ~66 → ~90 chunks, well inside PRD §7's ~50–150 corpus assumption. Per-request cost and latency are unchanged; build-time embedding cost grows by roughly one batch.
- **Runtime**: all new reads happen at build time via `getContentChunks()`. No request-time filesystem access is introduced — the Cloudflare Workers runtime does not support it.
- **Tracking**: Linear JOS-101.
