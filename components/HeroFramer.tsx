"use client";

import { useRef } from "react";
import {
  m,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { HeroCtas } from "./HeroCtas";
import { MotionProvider } from "./MotionProvider";
import { pace } from "./motionPace";
import {
  heroWrapperClass,
  heroNameClass,
  heroDisplayGradientClass,
  heroAccentWordClass,
  heroPositioningClass,
  heroAnimatedTextClass,
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

  const nameInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pace.offsetY };
  const nameAnimate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const positioningInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pace.offsetY };
  const positioningAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };

  return (
    <MotionProvider>
      {/* Framer Motion's `initial` props render as inline opacity:0 in the
          SSR HTML; without JS, that state never animates away. This
          <noscript> override guarantees the hero text stays readable when
          JavaScript is disabled — see design.md decision 1 in
          openspec/changes/hero-content-and-ctas. */}
      <noscript>
        <style>{`.${heroAnimatedTextClass} { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <m.div
        ref={wrapperRef}
        className={heroWrapperClass}
        style={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity, y }
        }
        data-testid="hero-wrapper"
      >
        <m.h1
          className={`${heroNameClass} ${heroAnimatedTextClass}`}
          initial={nameInitial}
          animate={nameAnimate}
          transition={{ duration: pace.duration, ease: pace.ease }}
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
          className={`${heroPositioningClass} ${heroAnimatedTextClass}`}
          initial={positioningInitial}
          animate={positioningAnimate}
          transition={{
            duration: pace.duration,
            ease: pace.ease,
            delay: 0.3,
          }}
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
