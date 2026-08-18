## Context

`lib/content/chunk.ts` emits seven chunk types per career chapter. Only
`-mission-dates` carries a date; only `-context`, `-mission-dates` and
`-technologies` carry the role and company. The remaining three are bare:

```
chunk type          attribution?   date?   current text
──────────────────────────────────────────────────────────────────────────
{id}-context        role+company   no      "{role} at {company}\n\n{context}"
{id}-mission-dates  role+company   YES     "…\nDates: 2006-07 to 2008-08\n(July 2006 – August 2008)"
{id}-actions        NONE           no      responsibilities.join("\n")
{id}-project-N      no             no      "{title}\n{outcome}\n{metrics}"
{id}-technologies   role+company   no      "As {role} at {company}, Jose worked with…"
{id}-leadership     NONE           no      leadership.join("\n")
{id}-lessons        NONE           no      lessons
```

Retrieval is `cosineSimilarity` over the whole corpus, `k = 5` fixed
(`retrieve.ts:52`), with a single global `RELEVANCE_THRESHOLD = 0.15`
(`generate.ts:27`, already flagged in code as unvalidated against real
embeddings). Nothing anywhere models recency.

Grading already has the right primitive: `EvalQuestion.forbiddenSubstrings`,
described in `eval-set.ts` as "a hallucination guard (e.g. a wrong company, an
inflated metric)". Era collision is exactly that shape.

## Goals / Non-Goals

**Goals:**
- Make every career-chapter chunk self-describing in time and attribution, so
  era is visible to both the embedding and the model.
- Add a regression gate that fails when a modern-stack question is answered
  from legacy tooling.
- Keep the eval coverage gate honest as chapters are added.
- Preserve the existing thin-content guard's actual intent.

**Non-Goals:**
- Tuning `k` or `RELEVANCE_THRESHOLD` (Decision 2).
- Adding an `era` field to `ContentChunk` (Decision 1).
- Changing `SYSTEM_PROMPT`, retrieval scoring, or the streaming path.
- Authoring any new content — this change ships zero `/content` edits.
- Building new test infrastructure (Decision 5).

## Decisions

### Decision 1: Frame the chunk *text*, don't add an `era` metadata field

| Option | Outcome |
|---|---|
| Add `era: "early" \| "current"` to `ContentChunk` | Metadata never reaches the embedding — `embed.ts` embeds `chunk.text` only. Retrieval ranking would be completely unaffected, so the collision remains. Would need generation-side plumbing to do anything at all. |
| **Bake the date range into `chunk.text`** | The text *is* the embedding input, so era becomes part of the vector and shifts ranking. The same text is also what `generate.ts` passes as context, so the model can qualify its answer ("early in his career, 1999–2001") for free. |

One mechanism, both halves of the problem. This is decisive: only text reaches
the embedding, and text also reaches the LLM, so a metadata field would cost a
schema change and solve neither half.

Reuses `renderDateRange()`, already in `chunk.ts` for `-mission-dates`, so the
rendered form ("July 2006 – August 2008") stays consistent across chunk types —
`chunk.ts`'s existing comment notes embeddings match natural phrasing better
than raw ISO values.

### Decision 2: Do not tune `k` in this change

The Linear ticket's own instruction is *"only adopt what the evals show is
needed — do not tune blind."* At 86 chunks, `k = 5` is not currently a
demonstrated problem; the crowding concern is a projection about a corpus that
does not exist yet.

Raising `k` now would increase prompt cost on every request and risk diluting
precision, to fix a problem that cannot yet be measured. The honest sequence:
land the framing mechanism and the gate, let JOS-115/117/118 add content, then
re-run the evals and tune against real numbers.

Recorded here so a future reader does not mistake the omission for an oversight.

### Decision 3: Attribution framing for the three bare chunk types is in scope

Arguably a separate concern from era collision — but it is the same mechanism
(prefix who/where/when), the same file, the same function, and the same
rationale: **it gets worse with corpus growth.** Today an orphaned `-lessons`
chunk has a 1-in-7 chance of being the IBM one; at 200 chunks the retriever has
far more opportunities to surface an unattributed fragment against a question
about a different company entirely.

Splitting it into a follow-up would mean touching `chunk.ts`'s chapter loop
twice and re-embedding the corpus twice, for no benefit.

### Decision 4: `MIN_CHUNK_LENGTH` must measure the authored body, not the framing

This is the subtle one. `chunk.test.ts:69` currently asserts
`chunk.text.trim().length >= MIN_CHUNK_LENGTH`, and `chunk.ts`'s comment is
explicit about why:

> *"A chunk below this length means the underlying content is thin and should be
> authored, not hidden."*

Adding a ~60-character framing prefix would push **every** chunk past the
threshold regardless of how thin its authored content is — silently converting a
real content-quality guard into a tautology. The guard would still pass, and
would no longer mean anything.

| Option | Outcome |
|---|---|
| Raise `MIN_CHUNK_LENGTH` to compensate | Arbitrary, and the compensation differs per chunk type since prefixes vary in length |
| Store the body separately on `ContentChunk` | Duplicates text into `rag-index.json`; the index is already the largest static asset |
| **Export the prefix builder; strip it in the test** | No index growth, no arbitrary constant, and the assertion keeps measuring exactly what it was written to measure |

Chosen: `chunk.ts` exports the framing helper, and the thin-content test strips
the known prefix before measuring. The guard's intent survives the change intact.

### Decision 5: Two existing test layers, no new infrastructure

The repo already separates offline from live testing, and this change fits that
split without adding a third mode:

```
npm test          (offline, free, every commit)
  ├─ chunk.test.ts       — framing present? body still long enough?
  └─ eval-set.test.ts    — do the era cases exist? is coverage complete?

npm run eval:chat (live, costs tokens, run before ship)
  └─ eval-run.ts + eval-grade.ts
        — does the *answer* avoid legacy tooling?  (forbiddenSubstrings)
```

Retrieval-ranking assertions would need embedding API calls, which would put
network into `npm test` and break `chatbot-eval-and-ship-gate`'s existing
requirement *"Grading requires no live network calls"*. The live layer already
covers the behaviour that actually matters — the answer — so no new layer is
justified.

### Decision 6: Era cases are added now and pass trivially; that is the point

The colliding content does not exist yet — there is no INEGI chapter, no Oracle
8i, no Novell. So *"what is Jose's cloud experience?"* with
`forbiddenSubstrings: ["Novell", "HP-UX", "8i"]` will pass on the first run
simply because those strings are nowhere in the corpus.

That is not a weak test, it is a **regression gate**, and it is the entire
reason this change is sequenced before JOS-115. The case is written while the
corpus is clean so that the moment legacy content lands, the gate either holds
or fails loudly.

The alternative — writing these cases as part of JOS-115 — means authoring the
test and the content that breaks it in the same change, which is exactly the
circumstance where a test gets quietly weakened to pass.

### Decision 7: Derive the eval coverage gate from content

`eval-set.test.ts` hardcodes `CHAPTER_AND_PROJECT_IDS` as a nine-element array.
Every chapter JOS-115 adds must be manually appended or coverage silently
lapses — and the failure mode is invisible, since a stale list just tests less.

Deriving the list from `getExperiences()` and `getProjects()` (both already
imported in that test file's neighbourhood) converts it into a real gate: add a
chapter, and the suite fails until an eval question covers it.

This will make JOS-115 slightly harder to land, which is the correct incentive.

## Risks / Trade-offs

**[Every embedding changes; the whole index is rebuilt]** → Unavoidable and
already automatic: `prebuild` regenerates the index on every `npm run build`.
The cost is one full re-embed of ~86 chunks at build time. Worth noting the
existing evals may shift slightly even where behaviour is unchanged, since
ranking moves when text moves — treat one round of eval re-baselining as
expected work, not as a defect.

**[Framing could dilute the semantic signal]** → Prefixing every chunk with the
same shape ("As {role} at {company}, from {dates}…") adds tokens that are
similar across all chapters, which in principle pulls chunks slightly toward
each other in vector space. Mitigated by the fact that role/company/dates differ
per chapter, so the prefix is discriminative rather than boilerplate — and it is
precisely the discrimination this change wants. The live evals are the check.

**[Era cases could be over-specified]** → `forbiddenSubstrings: ["Oracle"]`
would be wrong: Oracle Corporation is a legitimate answer to many questions.
Forbidden lists must target the unambiguous legacy markers ("Novell", "HP-UX",
"Windows 95", "8i", "Clipper") and never the ambiguous ones. Called out here
because getting this wrong produces a gate that fails on correct answers.

**[Scope pressure toward tuning]** → Once framing is in and evals run, it will
be tempting to also adjust `k` "while we're here". Decision 2 is deliberate;
resist it in this change.
