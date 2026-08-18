Linear-Issue: JOS-116

## Why

Three content changes are queued behind this one — JOS-115 (origins, 1994–2006),
JOS-117 (executive metrics), JOS-118 (projects + cloud/AI depth) — which
together could take the retrieval corpus from **86 chunks to roughly 150–200**.
Two defects in the current chunking would only surface *after* that content
lands, as degraded answers nobody is watching for:

**1. Era collision.** JOS-115 introduces Oracle DB 8i, HP-UX 11, Novell,
Windows 95 and Clipper into a corpus that also contains Oracle Corporation
(2021–2026) and Oracle Cloud Infrastructure. `chunk.ts`'s technologies chunk
reads *"As {role} at {company}, Jose worked with the following tools and
technologies: …"* — with **no date anywhere in the text**. Embeddings have no
notion of "current", so a recruiter asking *"what is Jose's cloud experience?"*
could be served Novell and Oracle 8i. That is the precise opposite of the
positioning JOS-117 exists to establish.

**2. Orphaned chunks.** Three of the seven chunk types emitted per career
chapter carry **no attribution at all**: `-actions` is a bare
`responsibilities.join("\n")`, `-leadership` and `-lessons` are likewise bare
strings. When one is retrieved, the model receives a list of achievements with
no indication of which company, role, or decade it belongs to. This is already
a cause of vague answers, and it scales linearly with corpus growth — more bare
chunks, more chances an unattributed one wins a slot.

The fix for both is the same: chunks must be **self-describing**. This change
lands that mechanism and the regression gate around it *before* the content
arrives, so corpus growth is measured against a gate rather than discovered in
production.

## What Changes

- **Frame every career-chapter chunk with who/where/when.** Extend
  `lib/content/chunk.ts` so `-technologies`, `-actions`, `-leadership` and
  `-lessons` carry the chapter's role, company, and human-readable date range,
  matching the framing `-mission-dates` already uses. Era becomes part of the
  embedded text, so it reaches both retrieval and generation.
- **Preserve the thin-content guard.** `MIN_CHUNK_LENGTH` currently measures
  the whole chunk text; adding a framing prefix would push every chunk over the
  threshold and silently defeat a guard that exists to flag thin *authored*
  content. Measure the authored body, not the framing.
- **Add era-disambiguation eval cases** to `lib/rag/eval-set.ts`, using the
  existing `forbiddenSubstrings` hallucination-guard mechanism to assert that
  cloud/modern questions are never answered with 1990s tooling.
- **Make the eval coverage gate derive from content** instead of the hardcoded
  `CHAPTER_AND_PROJECT_IDS` list in `eval-set.test.ts`, so a new chapter cannot
  be added without eval coverage going with it.
- **Deliberately does not change `k`.** See design.md Decision 2.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `content-indexing-pipeline`: the requirement that the index covers every
  retrievable content facet is extended — chunks must additionally be
  temporally and attributionally self-describing, and the "no chunk is too
  short" scenario must measure authored content rather than generated framing.
- `chatbot-eval-and-ship-gate`: the eval set gains an era-disambiguation
  obligation (a modern-stack question must never be answered from legacy
  tooling), and the chapter/project coverage gate must derive from actual
  content so it cannot silently go stale as chapters are added.

## Impact

- `lib/content/chunk.ts` — chunk text framing for four chunk types; a helper
  for the framing prefix so tests can measure the authored body.
- `lib/content/chunk.test.ts` — thin-content assertion measures the body;
  new assertions for attribution and date framing.
- `lib/rag/eval-set.ts` — new era-disambiguation cases.
- `lib/rag/eval-set.test.ts` — coverage gate derives chapter/project ids from
  content instead of a hardcoded array.
- **Index rebuild required.** Chunk text changes mean every embedding changes;
  `npm run build` regenerates the index via `prebuild`, so this is automatic,
  but it makes the change a full re-embed (a build-time OpenAI cost, ~86
  chunks).
- No change to `lib/rag/retrieve.ts`, `k`, `RELEVANCE_THRESHOLD`, the system
  prompt, or the `ContentChunk` interface's fields.
- No dependency change. No Worker bundle-size impact — the index ships via
  Static Assets (JOS-106), not the Worker script.
