---
description: This document contains all development rules and guidelines for this project, applicable to all AI agents (Claude, Cursor, Codex, Gemini, etc.).
alwaysApply: true
---

## 1. Core Principles

- **Small tasks, one at a time**: Always work in baby steps, one at a time. Never go forward more than one step.
- **Test-Driven Development**: Start with failing tests for any new functionality (TDD), according to the task details.
- **Type Safety**: All code must be fully typed.
- **Clear Naming**: Use clear, descriptive names for all variables and functions.
- **Incremental Changes**: Prefer incremental, focused changes over large, complex modifications.
- **Question Assumptions**: Always question assumptions and inferences.
- **Pattern Detection**: Detect and highlight repeated code patterns.

## 2. Language Standards
- **English Only**: All technical artifacts must always use English, including:
    - Code (variables, functions, classes, comments, error messages, log messages)
    - Documentation (README, guides, API docs)
    - Jira/Linear tickets (titles, descriptions, comments)
    - Data schemas and database names
    - Configuration files and scripts
    - Git commit messages
    - Test names and descriptions

## 3. Specific standards

**Single source of truth**: [Base Standards](./docs/base-standards.md) is the canonical foundation for all project standards. Load it first; when any other document conflicts with it, base standards win.

For detailed standards and guidelines specific to different areas of the project, refer to:

- [Base Standards](./docs/base-standards.md) - Canonical, single source of truth for all standards
- [Backend Standards](./docs/backend-standards.md) - API development, database patterns, testing, security and backend best practices
- [Frontend Standards](./docs/frontend-standards.md) - React components, UI/UX guidelines, and frontend architecture
- [Documentation Standards](./docs/documentation-standards.md) - Technical documentation structure, formatting, and maintenance guidelines, including AI standards like this document
- [OpenSpec Tasks Mandatory Steps](./docs/openspec-tasks-mandatory-steps.md) - Required checklist and execution rules when creating or updating OpenSpec `tasks.md` files

Reference specifications:

- [API Spec](./docs/api-spec.yml) - API contract
- [Data Model](./docs/data-model.md) - Data model

## 4. Project Skills

- Skills live in `ai-specs/skills`.
- When a request matches a skill, load and follow the corresponding `SKILL.md` automatically before continuing.
- Also load any referenced files in the skill folder (for example, `references/*.md`) when the skill requires them.

## 5. Planning Model Requirement

Planning workflows must run with Opus high reasoning.

This requirement applies to:
- `enrich-us`
- `openspec-ff-change`
- `openspec-continue-change`

Before starting any of these workflows, verify the session is using Opus high reasoning. If it is not, **self-correct** by adding `"model": "claude-opus-4-7"` to `.claude/settings.json` (use the `update-config` skill or edit directly), then continue — do not stop and ask the user. Do the same to come back to sonnet medium for any other step.

## 6. Symlink Integrity and Multi-Agent Portability

- **Canonical Source**: Keep reusable artifacts in `ai-specs` as the canonical source. Agent-specific paths (such as `.claude` and `.cursor`) should reference them through symlinks when possible.
- **Update Safety**: Whenever a file is renamed, moved, or its suffix changes, verify and update all symlinks that target it before considering the change complete.
- **New Artifact Linking**: Whenever creating a new artifact that requires multi-agent exposure (for example new agents or skills in `ai-specs`), create the corresponding symlinks from the expected agent-specific reference paths.
- **External Customization Review**: Whenever customization is introduced outside `ai-specs`, evaluate whether it should be moved into `ai-specs` and replaced with symlinks from the original locations.
- **Completion Gate**: A change is incomplete if it leaves broken symlinks, stale targets, or duplicated canonical artifacts across agent-specific folders.

## 7. Mandatory OpenSpec Artifact Updates for Post-Apply Changes

When a new fix/change request appears after `opsx:apply` (or `/apply`) and before `opsx:archive` (or `/archive`), agents must treat it as a spec update first, not as an informal "fix this quickly". It's the core principle of openspec, documentation is the source of truth.

Required order:

1. Update the current OpenSpec change artifacts that are affected (for example: scenarios, requirements/specs, and `tasks.md`). Don't add tasks as "bugfixes" but as part of the initial design, thus in the proper section
2. If artifact regeneration is needed, run the corresponding OpenSpec step (`opsx:continue`, `opsx:ff`, or equivalent) before coding.
3. Implement code only after artifacts reflect the new request.
4. Re-run verification against the updated artifacts before archiving.

Do not apply direct code-only fixes in this window without updating OpenSpec artifacts.

## 8. Development Commands

```bash
npm install
npm run dev              # Next.js dev server
npm run build             # production build — requires OPENAI_API_KEY (see below)
npm run start              # serve the production build
npm run lint                 # ESLint
npm test                      # Vitest suite (run once, no watch)
npx vitest                     # Vitest in watch mode
npx vitest run path/to/file.test.ts        # single file
npx vitest run -t "test name substring"       # single test by name
npx tsc --noEmit                                # strict-mode type check
npm run validate:content                         # content-schema gate (see below)
```

There is no `test:watch` or `test:coverage` script — use the `npx vitest` forms above.

`npm run build` runs a `prebuild` chain — `lib/rag/embed.ts` regenerates the
chatbot's static retrieval index (`lib/rag/index.json`, gitignored) from current
`/content` on every build (see `openspec/changes/archive/*-build-time-content-indexing-pipeline/`),
`lib/rag/publish-index.ts` copies it to `public/rag-index.json` so it ships as
a static asset rather than bundled JS (`openspec/changes/reduce-worker-bundle-size`
— the index is ~30% of the Worker's gzipped size by itself, embeddings compress
poorly), `lib/site-config/build.ts` derives a small request-time-safe config
slice, and `lib/seo/generate-og-image.ts` renders the OpenGraph share card to
`public/og-image.png` (`next/og`'s `ImageResponse`, `React.createElement` not
JSX — this script runs under `node --experimental-strip-types`, which strips
types but doesn't transform JSX). The first step requires `OPENAI_API_KEY`:
locally via `.env.local` (loaded automatically with `--env-file-if-exists`,
gitignored, never commit it), and in the Vercel project's build environment
for production deploys. Without it, `npm run build` fails fast with a clear
error before `next build` runs — `npm run dev`, `npm test`, `npx tsc --noEmit`,
and `npm run validate:content` are all unaffected.

## 9. Architecture

This is **CareerDNA**: Jose Muñoz's interactive professional profile, built as
a static-first Next.js (App Router) site. Full product spec: `docs/PRD.md`.
Repo layout notes: `README.md`.

**Content-first design.** `/content` (YAML + Markdown) is the single source
of truth for profile data — career chapters, projects, skills, FAQ — kept
strictly separate from `/components`. This same content is meant to back a
planned RAG chatbot (PRD §5/§7), so content shape and evidence-linking
integrity matter beyond rendering.

- `lib/content/schemas.ts` — Zod schemas defining the content contract.
- `lib/content/read.ts` — reads/parses `/content` at request/build time via
  `process.cwd()` (not `import.meta.dirname` — this module is bundled into
  Next.js, unlike `validate.ts`/`cli.ts` which only run via raw `node`).
- `lib/content/validate.ts` (+ `lib/content/cli.ts`) — build-time gate
  (`npm run validate:content`) that fails non-zero on missing fields,
  dangling skill→evidence references, or malformed dates. Run this after any
  `/content` edit.
- `components/` — presentational layer consuming the typed content (e.g.
  `CareerChapters.tsx` renders `getExperiences()` output as native
  `<details>`/`<summary>` chapters — chosen for free keyboard operability and
  no-JS readability over a custom button + ARIA state approach).
- `lib/rag/models.ts` — single source of truth for the active LLM and
  embedding model identifiers (`OPENAI_MODEL`, `EMBEDDING_MODEL`). Any
  self-describing content (e.g. `content/meta.md`) gets model names injected
  from here at chunk-build time — never hardcoded — so it can't drift when
  `lib/rag/active-provider.ts`'s provider swap changes the active model.
  `lib/rag/generate.ts` imports `EMBEDDING_MODEL` from here directly, not via
  `embed.ts`'s re-export — a mixed value+type import from `embed.ts` pulls
  its entire build-time-only CLI script into the runtime Worker bundle,
  since a bundler can't tree-shake `main()` out when it's referenced by
  module-scope code (`openspec/changes/reduce-worker-bundle-size`).
- `lib/rag/retrieve.ts`'s `loadIndex()` fetches the retrieval index via the
  Cloudflare Workers Static Assets binding (`getCloudflareContext().env.ASSETS`),
  not a build-time `import()` — the index is ~30% of the Worker's own
  gzipped size by itself (embeddings compress ~5:1, vs. ordinary JS's
  ~16:1), and Static Assets carries no comparable limit. `lib/rag/publish-index.ts`
  (run in `prebuild`) is what puts the index at `public/rag-index.json` as a
  static asset from `embed.ts`'s canonical output. Cached per Worker isolate
  (module-level variable) so a chat request doesn't re-fetch it every time.
- **Career-chapter chunks are self-describing in time and attribution**
  (`chatbot-era-collision-guard`, JOS-116). `lib/content/chunk.ts`'s
  `chapterFramingPrefix()` prefixes the technologies, actions, leadership,
  and lessons chunks with `"{role} at {company} ({dateRange})"`, reusing
  `renderDateRange()` so the form matches the `-mission-dates` chunk. Two
  problems this fixes: (1) *era collision* — the technologies chunk had no
  date at all, so a legacy-tooling chunk (once JOS-115 adds 1990s content)
  would compete on equal footing with current tooling for a "what's his
  cloud experience?" question; (2) *orphaned chunks* — the actions,
  leadership, and lessons chunks were bare joined strings with no company or
  role, so a retrieved one carried no indication of which chapter it
  belonged to. `-context` and `-mission-dates` were left untouched (already
  attributed); `-project-N` is out of scope. **`MIN_CHUNK_LENGTH` is
  measured against a chunk's authored content, excluding this generated
  prefix** — the prefix alone is long enough to push a thin chapter's body
  over the 60-char threshold, which would silently turn the thin-content
  guard into a tautology; `chunk.test.ts` strips the prefix (via the
  exported `chapterFramingPrefix()`) before measuring. `k` in
  `retrieve.ts`/`generate.ts` was deliberately left at 5 — "only tune what
  the evals show is needed, don't tune blind" — since at 86 chunks the
  crowding risk is a projection, not yet a measurement; re-evaluate once
  JOS-115/117/118 land.
- `lib/rag/eval-run.ts`'s `initCloudflareContextForScript()` is a **required
  prerequisite**, not incidental scaffolding: `loadIndex()` needs
  `getCloudflareContext()`, whose context is normally supplied by
  `initOpenNextCloudflareForDev()` in `next.config.ts` — but that function
  silently no-ops outside Next's own dev-server process (it gates on
  `globalThis.AsyncLocalStorage`, set only by Next's boot sequence), so
  `npm run eval:chat` cannot reach it as a standalone script. This function
  replicates what `initOpenNextCloudflareForDev` does when its gate passes:
  gets real local bindings via wrangler's public `getPlatformProxy()` API
  and stores them under the same well-known global symbol
  (`Symbol.for("__cloudflare-context__")`) that `getCloudflareContext()`
  reads from. Found broken (this call was missing) two days after JOS-106
  moved the index behind the Assets binding; no change in between had
  actually run `eval:chat` end-to-end. Scoped entirely to this script —
  `retrieve.ts` and the production `/api/chat` route are unaffected.
- `lib/fonts.ts` — the site's typeface, loaded via `next/font/local` (not
  `next/font/google`: Google's typed API can't pin a specific width-axis
  value, only the full variable range or the default width — see
  `openspec/changes/site-typography-and-palette/design.md` Decision 2). Two
  self-hosted static instances live in `fonts/` at the repo root. Applied to
  `<html>` in **both** root layouts (`app/(marketing)/layout.tsx` and
  `app/admin/layout.tsx`) from this one shared module — each layout is
  independent and each imports `globals.css` separately, so the font
  variable class must not be duplicated per layout.
- `app/globals.css`'s `:root` block — single source of truth for the site's
  bounded palette (`--ink`, `--ink-body`, `--ink-meta`, `--hair`, `--accent`)
  and font-role tokens (`--font-sans`, `--font-display`). Every color was
  measured (WCAG 2.1) against the real page background before being
  written; `--hair` is deliberately below the normal-text AA threshold and
  is restricted to borders/rules — never text (regression-tested in
  `components/palette.test.tsx`). `--accent` is necessarily duplicated in
  `components/HeroShellStyles.ts`'s `heroLaptopAccentHex` (JOS-105): CSS
  can't `var()`-reference a JS constant, and Tailwind's JIT can't compile an
  arbitrary-value class built from one — the same test file guards against
  the two drifting apart. The same file's `[id] { scroll-margin-top }` rule
  (JOS-109) applies fixed-header clearance to every in-page anchor at once,
  deliberately universal rather than per-target — see
  `components/anchorClearance.test.tsx`.
- `components/SiteHeader.tsx` / `siteNavigation.ts` — the persistent site
  header (brand, section nav, contact pill), mounted only in
  `app/(marketing)/layout.tsx` (never `/admin`). `siteNavigation.ts` is the
  single source of the header's nav items, consumed by both the header and
  its own anchor-resolution test. **`CareerTimeline` is the site's one and
  only scroll-position indicator** — the header never introduces a second
  one; this is enforced in spec (`openspec/specs/site-editorial-frame/spec.md`,
  the `Requirement: The frame introduces no second scroll-position indicator`),
  not just remembered, and regression-tested in
  `components/oneScrollIndicator.test.tsx`. The frame's decorative grid
  overlay (`GridOverlay`, two vertical hairlines plus a rule under the
  header) was removed outright (`openspec/changes/remove-grid-overlay`,
  JOS-113) — the header is now deliberately edgeless, relying on
  `bg-background/90 backdrop-blur-sm` alone to stay legible over content
  scrolling beneath it; nothing replaces the removed rule.
- `components/AmbientSparkleLayer.tsx` — the ambient particle field (JOS-110),
  a single `<canvas>` with `globalCompositeOperation = "lighter"` for
  additive glow, mounted in `app/(marketing)/layout.tsx` after `HeroLaptop`.
  **Must stay above the hero laptop layer and its scrim, never inside it or
  beneath it** — placing it under the
  scrim was measured to cut its visible contribution by ~80% (+221 → +43
  levels over the background), which is exactly the reasoning that got
  JOS-105's light ⑤ removed for being indistinguishable from nothing;
  see `openspec/changes/ambient-sparkle-layer/design.md` Decision 2 before
  moving this component. Pure simulation logic lives separately in
  `lib/particles/simulation.ts` (no canvas dependency, directly testable).
  The loop stops on tab-hidden, on scrolling out of view
  (`IntersectionObserver`, same pattern `CareerTimeline.tsx` established),
  and on unmount — this is the first continuously-running surface on the
  site, so those three stop conditions are the substance of the component,
  not polish (`components/AmbientSparkleLayer.test.tsx`).
- **Scroll-triggered content reveals** (JOS-111) — `components/useRevealOnScroll.ts`
  is the shared one-shot reveal hook (`IntersectionObserver` + a scroll-listener
  fallback, mirroring `CareerTimeline.tsx`'s own dual-trigger pattern):
  `revealed` starts `false` and only ever transitions to `true`, once, never
  back. Two consuming components build on it: `SectionReveal.tsx` (a
  polymorphic whole-block fade+rise — `as="div"|"details"|"li"|"article"`, so
  it never inserts an extra wrapper element that would break sibling-position
  CSS like `first:`/`last:`) and `RevealHeading.tsx` (a per-character
  blur-up cross-fade, restricted to short section headings only — Skills,
  Projects, Contact). **Reveals are scoped to headings and section
  entrances, never to substantive content** — chapter body text, dates,
  role descriptions, metrics, and skill evidence links are never
  individually gated, so in-page find and a fast scroll both still work
  (`openspec/specs/site-scroll-reveal/spec.md`, synced from
  `openspec/changes/archive/2026-08-15-scroll-reveal-motion/design.md`
  Decision 3). Fail-visible by construction: SSR/default
  state is fully visible (`opacity:0` is only ever an *animated* starting
  point, never a conditional render), and one shared `<noscript>` override
  (`RevealStyles.ts`'s `revealNoscriptOverrideCss`, wired into
  `app/(marketing)/layout.tsx`) forces full visibility when JavaScript never
  runs. `RevealHeading.tsx`'s ghost (blurred) and sharp copies are
  deliberately **not** DOM siblings within one shared per-character wrapper —
  real-browser testing found that shape breaks native double-click/triple-click
  word-selection on the revealed heading; the ghost layer lives in its own
  separate absolutely-positioned overlay instead, layered behind an
  uninterrupted run of sharp-copy character spans.
- **Page-load arrival sequence** (JOS-112) — `components/ArrivalSequenceProvider.tsx`
  (`ArrivalSequenceProvider` + `useArrivalStep`) orchestrates the hero's
  first ~2s: elements enter in a defined order with overlapping timing
  (`components/arrivalSequence.ts`'s `ARRIVAL_STEP_DELAYS`, each a fraction
  of the shared `pace.duration` token, non-text steps before text steps)
  rather than each fading in independently on its own schedule. `arrived`
  starts `false` (matching SSR) and is flipped once by a mount effect —
  same starts-false-flips-once shape as `useRevealOnScroll`, on a timer
  rather than an `IntersectionObserver`, since an arrival sequence has
  nothing to observe. **One owner per element's entrance**: an element
  choreographed by this sequence must not also be claimed by the
  scroll-reveal system (`SectionReveal`/`RevealHeading`) — checked before
  adding a new motion system to a hero element
  (`openspec/specs/site-arrival-sequence/spec.md`, "Each element's entrance
  is owned by exactly one motion system"). Deep-linked loads (a URL
  fragment targeting a real element) skip the full choreography and render
  directly in final state (`arrivalSequence.ts`'s `detectDeepLinkSkip`) —
  the browser's native anchor scroll is never touched, so this can't fight
  scroll restoration. Plays on every load and persists nothing (no cookie,
  no `localStorage`/`sessionStorage`), matching `lib/session.ts`'s own
  deliberate in-memory-only convention. Fail-visible: the mount effect's
  risky call is wrapped in `try/catch`, not `try/finally` — a `finally`
  block runs its cleanup but does not stop the original exception from
  propagating, which real-browser testing confirmed React then surfaces as
  an uncaught error rather than the page simply rendering visible.
  Deliberately does **not** choreograph `GridOverlay` — it was slated for
  removal (JOS-113) at the time this sequence was built, so treating it as
  already absent avoided writing a choreography step for a component known
  to be going away.

**Stack choices worth knowing before changing them:**
- Framer Motion was selected over GSAP ScrollTrigger via a comparative spike
  documented in `openspec/changes/archive/2026-07-19-motion-library-spike/`.
- `typescript` is pinned at `5.9.3` because Next.js 16.2.10's build tooling
  is not yet compatible with TypeScript 7 — don't bump it without re-checking.
- Tests use Vitest. Component tests opt into a `jsdom` environment per file
  via a `// @vitest-environment jsdom` pragma (Vitest 4's
  `environmentMatchGlobs` isn't available in the pinned version); content/lib
  tests stay on Vitest's default `node` environment.

**Not yet built (see PRD for design intent):** the RAG chatbot API route,
analytics event store, and admin insights dashboard. There is currently no
backend/database in this repo — everything ships as static content plus
React components.

**Stale docs — do not trust for this repo's actual stack:**
`docs/backend-standards.md`, `docs/frontend-standards.md`, and
`docs/development_guide.md` describe a different, unrelated project's stack
(Express/Prisma/PostgreSQL backend, Bootstrap/Cypress/React Router frontend).
They predate CareerDNA and have not been reconciled with it. Prefer
`docs/base-standards.md`, `docs/PRD.md`, `docs/data-model.md`, and this file
for anything specific to this repo; treat the other two `*-standards.md`
files as generic-practice reference only, not a description of this codebase.

## 10. OpenSpec

Spec-driven workflow lives in `openspec/` (`openspec/specs/` = current
accepted specs, `openspec/changes/` = in-flight or archived change
proposals). Use the `opsx:*` skills/commands for propose/explore/apply/sync/
archive rather than editing these by hand.

