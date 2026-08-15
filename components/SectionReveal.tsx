"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "framer-motion";
import { useRevealOnScroll } from "./useRevealOnScroll";
import { pace } from "./motionPace";
import { revealAnimatedClass } from "./RevealStyles";

export interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  // Forwarded to the underlying element — needed by call sites whose
  // revealed element is itself an anchor target (e.g. a project card).
  id?: string;
  // Defaults to "div". Polymorphic rather than always wrapping in a div
  // because several call sites (CareerChapter's <details>, a project
  // <article>, a skill <li>) rely on `first:`/`last:` sibling-position
  // CSS that only works if the revealed element is the direct sibling of
  // its neighbors — an extra wrapper div would make every instance an
  // only-child of its own wrapper, silently breaking that styling. `m` is
  // a genuine Proxy (framer-motion's `createMotionProxy()`), so `m[as]`
  // resolves to a real motion component for any standard tag.
  as?: "div" | "details" | "li" | "article";
}

// Whole-block fade+rise for content that gets an entrance but not the
// per-character heading treatment — chapters, project cards, skill rows,
// the contact links row (design.md Decision 3 in
// openspec/changes/scroll-reveal-motion: reveals at the seams, never on
// the substance — each of these reveals as one unit, so nothing inside it
// is individually gated).
//
// Fail-visible by construction: `initial` bakes opacity:0 into the SSR
// HTML (same mechanism HeroFramer.tsx already relies on), which is why
// the shared `<noscript>` override in app/(marketing)/layout.tsx exists —
// without JS, `revealAnimatedClass` is forced back to its visible state.
// With JS, `useRevealOnScroll` starts `revealed=false` and only a
// confirmed in-view observation flips it — never the reverse — so a
// reveal that never fires still leaves content in its natural DOM
// position, just not yet animated in.
export function SectionReveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
}: SectionRevealProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>();
  const prefersReducedMotion = useReducedMotion() === true;
  const MotionTag = m[as];

  const initial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pace.offsetY };
  const animateHidden = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: pace.offsetY };
  const animateRevealed = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0 };

  return (
    <MotionTag
      // `m[as]`'s inferred ref type wants an intersection of every
      // possible tag's own ref type; `HTMLElement` is a valid supertype
      // for all of them at runtime, TypeScript just can't express that
      // through a dynamic property-access union on its own.
      ref={ref as never}
      id={id}
      className={`${revealAnimatedClass}${className ? ` ${className}` : ""}`}
      initial={initial}
      animate={revealed ? animateRevealed : animateHidden}
      transition={{ duration: pace.duration, ease: pace.ease, delay }}
    >
      {children}
    </MotionTag>
  );
}
