"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { HeroCtas } from "./HeroCtas";
import { MotionProvider } from "./MotionProvider";
import { useArrivalStep } from "./ArrivalSequenceProvider";
import { ARRIVAL_STEP_DELAYS } from "./arrivalSequence";
import { arrivalAnimatedClass } from "./ArrivalStyles";
import {
  heroWrapperClass,
  heroNameClass,
  heroDisplayGradientClass,
  heroAccentWordClass,
  heroPositioningClass,
  spacerSectionClass,
} from "./HeroShellStyles";

export interface HeroProps {
  name: string;
  positioning: string;
}

// The reviewed specimen applies the shared accent to one word, not the
// whole name — the last word (the surname, for a "First Last" name; for
// this site's actual "Jose Muñoz" that is also literally the second word).
// A single-word name has nothing to split, so it renders with the gradient
// only.
function splitHeroName(name: string): { lead: string; accent: string | null } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return { lead: name, accent: null };
  }
  return {
    lead: words.slice(0, -1).join(" "),
    accent: words[words.length - 1] ?? null,
  };
}

export function HeroFramer({ name, positioning }: HeroProps) {
  const { lead, accent } = splitHeroName(name);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -40]);
  // `null` (SSR / not-yet-resolved) is treated as "not reduced" so the
  // default sequence's SSR-rendered values are unaffected — see design.md
  // decision 3 in openspec/changes/hero-reduced-motion-alternative.
  const prefersReducedMotion = useReducedMotion() === true;

  // The hero's own mount entrance is owned by the page-load arrival
  // sequence, not by HeroFramer itself — openspec/changes/arrival-sequence
  // design.md Decision 6 ("one owner per element's entrance"). The
  // scroll-linked fade-away above (`opacity`/`y` from `scrollYProgress`) is
  // a separate, unrelated concern — the wrapper leaves the hero as the
  // visitor scrolls past it — and stays exactly as it was.
  const nameStep = useArrivalStep(ARRIVAL_STEP_DELAYS.heroName);
  const positioningStep = useArrivalStep(ARRIVAL_STEP_DELAYS.heroPositioning);

  return (
    <MotionProvider>
      <m.div
        ref={wrapperRef}
        className={heroWrapperClass}
        style={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity, y }
        }
        data-testid="hero-wrapper"
      >
        <m.h1
          className={`${heroNameClass} ${arrivalAnimatedClass}`}
          initial={nameStep.initial}
          animate={nameStep.animate}
          transition={nameStep.transition}
        >
          <span className={heroDisplayGradientClass}>{lead}</span>
          {accent && (
            <>
              {" "}
              <span className={heroAccentWordClass}>{accent}</span>
            </>
          )}
        </m.h1>
        <m.p
          className={`${heroPositioningClass} ${arrivalAnimatedClass}`}
          initial={positioningStep.initial}
          animate={positioningStep.animate}
          transition={positioningStep.transition}
        >
          {positioning}
        </m.p>
        <HeroCtas />
      </m.div>
      <div id="hero-next" className={spacerSectionClass}>
        More below
      </div>
    </MotionProvider>
  );
}
