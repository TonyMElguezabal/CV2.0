## Context

The Worker bundle is at 3006.83 KiB gzip against a 3072 KiB free-tier cap. The
owner is remaining on the free tier, so this is a release ceiling rather than a
performance preference — Cloudflare rejects an oversized Worker and the deploy
fails.

Composition was measured by gzipping individual files inside
`.open-next/server-functions/default`, because raw file sizes are actively
misleading at this layer: `capsize-font-metrics.json` is the largest raw file in
the bundle (4.2 MB) but compresses 16:1 to 256 KiB, while the retrieval index
compresses only ~5:1 because embeddings are near-random floats. Ranking by raw
size would have pointed at the wrong target.

## Goals / Non-Goals

**Goals**
- Reclaim headroom by removing bundle contents that never execute.
- Keep the OpenGraph card working — it is now the site's first impression.
- Leave retrieval accuracy untouched.

**Non-Goals**
- Quantizing or shrinking embeddings. Available (~500 KiB), deliberately unspent.
- Moving the index to `ASSETS`. Available (~615 KiB), deliberately unspent.
- Solving Worker size permanently. Content growth will erode any headroom won
  here; the follow-ups exist for when it does.

## Decisions

### Decision 1: Fix the duplicate by excluding it from tracing, not by changing how retrieval loads

`lib/rag/retrieve.ts` does `await import("./index.json", { with: { type: "json" } })`.
The bundler resolves that at build time into a compiled chunk
(`module.exports=…JSON.parse('[{"id":"profile-summary"…')`), and that chunk is
what executes. Separately, OpenNext's dependency tracing copies the original
`lib/rag/index.json` file into the server-function bundle.

Verified before proposing: grepping every shipped `.mjs`/`.js` in the bundle for
`rag/index.json` returns nothing. The raw file is unreferenced at runtime.

The fix is therefore a **tracing exclusion**, not a change to `retrieve.ts`.
`outputFileTracingExcludes` is confirmed present at the top level of Next
16.2.11's config type (`config-shared.d.ts:1240`). Rewriting how retrieval loads
the index would risk the request-time-`fs` constraint that
`cloudflare-deployment-compat` already guards, for no additional benefit.

**This is why the change must be verified against the real deploy path**
(task 1.4): the entire premise is a claim about what OpenNext's tracer copies,
and a different build environment could trace differently.

### Decision 2: Take `next/og` out of the app's import graph rather than marking it external

The route is already prerendered — `app/opengraph-image.tsx`'s own comment
states it renders "once during `next build`'s own prerendering… never
re-executing at Worker request time", the build output marks `/opengraph-image`
as static, and the prebuilt artifact exists at
`.open-next/cache/…/opengraph-image.cache`. So the library in the Worker is
unreachable code.

Three ways to remove it, evaluated:

| Approach | Bundle result | Risk | Notes |
|---|---|---|---|
| **A. Designed static PNG in `public/`** | library gone entirely | lowest | zero code; art-directed card, not generated |
| **B. Generate in `prebuild`** | library gone from app graph | low–medium | stays content-driven from `profile.yaml` |
| **C. `serverExternalPackages`** | library not bundled | **highest** | leaves a route that would fail *if* it ever ran |

C is listed for completeness and is the least preferred: it preserves a code
path whose safety depends on "this never executes," which is exactly the kind of
assumption that stops being true after an unrelated config change.

B has one non-obvious constraint worth recording: `prebuild` runs under
`node --experimental-strip-types`, which strips TypeScript types but does **not**
transform JSX. So a prebuild generator must construct the element tree with
`React.createElement` rather than JSX, or the script will not parse.

A is genuinely attractive beyond bundle size. The owner's 2026-08-13 decision
made direct-link sharing the site's primary distribution, which means the
OpenGraph card is the first thing a recruiter sees — before the page loads at
all. A deliberately designed card is likely to beat a generated
text-on-a-gradient one, and it costs nothing to serve.

The spike (task 2.1) picks between A and B on evidence. Both satisfy the
modified requirement; the choice is about whether the card should be
art-directed or content-driven.

### Decision 3: Rewrite the OG requirement around intent, not mechanism

`cloudflare-deployment-compat`'s existing requirement names its mechanism —
"served from the prerendered build-time cache… so `next/og`'s default
system-font lookup executes only during `next build`'s own Node.js
prerendering". Under either approach above, that sentence stops being an
accurate description.

The rewrite keeps the guarantee (no request-time generation, no request-time
`fs`) and strengthens it (the library is absent from the Worker entirely),
while no longer prescribing prerendering-a-Next-route as the only way to get
there. A third scenario is added asserting that metadata points at the image
that is actually served — the failure mode of this change is a broken link
preview, and nothing in the old requirement would have caught that.

### Decision 4: Spend waste before spending accuracy

Three further levers exist and are deliberately not used: int8 + base64
quantization of embeddings (~500 KiB), requesting 512 instead of 1536 dimensions
(~⅔ of the index), and serving the index from the `ASSETS` binding (~615 KiB).

Each trades either retrieval accuracy or runtime complexity for space. Since
①+② obtain roughly 1 MB by deleting things that never run, spending accuracy now
would be paying a real cost to avoid a free one. They are recorded here so the
next person facing this ceiling does not have to rediscover them.

### Decision 5: A real second duplication source, found only by verifying against the actual bundled output (not assumed by the original proposal)

Task 1.4 requires verifying lever ① reproduces on the real deploy path rather
than being assumed. Doing so surfaced a second, distinct bloat source the
original proposal did not anticipate: applying `outputFileTracingExcludes`
correctly removed the loose `lib/rag/index.json` file from
`.open-next/server-functions/default` (confirmed via direct inspection), but
the actual `wrangler deploy --dry-run` gzip figure did not move — because
`wrangler`'s upload measurement bundles from `.open-next/worker.js`'s own
import graph (ultimately `handler.mjs`, an already-fully-bundled ~8.5 MB
file), not from the loose files OpenNext stages alongside it. The loose file
excluded by lever ① was never part of that bundled output in the first
place; excluding it only cleaned up an unused staging artifact.

Searching `handler.mjs` for the RAG content marker (`"profile-summary"`)
found two occurrences. The first is the legitimate compiled chunk
`retrieve.ts`'s `import("./index.json")` resolves to — the copy that must
survive. The second is not index data at all: it is `lib/rag/embed.ts`'s
**entire build-time CLI script** — `main()`, the `OpenAI` client
construction, `getContentChunks`, `writeFileSync`, `process.exit(1)` — none
of which ever runs in the Worker (`embed.ts` only self-executes via
`if (import.meta.url === \`file://${process.argv[1]}\`) main();`, a guard
that prevents *execution* but not *bundling*).

Root cause: `lib/rag/generate.ts` does
`import { EMBEDDING_MODEL, type IndexedChunk } from "./embed.ts"` — a mixed
value+type import. The type half is free (erased), but the value half
(`EMBEDDING_MODEL`) forces the whole `embed.ts` module to be evaluated as a
real runtime dependency, and a bundler cannot tree-shake `main()` out of that
module because it's referenced by module-scope code (the `if` guard), even
though it's never called. `retrieve.ts` already does this correctly
(`import type { IndexedChunk } from "./embed.ts"`, nothing else) — only
`generate.ts` has the mixed import.

**Fix**: `generate.ts` sources `EMBEDDING_MODEL` from its true origin,
`lib/rag/models.ts` (a two-constant, zero-dependency module that `embed.ts`
itself only re-exports from), and keeps `IndexedChunk` as a pure
`import type` from `embed.ts`. This severs the runtime edge into `embed.ts`
entirely — no config change, no behavior change, a one-line import fix.

This is exactly the class of finding task 1.4 and design.md's own Risk 1
("the duplication may not reproduce on the real deploy path... a different
build environment could trace differently") existed to catch. It doesn't
invalidate lever ①'s own fix (`outputFileTracingExcludes` is still correct
and still worth keeping — it removes genuine dead weight from the staging
directory, even though that weight turned out not to be what `wrangler`
measures) — it adds a second, larger fix alongside it. Both are verified
together in the re-measurement in Task Group 1.

### Decision 6: Superseding Decision 1 — move the index to Workers Static Assets rather than excluding a loose duplicate

Decision 1 and Decision 5 (above) together establish that the ~681 KiB
"duplicate" the original proposal targeted was never actually part of
`wrangler`'s measured upload, and that the genuinely duplicated code found
during Decision 5's investigation (`embed.ts` leaking into the runtime
bundle) is only a few KB — not the ~1 MB of reclaimable waste the proposal's
Impact table assumed.

Ranking every module actually inside the bundled `handler.mjs` by real byte
size (not the loose-file-tree proxy Decision 1 relied on) found the true
picture: the retrieval index's own compiled chunk is **2525 KiB raw, ~30% of
the entire 8283 KiB bundle**, by itself, as a single non-duplicated,
genuinely-necessary copy. This is not a bug — 86 chunks × 1536-dimension
embeddings is simply a lot of near-random floating-point data, and it
compresses only ~5:1 (Context, above) where ordinary JS compresses ~16:1.
There is no further "waste" to delete here; the remaining cost is the index
doing its job.

Given that, Decision 4's original framing ("spend waste before spending
accuracy") no longer applies as stated — there isn't enough waste left to
spend. Of the three deferred levers Decision 4 named, quantization and
512-dimension embeddings both *shrink* the index in place at a retrieval-
accuracy cost; the third — serving the index from the Workers Static Assets
binding (`env.ASSETS`) instead of bundling it into the Worker's own script —
removes it from the Worker's size ledger **entirely**, at no accuracy cost,
because Static Assets has its own, far larger allowance separate from the
3072 KiB Worker script limit. Owner decision: pursue this option now, in
this change, rather than deferring all three. Quantization and dimension
reduction remain documented, unspent follow-ups (README, Task Group 8) for
if content growth erodes the headroom this wins back.

**Mechanism**: `embed.ts` continues to write the canonical index to
`lib/rag/index.json` exactly as before (satisfying `content-indexing-pipeline`'s
existing "index is regenerated from current content" requirement
unchanged) — `prebuild` gains one additional step copying that file into
`public/rag-index.json`, so Next's own build treats it as a static asset
and OpenNext ships it via `.open-next/assets`, not the Worker script.
`retrieve.ts`'s `loadIndex()` changes from a build-time `import()` to
`getCloudflareContext({ async: true })`'s `env.ASSETS.fetch(...)` — a
Workers-native binding fetch, not a `node:fs` call, so it satisfies
`cloudflare-deployment-compat`'s "no request-time filesystem reads"
requirement's actual intent even though it no longer matches that
requirement's literal old wording ("a build-time-resolved import") — the
requirement's own scenario for the RAG index is amended accordingly (this
change's `specs/cloudflare-deployment-compat/spec.md` delta), the same
"rewrite around intent, not mechanism" pattern already used above for the
OpenGraph image requirement. A module-level in-memory cache is added so a
Worker isolate fetches the asset once, not once per chat request.

This makes lever ①, as originally scoped (`outputFileTracingExcludes`),
**moot** — with `retrieve.ts` no longer importing `lib/rag/index.json` at
all, there is nothing left for Next's tracer to duplicate in the first
place, so the exclusion is removed from `next.config.ts` rather than kept
as now-dead configuration. The `generate.ts` import fix (Decision 5) is kept
regardless — it is a correct fix independent of how the index is loaded.

## Risks / Trade-offs

- **The duplication may not reproduce on the real deploy path.** Everything here
  rests on a local `opennextjs-cloudflare build`. If the production pipeline
  traces differently, ①'s saving could be smaller or absent. *Mitigation:*
  task 1.4 verifies against the actual deploy path before the change is
  considered done; the measurement is re-run after, not assumed.
- **② can silently break the share card.** A missing or wrong-sized image
  produces a link with no preview — invisible in CI, highly visible when pasted
  to a recruiter, and worse than the problem being solved. *Mitigation:* verify
  by fetching the image URL and confirming dimensions/content type, and by
  checking a real link-preview render — not by the build succeeding.
- **`outputFileTracingExcludes` is a blunt instrument.** Over-broad patterns can
  exclude files that *are* needed at runtime, producing failures that only
  appear in the Worker. *Mitigation:* exclude exactly one specific path, and
  smoke-test `/api/chat` after — it is the one route that actually reads the
  index.
- **Headroom won is not headroom kept.** Content growth re-embeds into the
  index every build. *Mitigation:* out of scope here, but this is precisely why
  `narrow-performance-budget` adds a requirement obliging re-measurement when
  Worker-bundled content grows.
