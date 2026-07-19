## Why

The motion-library-spike (JOS-53) delivered a working hero prototype (`components/HeroFramer.tsx`) that proves the animation approach, but it only renders `profile.name` and `profile.positioning` — it has no role line structure, no calls to action, and no no-JS fallback. A recruiter landing on the site today sees an animated name and tagline with nothing to do next. PRD §5 F1 requires the hero to carry the full value proposition and a clear next action within the first viewport, in under 10 seconds, so this has to close now — it is the last piece of Epic 2's "first impression" surface before Epic 3 builds sections below it.

## What Changes

- Extend the hero (built on top of `HeroFramer.tsx`, not a redesign of it) with real CTA structure: a primary "scroll" affordance, and three secondary CTAs — Ask AI, Download résumé, Contact.
- Add a real résumé asset (`public/resume.pdf`, sourced from the user-provided PDF) and wire "Download résumé" to it via a real anchor download link.
- Wire "Contact" to `profile.yaml`'s existing `contact.email` / `contact.scheduling` fields via `lib/content/read.ts`'s `getProfile()` — no hardcoded values.
- Render "Ask AI" as a visible, disabled/coming-soon CTA (the chatbot itself is a separate, unbuilt epic) — accurately represents current capability rather than faking a live feature.
- Fix a real SSR/no-JS gap: `HeroFramer.tsx`'s Framer Motion `initial={{opacity: 0}}` props render as inline `opacity: 0` in server-rendered HTML, so content is invisible if JavaScript fails to hydrate — directly conflicting with this story's no-JS acceptance criterion. Resolve so hero text is readable with JavaScript fully disabled.

## Capabilities

### New Capabilities
- `hero-ctas`: the hero's call-to-action row (primary scroll affordance + Ask AI / Download résumé / Contact secondary CTAs), their real content sourcing, and their no-JS-readable rendering guarantee.

### Modified Capabilities
- None. `motion-library-decision` (from the motion-library-spike change) is not being changed — this story extends the hero component built on that decision without altering the decision itself.

## Impact

- `components/HeroFramer.tsx`: extended with CTA markup and the SSR-visibility fix (or the visible text is restructured out of the animated wrapper — exact approach decided in design.md).
- `components/HeroShellStyles.ts`: new shared style constants for the CTA row.
- `lib/content/read.ts`: `getProfile()` already exposes `contact`/`links` via the existing `Profile` type — no schema change expected, but this story is the first consumer of those fields in UI.
- `public/resume.pdf`: new binary asset, copied from `/Users/josemunoz/Downloads/2026Jose_Munoz_Elguezabal_Manager.pdf`.
- No API, database, or build-tooling impact.
