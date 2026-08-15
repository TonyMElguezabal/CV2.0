Linear-Issue: JOS-106

## Why

The Cloudflare Worker bundle is at **3006.83 KiB gzip against the free tier's
3072 KiB cap — 97.9% consumed, 65 KiB of headroom.** The owner is staying on the
free tier, so this is a hard release ceiling: Cloudflare rejects an oversized
Worker outright and the deploy fails. At 65 KiB, the next few FAQ entries could
cross it, because `prebuild` re-embeds `/content` into the retrieval index on
every build — a pure content change, touching no code, can break the deploy.

Measuring the bundle's **gzipped** composition (raw sizes mislead badly here —
embeddings compress at ~4:1 while JS compresses at ~16:1) shows that two of the
largest contributors are things that should not be in the Worker at all:

```
  RAG index · raw JSON      681 KiB  22.6%   ← unreferenced duplicate
  RAG index · compiled      615 KiB  20.5%   ← the copy actually used
  capsize-font-metrics      256 KiB   8.5%
  @vercel/og (node)         212 KiB   7.1%   ← never executes in the Worker
  @edge-runtime primitives  164 KiB   5.5%
  @vercel/og (edge)         162 KiB   5.4%   ← never executes in the Worker
  edge-runtime              149 KiB   5.0%
  everything else           768 KiB  25.5%
```

**① The retrieval index ships twice.** `lib/rag/retrieve.ts` uses
`await import("./index.json")`, which the bundler compiles into a JS chunk —
that chunk is what runs. OpenNext's dependency tracing *also* copies the
original `lib/rag/index.json` into the server-function bundle. Verified: no
shipped `.mjs`/`.js` references that path. It is 681 KiB of dead weight.

**② `next/og` ships for a route that never runs in the Worker.**
`app/opengraph-image.tsx` is prerendered during `next build` and served from the
build-time cache — this is deliberate, documented in the file's own comment, and
already an accepted requirement in `cloudflare-deployment-compat`. The prebuilt
artifact exists at `.open-next/cache/…/opengraph-image.cache`. The
image-generation library is nonetheless bundled into the Worker, where it is
never called.

Neither fix degrades the product. This is deleting things that do not run.

## What Changes

- **Exclude the traced-in duplicate index** using Next's
  `outputFileTracingExcludes` (confirmed available at top level in Next 16.2.11)
  so `lib/rag/index.json` is not copied into the server-function bundle. The
  compiled chunk that retrieval actually uses is unaffected.

- **Remove `next/og` from the Worker's import graph** by moving OpenGraph image
  production out of the Next route. Three approaches, in preference order —
  the spike in `tasks.md` picks one on evidence rather than guessing now:

  1. **A designed static PNG in `public/`.** Zero code, zero bundle cost, and
     arguably a better result: with direct-link sharing now the site's primary
     distribution (owner decision, 2026-08-13), the link preview is the literal
     first thing a recruiter sees, and a deliberately designed card will beat a
     programmatically-generated text-on-gradient one.
  2. **Generate the PNG in the existing `prebuild` step** (which already runs
     `lib/rag/embed.ts` and `lib/site-config/build.ts`), using `ImageResponse`
     with `React.createElement` rather than JSX — `prebuild` runs under
     `node --experimental-strip-types`, which strips types but does not
     transform JSX. Keeps generation content-driven from `profile.yaml`.
  3. **Fallback:** keep the route and mark the package external. Least
     preferred — it leaves code in the Worker that would fail *if* it ever
     executed, and "it never executes" is doing a lot of work in that sentence.

  Whichever is chosen, `lib/seo/metadata.ts`'s `ogImageUrl` moves from the
  `/opengraph-image` route to the static file, and the image ships as a static
  asset — which does **not** count toward the Worker size limit.

- **Verify the duplication reproduces on the real deploy path**, not just a
  local build. OpenNext's file tracing could behave differently under a
  Cloudflare build pipeline, and the whole premise of ① rests on that trace.

- **Out of scope, documented as follow-ups:** quantizing embeddings to int8 +
  base64 (~500 KiB more), requesting 512 instead of 1536 dimensions (~⅔ of the
  index), and moving the index to the `ASSETS` binding entirely (~615 KiB).
  All three trade retrieval accuracy or add runtime complexity for space this
  change obtains by deleting duplicates. There is no reason to spend accuracy
  before spending waste.

## Capabilities

### Modified Capabilities
- `cloudflare-deployment-compat`: the "OpenGraph image generation is served from
  the build-time cache" requirement is rewritten. Its *intent* — that
  `next/og`'s filesystem-dependent font lookup never executes at Worker request
  time — is preserved and strengthened (the library leaves the Worker
  altogether), but the mechanism it names, prerendering a Next route into the
  incremental cache, no longer describes how the image is produced.

### New Capabilities
_None._ The Worker size ceiling this change serves is being added to
`performance-budget-compliance` by the `narrow-performance-budget` change; this
change satisfies that requirement rather than defining it.

## Impact

- **Expected result** (to be confirmed by re-measurement, not assumed):

  | | Worker gzip | % of 3072 KiB | Headroom |
  |---|---|---|---|
  | today | 3007 KiB | 97.9% | 65 KiB |
  | after ① | ~2326 KiB | ~75.7% | ~746 KiB |
  | after ① + ② | ~1952 KiB | ~63.5% | ~1120 KiB |

  From 65 KiB of headroom to over 1 MB, on the free tier, without touching
  retrieval quality or removing a feature.

- **Modified files:** `next.config.ts` (tracing excludes), `app/opengraph-image.tsx`
  (removed or replaced), `lib/seo/metadata.ts` (image URL), possibly
  `package.json`'s `prebuild` and a new build script, plus `README.md`.
- **Risk concentrated in ②, not ①.** ① is a config-level exclusion of a verified
  unreferenced file. ② changes how the share card is produced, and the share
  card is now the site's first impression — so it is verified by actually
  fetching the image and checking a real link preview, not by the build passing.
- **Depends on nothing, unblocks everything.** `site-typography-and-palette` and
  the later editorial-frame work do not add to the Worker (fonts and client JS
  ship as static assets), but any future content growth does. This change should
  land before more content is added.
