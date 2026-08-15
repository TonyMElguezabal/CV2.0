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
