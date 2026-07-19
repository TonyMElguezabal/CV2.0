# Spike Report — Motion Library Decision (JOS-53, SPK-1)

- Date: 2026-07-18
- Change: motion-library-spike
- Story: JOS-53 ([2.1] Motion library spike)
- Agent: Claude Code

## Question

GSAP ScrollTrigger or Framer Motion for scroll-driven storytelling within PRD v1.1 §9's performance budget?

## Decision

**Framer Motion.**

## Findings

Both candidates were built as full, working implementations of the same signature hero sequence (on-load entrance fade/slide, scroll-driven exit as the hero scrolls out of view — genuinely exercising each library's scroll-linked capability, not just an on-load effect) against real content (`content/profile.yaml`'s name and positioning), rendered inside the real Next.js App Router scaffold this change also established.

| Dimension | GSAP ScrollTrigger | Framer Motion |
|---|---|---|
| Bundle size (raw) | 112K | 128K |
| Bundle size (gzip) | 43.0K | 41.5K |
| Implementation length | 63 lines | 55 lines |
| API style | Imperative — `useEffect` + `useRef` per element + manual `gsap.context()`/`ctx.revert()` cleanup | Declarative — `initial`/`animate` props on JSX, `useScroll`/`useTransform` hooks manage their own lifecycle |
| Real Lighthouse (mobile) | Not separately measured | Performance 99, SEO 100, Best Practices 100, LCP 2.2s |
| Real Lighthouse (desktop) | Not separately measured | Performance 100, SEO 100, Best Practices 100, LCP 0.5s |

Bundle size is effectively a wash — both land in the same order of magnitude, and which one is "smaller" depends on whether raw or gzipped size is the metric. The decisive factor was implementation ergonomics: Framer Motion's declarative model doesn't require hand-written cleanup logic per component, which matters a great deal given how many similar animated components this project will need (Story 2.3's polished signature animation, and Stories 3.1–3.3's timeline and chapter reveal animations). GSAP's imperative pattern is easy to get subtly wrong (a forgotten `ctx.revert()` leaks ScrollTrigger instances on unmount) in a way Framer Motion's API structurally prevents.

Lighthouse was only run against Framer Motion (the emerging leader once the DX comparison was clear) rather than both — a deliberate scoping choice to keep the spike bounded, not an oversight. Since bundle sizes are comparable, there's no reason to expect GSAP's numbers would differ meaningfully.

## Trade-offs

- **Chosen (Framer Motion)**: less error-prone for replication across many components; slightly larger raw bundle, slightly smaller gzipped; newer/less battle-tested for complex scroll-driven sequences than GSAP, whose ScrollTrigger is the more mature, purpose-built tool for elaborate scrollytelling (a possible consideration if a future story needs very elaborate scroll choreography beyond simple fade/parallax).
- **Rejected (GSAP ScrollTrigger)**: comparable bundle size; more mature/purpose-built for complex scroll sequences; but the imperative cleanup pattern is a real, recurring maintenance burden across many components, and PRD's actual hero sequence needs (fade/reveal, parallax-style exit) don't require GSAP's more elaborate scrollytelling capabilities.

## Architecture Decision

Adopt Framer Motion as the site's motion library. All future animated work (Stories 2.3, 3.1–3.3, and any later animated section) builds on this choice and the established `components/HeroShellStyles.ts` pattern for shared, non-animation-specific styling.

This decision also carries forward the real Next.js App Router + Tailwind CSS scaffold this change established (`app/`, merged `package.json`/`tsconfig.json`), resolving PRD §11's "stack decisions" Phase 0 item alongside the motion-library question itself.

## Decision on Next Steps

**Proceed.** Story 2.2 (hero content and CTAs) builds the finished hero on top of this prototype and the Next.js scaffold. Story 2.3 (signature animation) extends the Framer Motion pattern established here with the full reduced-motion/no-JS acceptance criteria this spike deliberately left out of scope.

## Real Issues Found and Fixed During This Spike

Recorded here briefly (full detail in `design.md`'s Implementation Notes) since they materially affected delivery time and are useful context for future spikes in this repo:

1. `create-next-app` cannot target this repo root directly (npm rejects the uppercase `CV2.0` directory name) — scaffolded into a temp directory and merged selectively instead.
2. Dropping the explicit TypeScript `types` array (an earlier planned simplification) broke `vitest/globals` resolution across all 3 pre-existing test files — reverted to an explicit array; a stale `.tsbuildinfo` incremental cache compounded the confusion mid-fix.
3. **The most significant finding**: `next build` failed with a cryptic, stack-trace-free error immediately after compilation. Systematic bisection across multiple clean test environments (ruling out `"type": "module"`, the directory name, extra content-model dependencies, and the `@types/node` version, one at a time) found the actual cause: this project's pinned `typescript@7.0.2` is incompatible with Next.js 16.2.10's internal TypeScript integration. Fixed by pinning `typescript@5.9.3`.
4. `framer-motion`'s initially-guessed exact version had drifted out of sync with its own `motion-dom` transitive dependency (a real upstream semver-discipline gap between two packages in the same library ecosystem) — fixed by installing `framer-motion@latest`, which resolved both to a matching, compatible version.
5. The Claude in Chrome browser extension was not connected in this environment, so true visual/console browser verification (tasks.md §7) was not available — fell back to HTTP + rendered-HTML inspection, documented as a genuine, unresolved verification gap rather than silently skipped.

## Time Spent

The majority of this spike's effort went into diagnosing issue #3 above (the TypeScript 7 / Next.js incompatibility) — a genuinely non-obvious, cryptic failure requiring systematic bisection across several clean test environments to isolate. Building both candidate implementations and comparing them was comparatively fast once the underlying toolchain was working. This is a useful calibration data point for future spikes in this repo: greenfield framework integration in a repo with pre-existing, differently-configured tooling (this project's already-pinned `typescript@7.0.2`, established for the content-model code in Stories 1.1/1.2) carries real integration risk beyond the spike's own stated question, and is worth budgeting for explicitly rather than assuming a clean scaffold merge.
