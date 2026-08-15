import { pace } from "./motionPace";

// Named steps in the page-load arrival choreography (openspec/changes/
// arrival-sequence design.md Decision 1: ordering is the requirement, the
// step list depends on which participants exist). Each delay is a fraction
// of the shared `pace.duration`, not an independently chosen number, so the
// whole sequence reads as one rhythm rather than several timings that
// happen to coexist. Delays are strictly increasing and each is well under
// `pace.duration` itself, so steps visibly overlap rather than playing in
// strict sequence — design.md Decision 1 / spec "Elements arrive in order".
//
// Non-text steps precede text steps (design.md Decision 2): the laptop
// layer — the "ground" the rest of the scene sits on — starts at delay 0;
// display type and positioning, which depend on the site's webfonts having
// resolved, start after it. CTAs ("chrome") settle last.
export const ARRIVAL_STEP_DELAYS = {
  laptop: 0,
  ambient: pace.duration * 0.15,
  heroName: pace.duration * 0.25,
  heroPositioning: pace.duration * 0.45,
  heroCtas: pace.duration * 0.65,
} as const;

export type ArrivalStepName = keyof typeof ARRIVAL_STEP_DELAYS;

// Deliberately separate from the provider's effect body so a test can
// import and mock it in isolation to exercise the "the orchestrator
// throws" fail-visible path (design.md Decision 5) without needing to
// break `window.location` or `document.getElementById` globally.
//
// A fragment is only a *skip* signal when it targets a real element in the
// document — an arbitrary or stale hash (e.g. a fragment left over from a
// previous SPA-style client transition, or a manually edited URL) should
// not suppress the entrance for a visitor who is, in practice, arriving at
// the top of the page.
export function detectDeepLinkSkip(): boolean {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) {
    return false;
  }
  const target = document.getElementById(hash.slice(1));
  return target !== null;
}
