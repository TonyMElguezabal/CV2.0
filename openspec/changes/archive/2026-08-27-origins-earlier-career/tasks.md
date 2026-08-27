## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 **Confirm `chatbot-era-collision-guard` (JOS-116) is merged to `main`** — confirmed: PR #53 merged as `61b75a5`
- [x] 0.2 Create `feature/origins-earlier-career` from `main`, pulling first
- [x] 0.3 Verify: `git branch --show-current` → `feature/origins-earlier-career`
- [x] 0.4 Confirm `.env.local` carries `OPENAI_API_KEY` — this change requires an index rebuild and a live eval run

## 1. Content model: schema and reader (TDD)

- [x] 1.1 Write failing tests in `lib/content/read.test.ts` for `getOrigins()` — returns the record's title, summary, and entries in **authored order** (design.md Decision 3). Used an inline fixture matching the file's existing `getMeta`/`getProjects` pattern rather than `test-fixtures.ts` (that shared fixture builder is scoped to the 6 pre-existing content types and consumed by `chunk.test.ts`'s fixture root; adding origins to it now would force every existing chunk test to grow origins assertions prematurely — deferred to Task Group 4 where chunk coverage is actually added)
- [x] 1.2 Add `OriginEntrySchema` and `OriginsSchema` to `lib/content/schemas.ts`. Entry fields: `id`, `label`, `period` (**plain display string, not `dateStringSchema`** — Decision 2), optional `organization`, `narrative`, optional `highlight`, optional `technologies`. **Correction made in Task Group 5**: initially missed a top-level `period` field on `OriginsSchema` itself (needed for the timeline node's display meta — task 2.1 called for it but the schema didn't have a place to put it). Added `period: z.string()` at the top level once the timeline view-model work surfaced the gap; fixed retroactively across the real content, the shared test fixture, and all inline test fixtures — see Task Group 5's note
- [x] 1.3 Add a test proving an approximate period (`"age 16"`, `"1999–2001"`) validates — no month precision required
- [x] 1.4 Implement `getOrigins()` in `lib/content/read.ts`, reading `content/origins.yaml` and preserving array order (no sort — deliberately unlike `getExperiences()`)
- [x] 1.5 Run `npx vitest run lib/content/read.test.ts` — confirm pass (19/19)

## 2. Author the content (design.md Context + Decision 7)

- [x] 2.1 Create `content/origins.yaml` with title `Origins`, period-labeled summary (13→2006 arc), and a framing summary establishing the arc without stating a current age
- [x] 2.2 Entry — **CCEJ** (`id: ccej`): student at 13 → instructor at 14; 4 classrooms, ~30 practice machines; taught DOS/Windows, Basic, Clipper, Corel Draw; ~10 students per group, mostly older; started with kids younger, progressed to adults; ~8 months (present, not leading)
- [x] 2.3 Entry — **First software sale** (`id: first-software-sale`): Clipper inventory system for his father (part numbers, stock, suppliers, reorder triggers), ~1 month build; a coworker asked for a copy; sold as-is for $25 with a couple of small improvements; one sale only
- [x] 2.4 Entry — **CALCOM** (`id: calcom`): in-shop IT support from 17 to 2001; assembly, OS installs, peripheral and network configuration, printer repairs. `highlight`: the 300-machine order, Norton Ghost disk cloning, **adopted across all branches and offices**
- [x] 2.5 Entry — **INEGI** (`id: inegi`): 2004–2006 prácticas profesionales while at university; internal PHP tooling; Oracle 8i on HP-UX (querying and tape backups, ~90%); present for the 8i → 9i migration. `highlight`: the vehicle-management system **still in production in 2026**
- [x] 2.6 Verified the editorial constraints hold throughout (Decision 7): `grep -in "advanced\|high.level\|hired\|employed"` → no matches; **"invited/asked to teach"** language used; the ~8 months is present but not leading
- [x] 2.7 Verified **no birth date anywhere**: `grep -in "born\|birth\|1981\|198[0-9]-[0-9][0-9]-[0-9][0-9]"` → no matches
- [x] 2.8 Directly verified via `getOrigins()` against real content — all 4 entries parse correctly in authored order (`npm run validate:content` doesn't yet check origins.yaml — wired in Task Group 3)

## 3. Wire origins into content validation

- [x] 3.1 Extend `lib/content/validate.ts` so origins is part of the build-time gate. **Discovered mid-task**: making `origins.yaml` required broke every existing test using the shared `makeFixtureRoot()` (they don't set up an origins file). Fixed by adding a `VALID_ORIGINS` fixture to `test-fixtures.ts` and wiring it into `makeFixtureRoot()` now, rather than deferring to Task Group 4 as task 1.1 originally assumed — the dependency was real, not optional
- [x] 3.2 Add a validation test proving a malformed origins file fails the gate non-zero — covers a missing top-level field and a missing nested entry field in one fixture
- [x] 3.3 Add a validation test proving **no skill's `evidence[]` may reference an origins entry id** — confirmed the existing dangling-reference check already rejects it for free, since origins ids are deliberately never added to `knownSlugs`

## 4. Retrieval: one chunk per entry

- [x] 4.1 Write a failing test in `lib/content/chunk.test.ts`: each origins entry produces at least one chunk
- [x] 4.2 Write a failing test: each origins chunk's text contains that entry's period (era attributable in isolation)
- [x] 4.3 Extend `ContentChunk`'s `source` union with `"origins"` and emit origins chunks in `getContentChunks()`, anchored to `#origins`. Period is woven directly into the chunk text (not a separable generated prefix like `chapterFramingPrefix()`), since origins chunks have no framing/authored-content split — the whole text is authored
- [x] 4.4 Confirm origins chunks satisfy the authored-body length rule introduced by JOS-116 — added a dedicated test proving a thin origins entry is still caught (no framing to strip means the general MIN_CHUNK_LENGTH guard applies to origins chunks' full text automatically). Real origins entries measure 408–659 chars, well clear of the 60-char threshold
- [x] 4.5 Run `npx vitest run lib/content/chunk.test.ts` — confirm pass (24/24)

## 5. Timeline view-model (design.md Decision 4 — behaviour must not change)

Its own group deliberately: this touches the site's **only** scroll-position
indicator, and the requirement is that only its input changes.

- [x] 5.1 Introduce a `TimelineEntry` view-model (`id`, `label`, `meta`, `accessibleName`) in new `components/timelineEntries.ts`, with `experienceToTimelineEntry()`/`originsToTimelineEntry()` mapping functions and 6 unit tests (`timelineEntries.test.tsx`) — pure functions, no behaviour change yet since `CareerTimeline` doesn't consume them until 5.3
- [x] 5.2 Ran the existing timeline tests and `components/oneScrollIndicator.test.tsx` — 7/7 pass, confirmed **before** touching `CareerTimeline.tsx`
- [x] 5.3 `CareerTimeline` takes a new **optional** `origins?: Origins` prop (design decision, not in the original task wording: keeps `experiences` prop unchanged rather than renaming to `entries`, so every pre-existing call site and test — none of which pass `origins` — reproduces the exact prior behavior with zero edits, literally satisfying "unmodified" from task 5.2). Internally derives one uniform `entries: TimelineEntry[]` via `useMemo`, appending one origins node when the prop is present
- [x] 5.4 Added tests: exactly one origins node regardless of entry count (2-entry and 3-entry fixtures both produce 1 node); adding an entry does not change node count
- [x] 5.5 Added a test: renaming the origins record's `title`/`period` changes the rendered label/meta — proves nothing is hardcoded
- [x] 5.6 Confirmed the `IntersectionObserver` wiring, scroll listener, `aria-current`, and bottom-of-page fallback are **untouched in logic** — same functions, same rootMargin, same "scrolled to bottom wins" tie-break; only the loop variable changed from `experiences`/`experience` to `entries`/`entry` (and the observer callback's shadowed parameter renamed to `observerEntries` to avoid colliding with the new outer `entries`)
- [x] 5.7 Confirmed `oneScrollIndicator.test.tsx` still passes with no weakening — 2/2, unmodified

## 6. Render the section

- [x] 6.1 Create `components/OriginsSection.tsx` + `OriginsSectionStyles.ts`, following the `ProjectsSection` pattern, with `id="origins"` (matches the anchor used by origins chunks and the timeline node's id)
- [x] 6.2 Render the **two-beat structure**. **Schema addition beyond the original task list**: added an optional `phase: "self-taught" | "formal"` field to `OriginEntrySchema` so the grouping is content-driven rather than hardcoded ids or fragile positional logic in the component — consistent with this repo's content-first philosophy, and with the correction already made in Task Group 5 for `period`. Tagged all 4 real entries (`ccej`/`first-software-sale`/`calcom`: self-taught; `inegi`: formal) in `content/origins.yaml`. Component groups via `groupByPhase()`, with an unphased entry falling into a fallback "More" group rather than being silently dropped (covered by a dedicated test)
- [x] 6.3 Each entry uses `SectionReveal as="article"` (matches `ProjectsSection`'s per-card pattern); the section heading uses `RevealHeading`; no second motion system added to any element
- [x] 6.4 Mounted `OriginsSection` in `app/(marketing)/page.tsx` after `ProjectsSection` and before `ContactSection`. Also wired the `origins={origins}` prop into `CareerTimeline` here (Task Group 5's component change, completed now that a real page call site exists)
- [x] 6.5 Server-rendered content, no client-only gating — confirmed by reading the component (no `"use client"` directive, no client-only state)
- [x] 6.6 Confirmed no `--hair`/`border-hair` usage anywhere in `OriginsSectionStyles.ts` — trivially compliant, nothing to check against `palette.test.tsx`

## 7. Eval coverage (satisfies JOS-116's content-derived gate)

- [x] 7.1 Ran `npx vitest run lib/rag/eval-set.test.ts` **first**. **Discovered mid-task**: JOS-116's existing coverage gate derives only from `getExperiences()`/`getProjects()` — it didn't fail, because origins was never in its scope (origins didn't exist when JOS-116 was written). Added a **separate** content-derived coverage test scoped to `getOrigins()`, following the exact same principle — confirmed it fails, naming all 4 uncovered entry ids
- [x] 7.2 Added factual eval cases (`factual-17`–`20`) anchored to each origins entry: CALCOM/Norton Ghost, the $25 Clipper sale, CCEJ teaching, INEGI's vehicle-management system. **Also discovered and fixed**: the record's overall span ("1994 – 2006") was never retrievable at all — only per-entry periods were woven into chunks, and the top-level `origins.period` field was orphaned. Added a dedicated `origins-summary` chunk in `chunk.ts` to carry it, with its own tests
- [x] 7.3 Added `factual-21`: "How long has Jose been in technology?" expecting `"1994"` — now answerable because of the `origins-summary` chunk fix above
- [x] 7.4 Re-ran `eval-set.test.ts` — 9/9 pass, both coverage gates (chapters/projects and origins) satisfied
- [x] 7.5 Confirmed no eval case was weakened, and `grep` confirms no forbidden-substring list contains "Oracle" or any other ambiguous term

## 8. Review and Update Existing Unit Tests (MANDATORY)

- [x] 8.1 Ran the full suite (570/570 pass) and identified affected tests as described below
- [x] 8.2 Updated `components/accessibilityStructure.test.tsx`'s composed "key surfaces" test — added `OriginsSection` (and `origins` on `CareerTimeline`) to the fixture composition matching the real page's structure, and a heading assertion for "Origins" alongside Skills/Projects/Contact. This runs `axe` against the real composed structure including the new section, not just a smoke check
- [x] 8.3 Confirmed `components/anchorClearance.test.tsx` needs no change — it's a source-content check on the universal `[id] { scroll-margin-top }` rule, which already covers `#origins` and every per-entry id automatically by design
- [x] 8.4 Confirmed no test was weakened — every change to existing tests either added a new assertion (accessibilityStructure) or added an optional capability without touching existing assertions (CareerTimeline)

## 9. Run Unit Tests and Verify State (MANDATORY)

- [x] 9.1 Targeted: `npx vitest run lib/content/ lib/rag/eval-set.test.ts components/CareerTimeline.test.tsx components/oneScrollIndicator.test.tsx` — 93/93 pass
- [x] 9.2 Full suite: `npx vitest run --no-file-parallelism` — hit the documented `ChatWidget.test.tsx` timing flake on first run, confirmed flaky (not a regression) on a clean second run: 570/570
- [x] 9.3 `npx tsc --noEmit` — clean
- [x] 9.4 `npm run validate:content` — clean
- [x] 9.5 Database state verification: **N/A** — no backend/database in this repo (CLAUDE.md §9)
- [x] 9.6 Create report `openspec/changes/origins-earlier-career/reports/<date>-step-9-unit-test-and-state-verification.md`

## 10. Index rebuild and live eval (MANDATORY - AGENT MUST EXECUTE)

**This is the first corpus in which JOS-116's era-disambiguation cases are
non-trivial** — the legacy tooling they guard against now exists.

- [x] 10.1 `npm run build` — confirm `prebuild` re-embeds; expect the chunk count to rise from ~86 by roughly the number of origins entries — confirmed: 86 → 91 (4 origins entries + 1 `origins-summary` chunk)
- [x] 10.2 `npm run eval:chat` — capture the full graded result. **Discovered mid-task**: the first run showed zero origins chunks retrieved for any origins question. Root cause: `eval-run.ts`'s `getPlatformProxy()` ASSETS binding serves `.open-next/assets/rag-index.json`, a build artifact distinct from `public/rag-index.json` (which `npm run build`'s `prebuild` refreshes) — `.open-next/assets/` is only regenerated by `opennextjs-cloudflare build` (the first half of `npm run preview`), which nothing in this task list had run. Ran it directly, confirmed `.open-next/assets/rag-index.json` picked up all 91 chunks, re-ran `eval:chat` against the corrected index
- [x] 10.3 **Confirm the era-disambiguation cases still pass** with 1990s tooling present in the corpus. This is the single most important verification in this change — confirmed: `factual-14`/`factual-15` both pass, no legacy-tooling substrings leaked
- [x] 10.4 Confirm the new origins factual cases pass — took three eval-run iterations to land clean. Round 1 (5/5 origins cases failing): traced to the stale `.open-next/assets` index (10.2). Round 2 (after the index fix, 3/5 failing): `factual-19` (CCEJ), `factual-20` (vehicle-management) and `factual-8`'s pre-existing flake cleared on their own; three genuine gaps remained — `factual-17`'s "earliest process improvement" framing was ambiguous and a correctly-functioning retrieval resolved it to a different, chronologically-earlier origins entry than intended; `factual-21` ("how long has Jose been in technology") failed because the `origins-summary` chunk ranked #7, just outside `k=5`; `factual-18` retrieved the right content and stated the fact correctly but in a paraphrased form ("twenty-five US dollars") that missed the literal `"$25"` substring check. **Design decision (design.md Decision 8)**: raised `k` from 5 to 7 in `generate.ts`. **Eval authoring fix, round 1**: reworded `factual-17` toward "standardizing a process across an entire organization" and loosened `factual-18` to `"twenty-five"`. Round 3 (2/21 still failing): the round-1 reword of `factual-17` collided even harder — that phrasing matches the site's professional skills content (people-leadership, technical-program-leadership use near-identical language for the same pattern at Oracle/TCS) and origins-calcom dropped to rank 23; `factual-21` passed retrieval (origins-summary now present) but the model answered with "since he was 13" rather than the literal "1994", both valid given the context. **Eval authoring fix, round 2**: reworded `factual-17` to name CALCOM and the 300-machine order directly (matching this eval set's existing style of naming specifics, e.g. `factual-9`'s "Guadalajara office") — probed to confirm `origins-calcom` ranks #1 before committing; reworded `factual-21` to ask for the year specifically rather than duration, pulling toward the chunk's explicit "(1994 – 2006)" framing. Round 4: all 21 factual cases pass, `shipReady: true`
- [x] 10.5 Confirm all trap and injection cases still refuse — 6/6 trap, 7/7 injection, both runs
- [x] 10.6 Compare against the previous baseline (`lib/rag/eval-report.json`); classify every changed result as improvement, neutral movement, or regression — see report
- [x] 10.7 **Stop and report** if an era-disambiguation case fails — that is JOS-116's guard firing correctly and needs a retrieval fix, not a weakened test — did not fire; era-disambiguation held throughout
- [x] 10.8 Create report `openspec/changes/origins-earlier-career/reports/<date>-step-10-index-rebuild-and-eval.md`

## 11. Manual Endpoint Testing with curl (MANDATORY if applicable)

- [x] 11.1 Start the dev server; `curl` the chat endpoint asking "how long has Jose been in technology?" — confirm the answer reaches 1994 — confirmed: answer states "1994–2006" and "since he was 13"; a repeat call answered with the age framing only ("since he was 13") without stating the year, matching the phrasing non-determinism found and addressed in Task Group 10's `factual-21` eval fix — the year is groundable and retrievable (proven by the eval and by this call), not always the model's default phrasing for an open-ended "how long" question
- [x] 11.2 `curl` "what is Jose's cloud experience?" — confirm **no** 1990s tooling appears — confirmed: answer cites only OCI and OCI AI/LLM Services, no Novell/HP-UX/Windows 95/Clipper
- [x] 11.3 Document commands and responses in the Step 12 report

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 12.1 Start the dev server and drive a real browser via Claude in Chrome
- [x] 12.2 **Verify the rail fits.** 8 nodes ≈ 745px against a 779px viewport — the margin is thin (design.md Risks). Confirm every node is visible and reachable; check a shorter viewport too. **Discovered mid-task, more severe than "thin margin"**: at the literal 779px viewport, the rail's topmost node ("Oracle Corporation") was visually obscured behind `SiteHeader`'s fixed band — not just tight, its label was nearly invisible under the nav row. Measured via JS: real rail height 721px (design.md's 745px was an estimate), header height 96px (`h-14`+`h-10`), giving a header collision of ~67px at 779px viewport height. Presented to the user (AskUserQuestion) rather than deciding unilaterally, since it's a layout-affecting change; chose "fix now." **Fix (design.md's Decision 8 companion — see `CareerTimelineStyles.ts`)**: `timelineNavClass`'s `md:top-1/2` changed to `md:top-[calc(50%+3rem)]`, shifting the rail's centering point down by half the header height so it centers in the space *below* the header rather than the full viewport. Reduces the collision from ~67px to ~19px at the exact 779px figure (verified via live DOM measurement, not just the math); viewports ≥817px (header + rail height) have zero collision. The residual ~19px at the extreme edge case is the exact "containment strategy" design.md's Risk section already deferred as work the *next* rail addition would need regardless — not new scope. Every node visible and reachable at realistic viewport heights (verified ~830px+); `oneScrollIndicator.test.tsx` and `CareerTimeline.test.tsx` re-run clean after the fix (22/22 pass)
- [x] 12.3 Click the Origins node; confirm it scrolls to the section with header clearance intact — confirmed: URL updates to `#origins`, heading fully visible below the header via the universal `scroll-margin-top` rule
- [x] 12.4 Confirm `aria-current` moves to the Origins node when the section is in view, and that no second scroll indicator appeared — confirmed via JS: exactly one `[aria-current="location"]` element in the DOM, pointing to `#origins`
- [x] 12.5 Read the rendered section critically: does it read as a differentiator or as padding? Per design.md Risks, if it reads as filler, **cut entries rather than soften the framing** — CALCOM/Ghost and INEGI-durability carry the section — read in full in a real browser: it reads as a differentiator. The CALCOM/Norton Ghost story (300-machine rollout, adopted across every branch) and INEGI's "still in production twenty years later, in 2026" both land with specific, verifiable weight; the two-beat structure (self-taught → formal) gives the credential-after-practice arc real shape rather than a list. No cuts needed
- [x] 12.6 Open the chat widget and ask an origins question; confirm a grounded, era-appropriate answer — asked "What did Jose do before his career at IBM in 2006?" through the real UI; answer correctly summarized CCEJ, the CALCOM 300-machine rollout, and INEGI, citing `#origins` among its sources
- [x] 12.7 Screenshot captured and saved to disk — 3 screenshots saved (chat widget with origins answer, rail after the header-clearance fix, ADEHub/Projects section mid-scroll)
- [x] 12.8 Create report `openspec/changes/origins-earlier-career/reports/<date>-step-12-browser-verification.md`, including the curl results

## 13. Build sanity

- [x] 13.1 `npm run build` succeeds — confirmed, clean
- [x] 13.2 Confirm no dependency change: `git diff main --stat -- package.json package-lock.json` is empty — confirmed empty
- [x] 13.3 Re-measure via `npx wrangler deploy --dry-run` — expect flat against the ~1521 KiB baseline; the index ships via Static Assets, so corpus growth must not move the Worker figure — confirmed: 1522.20 KiB gzip, flat as expected. Noted the pre-existing `direct-eval` esbuild warning in `.open-next/server-functions/default/handler.mjs` — matches the dev-mode "eval() is not supported" console warning seen in Task Group 12's browser verification, confirming it's an OpenNext/esbuild bundling characteristic unrelated to this change, not a regression

## 14. Update Technical Documentation (MANDATORY)

- [x] 14.1 Update `AGENTS.md` §9 with the origins content type, why it is not `content/experience/*.yaml` (the chapter test **and** the rail constraint), and the `TimelineEntry` view-model — added, cross-referencing design.md Decision 4
- [x] 14.2 Record the rail's headroom: 8 nodes against a 779px viewport is thin, and the next rail addition needs a containment strategy regardless — updated with the real finding from Task Group 12: not just thin, a genuine collision below ~817px viewport height even after the Decision 9 fix; flagged for whoever adds the next node to check the live rail height against header height + target viewport before assuming a CSS offset is enough
- [x] 14.3 Record the two editorial invariants where a future implementer would look before violating them: **legacy tooling never becomes a skill**, and **no birth date in `/content`** — added, with the `validate.ts`/`skills.yaml` enforcement mechanism noted for the first invariant. Also documented in `AGENTS.md` (not originally scoped by this task, but discovered and load-bearing for future work): the `k=5→7` re-evaluation (Decision 8) and the `.open-next/assets` staleness gotcha (Task Group 10) that any future content-then-eval workflow needs to know about

## 15. OpenSpec sync

- [x] 15.1 **After merge**, sync `specs/origins-narrative/` (new capability) and the `career-timeline-navigation`, `content-indexing-pipeline`, `chatbot-eval-and-ship-gate` deltas into `openspec/specs/` — created `openspec/specs/origins-narrative/spec.md` (6 requirements); merged 2 MODIFIED + 1 ADDED requirement into `career-timeline-navigation`; 1 ADDED into `content-indexing-pipeline`; 2 ADDED into `chatbot-eval-and-ship-gate`. All four `openspec validate --strict` clean
- [x] 15.2 Verify `career-timeline-navigation`'s single-scroll-indicator guarantee survived the sync unmodified — confirmed word-for-word intact in the synced spec text, plus `npx vitest run components/oneScrollIndicator.test.tsx components/CareerTimeline.test.tsx` — 12/12 pass
- [x] 15.3 Archive this change (per CLAUDE.md §10 / `opsx:archive`)
- [x] 15.4 Comment on JOS-115 in Linear that origins has landed — posted, confirming the OpenSpec sync and archive
