"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import type { Profile } from "@/lib/content/types.ts";
import { HeroCtas } from "./HeroCtas";
import {
  heroWrapperClass,
  heroNameClass,
  heroPositioningClass,
  heroAnimatedTextClass,
  spacerSectionClass,
} from "./HeroShellStyles";

export interface HeroProps {
  name: string;
  positioning: string;
  profile: Pick<Profile, "contact">;
}

export function HeroFramer({ name, positioning, profile }: HeroProps) {
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

  const nameInitial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 };
  const nameAnimate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const positioningInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 16 };
  const positioningAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };

  return (
    <>
      {/* Framer Motion's `initial` props render as inline opacity:0 in the
          SSR HTML; without JS, that state never animates away. This
          <noscript> override guarantees the hero text stays readable when
          JavaScript is disabled — see design.md decision 1 in
          openspec/changes/hero-content-and-ctas. */}
      <noscript>
        <style>{`.${heroAnimatedTextClass} { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <motion.div
        ref={wrapperRef}
        className={heroWrapperClass}
        style={
          prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity, y }
        }
      >
        <motion.h1
          className={`${heroNameClass} ${heroAnimatedTextClass}`}
          initial={nameInitial}
          animate={nameAnimate}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {name}
        </motion.h1>
        <motion.p
          className={`${heroPositioningClass} ${heroAnimatedTextClass}`}
          initial={positioningInitial}
          animate={positioningAnimate}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          {positioning}
        </motion.p>
        <HeroCtas profile={profile} />
      </motion.div>
      <div id="hero-next" className={spacerSectionClass}>
        More below
      </div>
    </>
  );
}
