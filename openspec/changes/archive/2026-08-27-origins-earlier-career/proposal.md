Linear-Issue: JOS-115

## Why

The site's career story starts at IBM in 2006. Twelve formative years are
missing, and with them the strongest differentiator available for the executive,
director and account-management roles this profile is being positioned for: a
**32-year arc (1994 → 2026)** across five platform generations, in which the
same behaviour — find the bottleneck, standardise the fix — recurs from age 17
onward.

Two items in that missing material are load-bearing on their own:

- **CALCOM, ~1999.** A customer ordered 300 machines; the shop's process was
  assemble → install Windows → install all software, 300 times by hand. At 17 he
  used Norton Ghost to clone one fully-configured disk, and **the process was
  adopted across every CALCOM branch and office.** That is process
  standardisation at organisational scale, and it is the earliest instance of
  precisely what ADEHub did at Oracle twenty-two years later.
- **INEGI, 2004–2006.** An internal vehicle-management system written as an
  intern is **still in production at a Mexican federal institute in 2026** —
  roughly twenty years of durability.

Neither appears anywhere on the site today, and neither fits a résumé.

## What Changes

- **New `origins` content type.** A single `content/origins.yaml` holding an
  ordered set of entries (CCEJ, first software sale, CALCOM, INEGI) plus a
  framing summary, with a deliberately light schema — approximate period labels
  rather than validated calendar dates, since the real precision is not known
  and forcing `YYYY-MM` would invite fabrication.
- **New `OriginsSection` component**, rendered after the career chapters,
  organised in two beats: *the self-taught years* (CCEJ → first sale → CALCOM)
  then *the formal years* (university → INEGI).
- **One new timeline node, "Origins".** `CareerTimeline` currently renders
  strictly from `ExperienceWithId`; it gains a small view-model so a
  non-experience node can join the rail without altering its observer,
  `aria-current`, keyboard or no-JS behaviour.
- **Origins content joins the retrieval corpus** as one chunk per entry, so the
  chatbot can answer "has he ever sold software?", "has he taught anyone?", and
  "what is the earliest example of him improving a process?".
- **Deliberately does not** add these as `content/experience/*.yaml` files. See
  design.md Decision 1 — the schema and the timeline rail both forbid it.

## Capabilities

### New Capabilities

- `origins-narrative`: the pre-2006 formative record — its content shape, its
  two-beat rendering, the single condensed timeline node, and the editorial
  constraints that keep decades-old material an asset rather than a liability
  (legacy tooling stays narrative and never becomes a claimed current skill;
  the span is published while the birth date is not).

### Modified Capabilities

- `career-timeline-navigation`: the rail's entries are no longer exclusively
  career chapters — it gains one node for the origins section, while its
  single-scroll-indicator guarantee, anchor behaviour and keyboard operability
  are unchanged.
- `content-indexing-pipeline`: the index must cover origins entries, so the
  corpus reaches the formative material rather than starting at 2006.
- `chatbot-eval-and-ship-gate`: eval coverage extends to the origins entries,
  satisfying the content-derived coverage gate that `chatbot-era-collision-guard`
  (JOS-116) introduces.

## Impact

- `content/origins.yaml` — new file, the only content added.
- `lib/content/schemas.ts` — new `OriginsSchema` / `OriginEntrySchema`.
- `lib/content/read.ts` — new `getOrigins()`.
- `lib/content/validate.ts` + `cli.ts` — origins joins the build-time gate.
- `lib/content/chunk.ts` — one chunk per origins entry.
- `components/OriginsSection.tsx` + styles — new section.
- `components/CareerTimeline.tsx` — accepts a timeline view-model rather than
  `ExperienceWithId` directly; **behaviour unchanged**.
- `app/(marketing)/page.tsx` — mounts `OriginsSection`.
- `lib/rag/eval-set.ts` — factual coverage for the new entries.
- Index rebuild required (`prebuild` handles it automatically).

## Depends on

`chatbot-era-collision-guard` (JOS-116) must land first. It introduces the
content-derived eval coverage gate — which this change is the first to be held
to — and the chunk era-framing that stops this change's 1990s tooling from
being retrieved for present-day cloud questions.
