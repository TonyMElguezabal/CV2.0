"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { pace } from "./motionPace";
import { detectDeepLinkSkip } from "./arrivalSequence";

interface ArrivalSequenceState {
  arrived: boolean;
  skip: boolean;
}

// Fail-visible default (design.md Decision 5): a component that somehow
// renders outside the provider — which should not happen, but the whole
// point of this change is not trusting "should not happen" — resolves to
// the fully-visible, no-op state rather than a permanently hidden one.
const DEFAULT_STATE: ArrivalSequenceState = { arrived: true, skip: true };

const ArrivalSequenceContext =
  createContext<ArrivalSequenceState>(DEFAULT_STATE);

// Mounted once in app/(marketing)/layout.tsx, wrapping every participant.
// `arrived` starts `false` (matching SSR, where no effect has run) and is
// flipped `true` by the effect below — same starts-false-flips-once shape
// as `useRevealOnScroll`, but on a mount timer rather than an
// IntersectionObserver, since an arrival sequence has nothing to observe.
export function ArrivalSequenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<ArrivalSequenceState>({
    arrived: false,
    skip: false,
  });

  useEffect(() => {
    let skip = false;
    try {
      skip = detectDeepLinkSkip();
    } catch {
      // Fail-visible (design.md Decision 5): a `finally` block runs this
      // same setState, but does not stop the original exception from
      // continuing to propagate out of the effect — React then surfaces it
      // as an uncaught error rather than the page simply rendering
      // visible. `catch` fully absorbs it instead. `skip` stays `false`,
      // which errs toward playing the normal sequence rather than
      // skipping it — showing more content, not less, is the safer
      // failure direction.
    }
    setState({ arrived: true, skip });
  }, []);

  return (
    <ArrivalSequenceContext.Provider value={state}>
      {children}
    </ArrivalSequenceContext.Provider>
  );
}

export interface ArrivalStepStyle {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: {
    duration: number;
    ease: readonly [number, number, number, number];
    delay: number;
  };
}

// Returns framer-motion-ready `initial`/`animate`/`transition` props for
// one arrival-sequence participant.
//
// `withOffset` controls whether the step rises into place (the site's
// standard fade + rise, matching HeroFramer's pre-existing entrance) or
// fades in place only — the laptop layer uses the latter, since its own
// scroll-driven rotation already supplies all of its positional motion;
// stacking a second, independent translateY on top of that would be a
// second, uncoordinated source of movement on the same layer.
export function useArrivalStep(
  delay: number,
  withOffset = true
): ArrivalStepStyle {
  const { arrived, skip } = useContext(ArrivalSequenceContext);
  const prefersReducedMotion = useReducedMotion() === true;

  const useOffset = withOffset && !prefersReducedMotion;
  const hidden = useOffset
    ? { opacity: 0, y: pace.offsetY }
    : { opacity: 0, y: 0 };
  const visible = { opacity: 1, y: 0 };

  if (skip) {
    // Deep-linked arrival: render directly in final state with no
    // transition to play at all — the spec's "does not play its full
    // choreography", not merely a faster version of it.
    return {
      initial: visible,
      animate: visible,
      transition: { duration: 0, ease: pace.ease, delay: 0 },
    };
  }

  return {
    initial: hidden,
    animate: arrived ? visible : hidden,
    transition: { duration: pace.duration, ease: pace.ease, delay },
  };
}
