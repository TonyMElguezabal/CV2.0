"use client";

import { m, useReducedMotion } from "framer-motion";
import { useRevealOnScroll } from "./useRevealOnScroll";
import { pace } from "./motionPace";
import {
  revealHeadingGhostBlurClass,
  REVEAL_HEADING_STAGGER_SECONDS,
} from "./RevealHeadingStyles";
import { revealAnimatedClass, revealGhostClass } from "./RevealStyles";

export interface RevealHeadingProps {
  text: string;
  as: "h2" | "h3";
  className?: string;
}

// Per-character blur-up heading reveal — applied only to short display and
// section headings (Skills/Projects/Contact), never to longer chapter or
// project titles, which reveal as whole blocks via SectionReveal instead
// (design.md Risk 4 in openspec/changes/scroll-reveal-motion: per-character
// doubling on a title like "Senior Software Development Manager at Tata
// Consultancy Services (Banco de Crédito del Perú account)" is both costly
// and worse-looking at that length).
//
// Each character renders twice — a statically blurred ghost and a sharp
// copy — and only their opacities cross-fade alongside a shared rise
// (design.md Decision 1). The whole split is wrapped in a single
// `aria-hidden` container with the heading's real, unbroken text supplied
// via `aria-label` on the heading itself, so assistive technology never
// encounters the per-character markup at all (task group 3 — the
// accessible-name correctness trap).
export function RevealHeading({ text, as: Tag, className }: RevealHeadingProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLHeadingElement>();
  const prefersReducedMotion = useReducedMotion() === true;
  const characters = Array.from(text);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true" className="relative inline-block">
        {/* Ghost layer: one overlay, entirely separate from the sharp
            per-character spans below, rather than a DOM sibling nested
            inside each character's own wrapper (the original construction).
            Found in real-browser verification (design.md Decision 1's
            amendment, openspec/changes/scroll-reveal-motion): nesting the
            ghost alongside the sharp copy in one small per-character box —
            even with `select-none` on the ghost — broke native
            double-click/triple-click word-selection on the revealed
            heading, collapsing it to 1-3 characters. Moving the ghost out
            to its own layer restored normal word-selection while leaving
            the cross-fade visually identical. Omitted entirely under
            reduced motion — no ghost, no cross-fade (design.md "Reveals
            collapse to fade-only under reduced motion"). */}
        {!prefersReducedMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
          >
            {characters.map((char, index) => {
              const delay = index * REVEAL_HEADING_STAGGER_SECONDS;
              const displayChar = char === " " ? " " : char;
              return (
                <m.span
                  key={index}
                  className={`${revealGhostClass} select-none relative inline-block ${revealHeadingGhostBlurClass}`}
                  initial={{ y: pace.offsetY, opacity: 1 }}
                  animate={{ y: revealed ? 0 : pace.offsetY, opacity: revealed ? 0 : 1 }}
                  transition={{ duration: pace.duration, ease: pace.ease, delay }}
                >
                  {displayChar}
                </m.span>
              );
            })}
          </span>
        )}
        {characters.map((char, index) => {
          const delay = index * REVEAL_HEADING_STAGGER_SECONDS;
          // A literal space collapses visually in a normal inline-block
          // span unless preserved — render it as a non-breaking space so
          // multi-word headings keep their gaps.
          const displayChar = char === " " ? " " : char;

          const initial = prefersReducedMotion
            ? { opacity: 0 }
            : { y: pace.offsetY, opacity: 0 };
          const animate = prefersReducedMotion
            ? { opacity: revealed ? 1 : 0 }
            : { y: revealed ? 0 : pace.offsetY, opacity: revealed ? 1 : 0 };

          return (
            <m.span
              key={index}
              className={`${revealAnimatedClass} relative inline-block`}
              initial={initial}
              animate={animate}
              transition={{ duration: pace.duration, ease: pace.ease, delay }}
            >
              {displayChar}
            </m.span>
          );
        })}
      </span>
    </Tag>
  );
}
