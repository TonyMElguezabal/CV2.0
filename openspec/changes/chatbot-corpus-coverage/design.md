## Context

The chatbot refuses questions it should answer. The refusal itself is correct — `SYSTEM_PROMPT` and the `RELEVANCE_THRESHOLD` guard in `lib/rag/generate.ts` are behaving as specified — but the corpus they draw on is incomplete. `getContentChunks()` currently emits 66 chunks from five emitters (chapter context, responsibilities, embedded projects, leadership, lessons) plus skills, standalone projects, and FAQ pairs. Verified against current `main`:

- `"Datadog"` appears in **zero** chunks — `technologies` is read, typed, and validated, but never chunked.
- `"2019"` appears in **zero** chunks — `dates` likewise.
- Envato's `mission` string appears in **zero** chunks.
- `getContentChunks()` has no `getProfile()` branch at all, so the two best "Who is Jose" paragraphs are absent.
- The 9 skill chunks are ID lists (`"AI/RAG Solution Delivery — evidenced by oracle, envato"`, 77 chars); 4 chunks in the index are under 60 characters.
- Nothing in `/content` describes the site itself, so the ticket's target answer is ungroundable by construction.

Relevant constraints: `chunk.ts` is imported only by `lib/rag/embed.ts` and its test, so it runs at build time and is not part of the Next.js bundle. `lib/rag/retrieve.ts` loads the index as a bundled module because the Cloudflare Workers runtime rejects request-time `readFileSync`. PRD §8 requires that swapping the LLM provider mean editing one file. `LlmProvider` already exposes a `readonly model: string`.

## Goals / Non-Goals

**Goals:**

- Every validated, visitor-facing field in `/content` reaches the index.
- The site can answer questions about itself and its own AI stack from real indexed content.
- Skill chunks carry prose with genuine embedding signal.
- Model identifiers in self-describing content cannot drift from the configured model.
- The eval set proves the gap is closed and fails if it reopens.

**Non-Goals:**

- Changing `SYSTEM_PROMPT`, `RELEVANCE_THRESHOLD`, `k`, the cosine-similarity retrieval, or the LLM provider. "More natural" comes from more evidence, never from a weaker grounding contract.
- Chunk-level reranking, hybrid/keyword search, or source-diversity retrieval. Explicitly deferred (see Risks).
- Rewriting career narrative content. Existing chapter prose is accurate; it is simply under-indexed.
- UI work. Rendering `skills[].summary` on the page is optional polish, not part of this change.

## Decisions

### 1. Model identifiers are injected into `chunk.ts`, not imported by it

`getContentChunks()` gains an options object: `getContentChunks({ contentRoot?, models: { llm, embedding } })`. `lib/rag/embed.ts` supplies the values.

*Why:* meta chunks must name the live model, but `chunk.ts` importing `lib/rag/active-provider.ts` would invert the current dependency direction (`rag → content`) and pull the `openai` SDK into the content layer; importing `EMBEDDING_MODEL` from `embed.ts` would be a true circular import, since `embed.ts` imports `chunk.ts`. Injection keeps `chunk.ts` free of any `lib/rag` dependency, matches the dependency-injection style already used in `generateGroundedAnswer`, and makes meta chunks trivially unit-testable with fixture model ids.

*Alternatives rejected:* (a) `chunk.ts` imports `active-provider.ts` — dependency inversion plus SDK weight; (b) instantiating the provider to read `provider.model` — requires an API key at chunk time, which `npm run validate:content` must not need; (c) placeholder tokens (`{{llmModel}}`) resolved later in `embed.ts` — a second templating mechanism for one value, and silently ships the raw token if a call site forgets to substitute.

`models` is a **required** field rather than an optional one with a default, so a call site cannot silently produce meta chunks naming a stale model.

### 2. Provider-swap integrity is preserved via `active-provider.ts`

Extract the two model literals into `lib/rag/models.ts` (`OPENAI_MODEL`, `EMBEDDING_MODEL`), and have `lib/rag/active-provider.ts` export `ACTIVE_LLM_MODEL` alongside `createActiveProvider`. `embed.ts` reads both and passes them into `getContentChunks()`.

*Why:* PRD §8's guarantee survives — swapping providers still means editing only `active-provider.ts` (the provider class and the model constant it re-exports). `providers/openai.ts` imports `OPENAI_MODEL` instead of declaring it, so the literal exists once. `embed.ts` re-exports `EMBEDDING_MODEL` so existing importers (`generate.ts`) are unaffected.

### 3. `meta.md` reuses the project markdown pattern, and the section splitter is extracted

`content/meta.md` is frontmatter (`title`, `topics`) plus `##`-delimited body sections. `read.ts`'s existing `splitProjectSections()` becomes a generic `splitMarkdownSections(markdown): Record<string, string>`, with `getProjects()` mapping its result onto the fixed problem/approach/outcome triple and `getMeta()` mapping its own sections.

*Why:* CLAUDE.md calls for detecting repeated patterns rather than duplicating them. A generic splitter also lets meta sections evolve without a schema change per section.

*Alternative rejected:* meta as YAML. Markdown keeps the narrative readable and chunks naturally at section boundaries, exactly like `projects/*.md`.

### 4. Meta content is split into a small number of dense chunks

Two to three chunks (what the site is; how content is authored and indexed; how the chatbot retrieves and generates), each a few sentences. Not one chunk per paragraph.

*Why:* with a fixed `k = 5` over ~90 chunks, many thin meta chunks would compete with each other for the same retrieval slots and could crowd out career evidence on mixed questions. Few, dense, semantically distinct chunks retrieve more reliably.

### 5. Chunk length is asserted, never enforced by filtering

A `MIN_CHUNK_LENGTH` constant backs a test asserting no emitted chunk falls below it. Chunks are never dropped or merged at runtime.

*Why:* a short chunk means content is thin and should be authored, not hidden. Filtering would silently remove evidence from the corpus — the exact failure mode this change exists to fix.

### 6. `skills[].summary` is required, not optional

*Why:* an optional field lets the thin-chunk problem persist silently for any entry that skips it. Requiring it costs nine authored summaries once and makes the guarantee structural. It is a breaking schema change, handled by authoring all nine in the same change (see Migration).

### 7. Chapter dates are chunked in both machine and human form

The mission/dates chunk carries the raw `YYYY-MM` values *and* a rendered range (`"March 2019 – November 2021"`, or `"March 2019 – present"` when `end` is absent).

*Why:* embeddings match natural phrasing ("in 2019", "March 2019") while eval `expectedSubstrings` are most stable against the raw values. Carrying both costs a few tokens and serves each.

### 8. Meta chunks anchor to the chat widget

Citation deep-links require an `anchor` on every chunk. Meta chunks use `#chat`, and the chat widget's container gets a matching `id` if it lacks one.

*Why:* the chat widget is the on-page element the meta content describes, so the citation lands somewhere real. Inventing an anchor for a section that does not exist would ship broken deep-links.

## Risks / Trade-offs

- **Retrieval dilution: 66 → ~90 chunks with `k` fixed at 5.** A tooling question could retrieve five chunks from one chapter and miss the meta source. → Mitigated by decision 4 (few, dense, distinct meta chunks) and proven by the new eval questions. If the tooling or site-meta eval cases fail after content is in place, source-diversity retrieval becomes a follow-up change — not scope creep here.
- **Self-description invites persona drift.** Content about "this chatbot" tempts the model into first-person self-reference, against PRD §7's third-person contract. → Meta content is authored in third person about the site, and an eval scenario asserts the answer stays in third person without adopting a first-person persona.
- **Meta content could leak abuse-useful detail.** → `meta.md` describes architecture only: no keys, no rate-limit values, no endpoint internals. Guardrail specifics stay out.
- **Required `summary` breaks the build until all nine are authored.** → Schema change and content land in one change; `npx tsc --noEmit` and `npm run validate:content` are the gate.
- **A model literal in `meta.md` would silently go stale.** → A validator rule rejects the active LLM and embedding identifiers as literals in that file, so drift fails the build rather than misinforming a recruiter.
- **Larger corpus, larger build.** ~24 extra chunks is roughly one extra embedding batch. Per-request cost, `k`, and the 400-token output cap are unchanged.
- **Broader corpus could weaken the refusal boundary**, since more content means more questions clear `RELEVANCE_THRESHOLD`. → The existing trap and injection eval cases are re-run against the expanded index as an explicit spec scenario; the threshold value itself is not touched.

## Migration Plan

1. Land the schema change, content, and chunk emitters together — a partial landing fails `validate:content` by design.
2. `npm run build` regenerates `lib/rag/index.json` (gitignored) from the expanded corpus; no manual index step and no data migration, since the index is a build artifact.
3. Verify with `npm run eval:chat` against the live model before merge; ship only on a `true` ship-readiness verdict.
4. **Rollback:** revert the change. The index is rebuilt from `/content` on the next build, so there is no persisted state to unwind.

## Open Questions

1. Does the chat widget container already carry an `id` usable as the `#chat` anchor, or must one be added? Resolve during implementation (decision 8); adding it is a one-line change.
2. Should `skills[].summary` also render in the skills UI? Deliberately out of scope here — worth a follow-up once the summaries exist, since they were authored to be reader-facing.
3. Do any chapters have a `technologies` list thin enough that its chunk falls under `MIN_CHUNK_LENGTH`? If so, that chapter's list needs enriching rather than the threshold lowering.
