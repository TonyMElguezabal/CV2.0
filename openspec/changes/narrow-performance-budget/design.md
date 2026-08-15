## Context

`performance-budget-compliance` was written when CareerDNA was treated as a
conventional public web property, where Lighthouse standing, search
discoverability, and Core Web Vitals are proxies for reaching an audience. The
owner has since established that the site's distribution is deliberate and
direct — a URL pasted to a recruiter, or printed on a résumé — so those proxies
measure something the site does not pursue.

At the same time, a constraint that *does* hard-block releases has never been
specified: the Cloudflare Workers bundle size limit. This proposal's original
measurement (2026-08-13, 3006.83 KiB gzip, 65.17 KiB headroom, 97.9% of the
free tier consumed) motivated adding the requirement below.

**Amendment (found while applying this change, 2026-08-15):** `JOS-106`
(`reduce-worker-bundle-size`) merged after this proposal was written and
before it was implemented, and it fixed exactly the near-exhaustion this
proposal describes — by moving the retrieval index onto the Workers Static
Assets binding and removing `next/og` from the Worker's server bundle (see
`openspec/specs/cloudflare-deployment-compat/spec.md`'s "No request-time
filesystem reads" and "OpenGraph image generation is served from the
build-time cache" requirements). A fresh `wrangler deploy --dry-run`
measurement taken while implementing this change now shows **1520.08 KiB
gzip / 3072 KiB free tier = 49.48% consumed, 1551.92 KiB headroom** — a
completely different picture from the one that motivated this change.

This does not remove the reason to specify the requirement — the constraint
is still real, still hard-blocks releases if crossed, and was still
genuinely unspecified before this change. It does mean the change's own
"why now, urgently" framing, and Decision 5's specific dominant-contributor
claim below, no longer describe the current bundle. Both are corrected here
rather than left to quietly mislead a future reader; the requirement text
itself (Decision 4's "plan in use" framing) was written to not depend on a
specific number and needs no change.

## Goals / Non-Goals

**Goals**
- Leave the capability asserting only requirements that will actually be
  enforced.
- Specify the deploy-blocking constraint that was previously documented only in
  the README.
- Make the removal reasoning durable, so a future reader understands why a web
  property has no Lighthouse gate and does not "fix" it back reflexively.

**Non-Goals**
- Reverting any implementation. Nothing about the running system changes.
- Solving the Worker size problem. This change *specifies* the limit; reclaiming
  headroom is separate work if it becomes necessary.

## New capability Purpose (apply verbatim at sync)

Current (main spec):
> Defines the site-wide performance budget — the motion library is lazily
> loaded and kept out of the critical bundle, the initial JS budget is
> enforced, the landing page meets the Lighthouse ≥90 and LCP targets, and
> animations sustain 60fps.

Rewritten, to replace it at sync time (task 6.1):
> Defines the two performance constraints that actually bind this site: the
> deployed Cloudflare Worker bundle SHALL stay within its deployment plan's
> gzipped size limit (the platform rejects an oversized Worker outright, so
> this is a release blocker, not an advisory metric), and animations SHALL
> sustain 60fps via compositor-only properties (`transform`/`opacity`),
> since janky motion directly damages the first impression this site exists
> to create. Client-delivery and search-discovery metrics — Lighthouse
> score, LCP, First Load JS, motion-library lazy-loading — are deliberately
> not budgeted here: this site is distributed by direct URL and printed
> résumé, not search discovery, so those proxies do not measure this site's
> actual audience (owner decision, 2026-08-13).
- Touching `accessibility-compliance`, `seo-metadata-and-structured-data`, or
  `cloudflare-deployment-compat`.

## Decisions

### Decision 1: Narrow the existing capability rather than retire it

Three options were considered:

| Option | Outcome |
|---|---|
| Retire `performance-budget-compliance` entirely | Loses the 60fps requirement, which `hero-signature-motion` explicitly builds on — and leaves the Worker limit unspecified |
| Leave it, and skip the gates per change | The drift this change exists to prevent: a spec that claims enforcement it does not have |
| **Narrow it** | Keeps what binds, removes what does not, adds what was missing |

Narrowing keeps the capability id stable, which matters: archived changes and
`README.md` reference it by name, and the id is still accurate — a Worker size
ceiling and a frame-rate floor are both, straightforwardly, performance budgets.

### Decision 2: The 60fps requirement stays, and stays unmodified

It is the one requirement in this capability that is not a proxy metric. Janky
animation is a direct, visible failure of the impression the site is built to
create — a *wow-factor* property, not a scoring property.

It is also load-bearing elsewhere: JOS-105 amended `hero-signature-motion` to
require "only `transform` and `opacity` … no non-compositor-friendly property
such as `filter`, `box-shadow`, or `background-position`", and that amendment
was justified by reference to this requirement. Removing it would orphan that
reasoning. Left textually unchanged so nothing downstream needs revisiting.

### Decision 3: The Worker limit belongs here, not in `cloudflare-deployment-compat`

Both were defensible. `cloudflare-deployment-compat` is about *whether the
application builds and runs* on Workers, and an oversized bundle means it does
not — a real argument for placing it there.

It lives here instead because it is fundamentally a **budget**: a measured
quantity checked against a ceiling, re-measured as the system grows. Placing it
here also leaves the narrowed capability with a coherent purpose (the two
budgets that bind) rather than reducing it to a single frame-rate rule, and it
keeps `cloudflare-deployment-compat` focused on adapter correctness — static
asset caching, no request-time `fs`, no Node-runtime proxy — which is a
different kind of concern.

### Decision 4: Specify the limit by "plan in use", not as a hard number

The requirement deliberately says "the limit of the deployment plan in use"
rather than "3 MiB". The free tier is 3 MiB gzip and the paid Workers plan is
10 MiB; the project is at 3006.83 KiB, i.e. 97.9% of the free tier but under
30% of the paid one. Hard-coding 3 MiB would make the spec wrong the moment the
plan changes, and hard-coding 10 MiB would assert a plan the project may not be
on. The recorded measurement plus the applicable limit are project
documentation (README), which the requirement obliges the project to keep.

### Decision 5: Name content growth as the re-measurement trigger

**Amendment (2026-08-15):** this decision's original claim — that the
retrieval index appears twice in the Worker bundle and is the dominant
contributor — is no longer accurate. JOS-106 moved the index onto the
Workers Static Assets binding (`env.ASSETS`), which is not subject to the
Worker's own size limit at all; it no longer appears in the Worker script
in any form. The reasoning below is kept for its still-valid *shape* — content
bundled at build time is a growth vector worth naming — but the concrete
example is updated to match what is actually still bundled today.

The size problem here is not code, it is **content compiled into the
Worker's own script**, as opposed to content served via the Static Assets
binding (which carries no comparable limit). Today that mostly means the
Worker's server-function bundle itself (framework runtime, route handlers,
and any data a route handler imports directly rather than fetching via
`env.ASSETS`) — there is no single large offender the way the retrieval
index was before JOS-106. The general risk remains real, though: any future
change that imports build-time data directly into a Route Handler, instead
of routing it through the Static Assets binding the way the retrieval
index now does, reintroduces exactly this failure mode.

That makes the failure mode counterintuitive and worth naming in the spec: a
pure *content* change, touching no code, can break the deploy if it grows
something still bundled into the Worker's own script. The re-measurement
scenario exists specifically so that a content-only PR is not assumed safe
by default — not because a specific known contributor is currently at risk,
but because the category of risk (build-time data imported directly rather
than served via Static Assets) persists structurally.

## Risks / Trade-offs

- **Nothing will catch a client-side performance regression any more.** This is
  the accepted trade, not an oversight. A future change could make the landing
  page substantially heavier or slower with no requirement violated.
  *Mitigation:* the reasoning is recorded in the removal notes, so if the
  distribution model changes — public sharing, search discovery, a campaign —
  the removed requirements can be reinstated deliberately rather than
  rediscovered.
- **65 KiB of free-tier headroom is effectively none.** Specifying the limit
  does not create room under it. The next content addition of any size could
  cross it. *Mitigation:* out of scope here by design, but the practical answer
  is the paid plan (10 MiB), which the README already recommends; the structural
  answer is moving the retrieval index out of the Worker, which would be its own
  change.
- **"Plan in use" is only as good as the project's record of it.** If the README
  is not kept current, the requirement becomes unverifiable. *Mitigation:* the
  requirement itself obliges the project to record both the measurement and the
  applicable limit, and the tasks update the README as part of this change.
