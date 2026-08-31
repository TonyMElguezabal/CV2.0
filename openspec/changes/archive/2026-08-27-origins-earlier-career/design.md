## Context

The verified spine, reconstructed and cross-checked during exploration (birth
year 1981, confirmed by the owner):

```
1994/95   13  enrols as a student at CCEJ (4 classrooms, ~30 practice machines)
              DOS 6.2 ✓  Windows 95 ✓  Corel Draw 5 ✓ — all current then
1995/96   14  finishes the courses; the director asks him to teach
              ~8 months · ~10 per group · kids younger → adults older
1997/98   16  Clipper inventory system for his father (part numbers, stock,
              suppliers, reorder triggers) · ~1 month build
              sells a copy to a coworker of his father · $25 · one sale only
1998/99   17  joins CALCOM (California Computers), in-shop IT support
1999–2001     300-machine order → Norton Ghost disk imaging
              → adopted across ALL CALCOM branches and offices
2001      19  leaves CALCOM to start university
2004–2006 22  INEGI — prácticas profesionales, still enrolled
              internal PHP tooling · Oracle 8i on HP-UX · tape backups
              present for the 8i → 9i migration
              vehicle-management system — still in production in 2026
2006-07   24  IBM (existing chapter)
```

Every anchor agrees independently: the tooling cluster sits in its correct
years, Norton Ghost postdates its 1998 release, and an INEGI internship at 22
matches when Mexican *prácticas profesionales* normally happen. Nothing here
needs hedging.

Two facts about the existing code determine most of what follows:

1. **`getExperiences()` reads every file in `content/experience/`** and
   `CareerTimeline` renders one rail node per result. Adding files there is
   therefore the same action as adding timeline nodes — they cannot be decoupled.
2. **The desktop rail has no scroll containment.** `CareerTimelineStyles.ts`
   sets `md:fixed md:top-1/2 md:-translate-y-1/2` with `md:overflow-visible`.
   Measured live: 7 chapters = 652px in a 779px viewport.

## Goals / Non-Goals

**Goals:**
- Publish the pre-2006 record in a form sized to what it actually is.
- Keep the timeline rail navigable.
- Make the material reachable by the chatbot.
- Keep decades-old tooling an asset (narrative) rather than a liability (a
  claimed current skill).

**Non-Goals:**
- Any change to the seven existing career chapters.
- Executive metrics (JOS-117) or new projects (JOS-118).
- Retrieval tuning — owned by JOS-116.
- Publishing a birth date or a current age (Decision 6).

## Decisions

### Decision 1: A new `origins` content type, not `content/experience/*.yaml`

Two independent constraints rule out the obvious approach, and either alone
would be decisive.

**The schema forbids it.** `ExperienceSchema` requires `mission`, `context`,
`responsibilities`, `projects[]` (each with `metrics`), `leadership`,
`technologies` and `lessons`. Apply the honest test — *can `leadership` and
`projects[].metrics` be filled truthfully?*

| | `leadership`? | `metrics`? | |
|---|---|---|---|
| INEGI (intern, 2004–06) | no | no | fails |
| CALCOM (support tech, 17) | no | no | fails |
| CCEJ (instructor, 14) | arguably | no | fails |
| First sale (16) | n/a | ~$25 | not a role at all |

Forcing them through means inventing leadership claims and metrics for an
internship and a teenage support job — which breaks the site's own stated
promise that *"every claim links to the project, metric, or story that backs it
up."* The schema is doing its job by rejecting them.

**The rail forbids it.** Four more experience files = four more nodes ≈ 1025px
against a 779px viewport, with `overflow-visible`: the top and bottom nodes
would render off-screen and be unreachable. One condensed node keeps the rail at
**8** and navigable.

### Decision 2: Approximate period labels, not validated calendar dates

`ExperienceDatesSchema` uses `dateStringSchema` (`YYYY-MM`, calendar-validated).
The origins material genuinely does not have that precision — "age 14, about
eight months", "a couple of years from 17". Adopting the strict schema would
force invented months onto records nobody can verify.

So `OriginEntrySchema` carries a **display string** (`period: "1999–2001"`,
`"age 16"`) rather than structured dates. The imprecision is real and the schema
should represent it honestly rather than launder it into false precision.

Consequence: origins entries cannot be sorted programmatically by date. That is
fine — see Decision 3.

### Decision 3: One file, authored order

`content/origins.yaml` holds `{ title, summary, entries: [...] }` and **array
order is display order**. No sort function.

The section is a narrative arc, not a reverse-chronological list, and its
correct order (13 → 14 → 16 → 17 → university → INEGI) is an editorial judgment,
not a computation. A single file also lets the whole story be read and reviewed
as one piece, which matters for prose.

This deliberately differs from `getExperiences()`, which sorts
`b.dates.start.localeCompare(a.dates.start)` because a career list has an
obvious canonical order. A story does not.

### Decision 4: `CareerTimeline` takes a view-model; its behaviour does not change

The rail is currently coupled to `ExperienceWithId` — it reads `experience.id`,
`.company`, `.role`, and calls `formatChapterDateRange(experience.dates)`. An
origins node has no `role`, no `company`, and no structured `dates`.

| Option | Outcome |
|---|---|
| Give the origins entry fake `role`/`company`/`dates` fields | Lies in the data model to satisfy a renderer; `formatChapterDateRange` would need a real `YYYY-MM`, reintroducing Decision 2's problem |
| Special-case an origins node inside `CareerTimeline` | Branching render logic in a component whose observer/`aria-current` behaviour is guarded by tests; invites regressions in the site's *only* scroll indicator |
| **Map both sources into a small `TimelineEntry` view-model** | The rail renders one uniform shape; the observer, `aria-current`, keyboard operability and no-JS anchor behaviour are untouched |

`TimelineEntry` is `{ id, label, meta }` — the two `aria-hidden` spans the rail
already renders, plus the id it observes and links to, plus the `aria-label` text.
Experiences map to it (`label: company`, `meta: formatChapterDateRange(dates)`);
origins maps to it (`label: "Origins"`, `meta: "1994 – 2006"`).

Same discipline the editorial-frame change used on this component: change how it
is fed, never how it behaves. `oneScrollIndicator.test.tsx` and
`career-timeline-navigation`'s existing requirements must pass unmodified.

### Decision 5: Legacy tooling is narrative, never a skill

DOS 6.2, Windows 95, Novell, Clipper, Corel Draw 5, Oracle 8i and HP-UX 11
appear **only inside origins entry prose**. They must not be added to
`skills.yaml`, and origins entries must not feed the skills surface.

In a current-capability list they actively subtract: they dilute the cloud/AI
signal that JOS-117/118 exist to strengthen, and they invite age filtering. The
asset is *having lived through five platform generations*, which is a narrative
claim — not *knowing Corel Draw 5*, which is not a claim worth making.

`skills.yaml`'s `evidence[]` must reference real chapter ids and is validated
against them, so this is partly enforced already; the spec makes it explicit.

### Decision 6: Publish the span, never the birth date

`/content` must never contain a birth date, and the site must never state a
current age. What it may state: *"in technology since 1994"*, *"started at 13"*,
*"32 years"*.

Being precise about what this does and does not achieve: publishing both ages
and years lets a reader derive an approximate birth year by arithmetic. That is
unavoidable — the origin story cannot be told without it, and the owner
explicitly wants the "since 13" claim. The protection that is actually
achievable, and is worth having, is that no machine-readable age field exists to
be filtered on, and no current age is ever asserted. Ages appear only as
narrative detail inside a story.

### Decision 7: Editorial constraints that must survive review

Recorded here because each was decided against a specific alternative that
looked reasonable:

- **"Invited / asked to teach", never "hired / employed".** A 14-year-old
  teaching was an informal arrangement at a school that no longer exists. The
  interesting fact is the invitation, not the employment status.
- **Describe the CCEJ syllabus; never call it "advanced".** The material was
  foundational — variable types, a calculator, a recipe database, presentation
  cards. "High-level" is correct about the *languages* (Basic and Clipper versus
  assembly) but reads to an English audience as "advanced courses", which
  collapses the moment anyone asks what was on the curriculum. The claim that
  survives any probing — *a fourteen-year-old teaching adults who had paid to be
  there* — never needed the material to be hard.
- **Do not lead with the ~8 month duration, but keep it in the content.** The
  claim is "at 14, he was asked to teach", not "he taught for a long time". It
  stays authored so the chatbot answers *"how long did he teach?"* honestly.

That last point generalises to a principle worth stating: **the corpus should
hold more detail than the page displays.** Depth for retrieval, restraint in
rendering — they are separate decisions, and `OriginsSection` may legitimately
render less than `origins.yaml` contains.

### Decision 8: Retrieval `k` raised from 5 to 7

`generate.ts`'s `k=5` default was deliberately left untuned pending exactly
this change (see `AGENTS.md` §9: *"only tune what the evals show is needed,
don't tune blind... re-evaluate once JOS-115/117/118 land"*). Task Group 10's
live eval run is that re-evaluation.

With origins content in the corpus, `factual-21` ("How long has Jose been in
technology?") failed: the `origins-summary` chunk (carrying "1994 – 2006")
ranked #7 by cosine similarity for that question, just outside `k=5` —
crowded out by generic FAQ/skill chunks (`faq-0`, `profile-summary`, etc.)
that score broadly high (0.5–0.68) against almost any career-shaped question,
a known property of dense summary chunks. Direct probing confirmed the
`origins-summary` chunk would enter context at `k=7` without displacing any
chunk needed by another eval case.

Raising `k` to 7 is a global retrieval parameter change — it affects every
production chat query, not just origins questions (marginally more context
tokens per request, small cost/latency increase). Chosen over the
alternative (leave `k=5`, accept the gap as a documented limitation) because
answering "how long has Jose been in tech" is a core PRD §1 question this
change exists to unlock, and the corpus-crowding risk this decision defers
to was already anticipated and named in advance rather than discovered as a
surprise.

### Decision 9: Rail centers below the header, not the full viewport

Task Group 12's real-browser verification of the Risks section's own "the
margin is now thin" warning found the actual failure mode was worse than
thin margin: at the 779px viewport this design doc measured against, the
rail's topmost node landed almost entirely behind `SiteHeader`'s fixed
96px band (`h-14` top row + `h-10` nav row), not just close to it. Live DOM
measurement put the real rail height at 721px (vs. this doc's 745px
estimate) and the header collision at ~67px.

`timelineNavClass`'s `md:top-1/2` (centers on the full viewport) became
`md:top-[calc(50%+3rem)]` — 3rem (48px) is half the header height, so the
rail's centering point shifts down to center within the space *below* the
header instead. This is a static CSS offset, not a `scroll-margin-top`-style
scroll-landing fix — it changes the rail's own resting position.

The fix is not complete at every height: it reduces the 779px-viewport
collision from ~67px to ~19px, and eliminates it entirely once viewport
height ≥ 817px (header height + rail height). Below that, some overlap
remains — the rail's content (721px) genuinely exceeds the space available
below the header (683px at 779px viewport), and no amount of repositioning
creates room that isn't there. Closing the gap fully would need a
containment strategy (e.g. a max-height with internal scroll, or reduced
node spacing) — exactly the follow-up work this doc's own Risks section
already named as something *"the next addition to the rail will need...
regardless of this change."* Chosen to ship the positional fix now (removes
the large majority of the collision, verified via live DOM measurement) and
leave the full containment strategy as future work, rather than block this
change on a larger rail redesign.

## Risks / Trade-offs

**[The eval coverage gate from JOS-116 will fail until origins has coverage]** →
Intended. JOS-116 Decision 7 derives required coverage from content specifically
so a new content source cannot land untested. This change must add eval
questions for the origins entries; that is a task, not an obstacle.

**[Adding a rail node re-opens the overflow question]** → 8 nodes ≈ 745px in a
779px viewport by the same measurement — it fits, but the margin is now thin.
Verify in a real browser at a short viewport, and note that the *next* addition
to the rail will need a containment strategy regardless of this change.

**[1990s tooling could be retrieved for present-day questions]** → This is the
exact collision JOS-116 exists to prevent, which is why it is sequenced first.
Verification here must include running the era-disambiguation eval cases against
the corpus **with** origins content present — that is the first run in which
those cases are non-trivial.

**[The material could read as padding to an executive audience]** → Mitigated by
Decision 5 (never a skill), the two-beat structure (self-taught *then*
formalised, so the credential follows the practice), and by keeping the section
condensed. If it reads as filler in browser review, cut entries rather than
softening the framing — the CALCOM/Ghost and INEGI-durability items carry the
section and the rest is supporting texture.
