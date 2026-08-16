Linear-Issue: JOS-107

## Why

`performance-budget-compliance` currently asserts five requirements: a lazily-
loaded motion library, an enforced First Load JS ceiling, Lighthouse ≥90, LCP
under 2.5s/4s, and 60fps compositor-only animation.

Four of those five no longer reflect how this site is used. The owner's decision
(2026-08-13) is that CareerDNA is distributed by **pasting its URL to recruiters
and printing it on a résumé** — not through search discovery. Crawl standing,
index eligibility, and Core Web Vitals scoring therefore carry little value
here, and modern client hardware absorbs the page weight. The site's actual
success criterion is the impression it makes when opened, which those four
requirements do not measure.

Leaving them in place is worse than removing them. A capability that asserts
"a change exceeding the budget ceiling SHALL be treated as a regression" while
every subsequent change quietly skips the gate degrades into fiction, and the
spec stops being trustworthy as a description of the system. This change makes
the call once, explicitly, instead of letting it erode.

**Meanwhile the one budget that genuinely binds was never specified at all** —
and measurement taken while writing this proposal (2026-08-13) showed it
nearly exhausted:

```
  Cloudflare Worker bundle (npx wrangler deploy --dry-run)  — as of 2026-08-13
  ─────────────────────────────────────────────────────────────────────────
  measured        3006.83 KiB gzip
  free-tier cap   3072.00 KiB gzip   (3 MiB)
  headroom          65.17 KiB        →  97.9% consumed

  README recorded 2026-07-24:  ~2928 KiB   →  +79 KiB since
```

**Amendment (2026-08-15, found while implementing this change):** `JOS-106`
(`reduce-worker-bundle-size`) merged in the interim and fixed exactly this —
moving the retrieval index onto the Workers Static Assets binding and
removing `next/og` from the Worker's server bundle. A fresh measurement
taken while implementing this change now shows a very different picture:

```
  Cloudflare Worker bundle (npx wrangler deploy --dry-run)  — as of 2026-08-15
  ─────────────────────────────────────────────────────────────────────────
  measured        1520.08 KiB gzip
  free-tier cap   3072.00 KiB gzip   (3 MiB)
  headroom        1551.92 KiB        →  49.48% consumed
```

This is not a performance concern. **Cloudflare rejects an oversized Worker
outright** — the deploy fails and the site does not update. It remains a
release blocker wearing a performance costume, and no accepted requirement
currently guards it — but it is no longer an urgent one: JOS-106 already
reclaimed the headroom this proposal was originally written to protect. The
requirement below is still worth specifying (design.md's Context has the
full amendment), just without the urgency framing this section originally
carried.

## What Changes

- **Remove** the four requirements that no longer serve this site: Lighthouse
  score targets, LCP targets, the First Load JS ceiling, and the
  motion-library-lazy-loading rule. Their existing implementations are **not
  reverted** — `LazyMotion` and the code-split chat panel stay exactly as they
  are; they simply stop being spec-enforced obligations.
- **Keep** the 60fps / compositor-friendly-properties requirement, unchanged.
  It survives the deprioritization because it is not a metrics rule: janky
  animation directly damages the first impression the site exists to create,
  and `hero-signature-motion`'s amended clause (JOS-105) already builds on it
  by name, forbidding `filter`, `box-shadow`, and `background-position`.
- **Add** a requirement covering the deployed Worker bundle's size limit,
  framed as a release blocker rather than an advisory budget, with an explicit
  obligation to re-measure when Worker-bundled content grows.
- **Rewrite the capability's Purpose**, which currently advertises the removed
  Lighthouse/LCP targets and would otherwise contradict its own requirements
  after the sync.

## Capabilities

### Modified Capabilities
- `performance-budget-compliance`: narrowed from a general web-performance
  budget to the two constraints that actually bind this site — the deployment
  platform's hard Worker size limit, and motion quality. Four client-delivery
  and search-scoring requirements are removed with reasons and migration notes.

## Impact

- **No code changes.** This is a spec-only change: it removes obligations, adds
  one, and leaves every existing implementation in place. Nothing to build, no
  tests to update.
- **What this gives up, stated plainly:** nothing will automatically catch a
  future change that makes the landing page substantially slower or heavier on
  the client. That is the accepted trade, not an oversight. If the site's
  distribution model ever changes — public sharing, search discovery, an ad
  campaign — these requirements should be reinstated rather than reinvented.
- **What this gains:** a size ceiling — currently 49.48% consumed as of
  2026-08-15, after JOS-106 (see the amendment above) — becomes a named,
  re-measured, release-blocking requirement instead of a paragraph in the
  README that no change is obliged to check.
- **Operational note (not a requirement, but the practical consequence):**
  headroom is healthy right now (1551.92 KiB, just under half the free
  tier), which is a direct result of JOS-106's fix. That fix already moved
  the largest lever — the retrieval index no longer counts against the
  Worker's own size limit at all, since it's served via the Static Assets
  binding instead. There is no longer one obvious dominant contributor to
  watch; the practical risk going forward is any *future* change that
  imports build-time data directly into a Route Handler instead of routing
  it through `env.ASSETS` the way the retrieval index now does.
