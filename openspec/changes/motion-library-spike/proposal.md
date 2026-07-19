## Why

PRD v1.1 §8 leaves the motion library an open choice between GSAP ScrollTrigger and Framer Motion, to be resolved by a week-1 spike before any animated section is built — §12 names unresolved motion-polish decisions as a schedule risk. Every subsequent animated story (2.3 signature sequence, 3.1–3.3 timeline/chapters) depends on this choice existing first. This is also the first story requiring a renderable UI at all — no application framework has been scaffolded yet — so resolving it now unblocks both the motion decision and PRD §11 Phase 0's "repo, stack decisions" milestone item.

## What Changes

- Scaffold the real Next.js application (App Router, per PRD §8) into the existing repo root, alongside the content-model tooling already there — not a throwaway prototype harness. This becomes the actual site going forward.
- Set up Tailwind CSS (PRD §8's styling choice) as part of this same stack-decision work.
- Build two working implementations of the same signature hero sequence — one with GSAP ScrollTrigger, one with Framer Motion — against real content (name/positioning from `content/profile.yaml`), to make the comparison evidence-based rather than arbitrary.
- Measure both against PRD §9's performance budget as far as this environment allows, and record the results honestly, including any measurement that couldn't be completed.
- Select one library, document the rationale, and remove the other's dependency from the final `package.json`.
- **Explicitly out of scope**: Story 2.2's full hero content acceptance criteria (all CTAs wired, no-JS readability fallback, exact copy requirements) and Story 2.3's full signature-animation acceptance criteria (reduced-motion alternative, final polish) — this spike demonstrates one working sequence over realistic content, it does not ship the finished hero. No routing or scaffolding for any other page or the future chat API route.

## Capabilities

### New Capabilities
- `motion-library-decision`: the evidence-based selection of a scroll/animation library for the site, backed by a working comparative prototype and a recorded performance measurement, that all future animated stories build on.

### Modified Capabilities
<!-- None: content-model, content-validation, and chapter-content-template have not been archived into openspec/specs/ yet — no baseline exists to diff against, consistent with all three prior changes in this project. This change also doesn't touch content — it's the first change to introduce application/UI code. -->

## Impact

- **Affected code**: adds the Next.js App Router scaffold (`app/`, `next.config`, Tailwind config) to the existing repo root; merges framework dependencies into the existing `package.json` (currently holding only content-model tooling: TypeScript, Vitest, Zod, yaml, gray-matter). Adds both `gsap` and `framer-motion` temporarily for comparison; removes the losing library's dependency once a decision is made.
- **Affected docs**: a spike report recording the comparison, the decision, and the performance measurement (or its documented limitations), per this repo's `type:spike` Definition of Done (findings/trade-offs/recommendation, decision on next steps, time spent).
- **Downstream dependents**: unblocks Story 2.3 (signature animation), and any later story touching scroll-driven storytelling (3.1–3.3). Story 2.2 will build the finished hero content on top of the app scaffold and chosen library this change establishes.
- **First-of-its-kind risk**: this is the first change introducing a UI framework, build tooling beyond `tsc`/Vitest, and a browser-rendered surface — resolved in design.md rather than assumed silently, per explicit user decision to scaffold the real app now rather than a disposable harness.
