"use client";

import { m } from "framer-motion";
import { useChatWidget } from "./ChatWidgetContext";
import { useArrivalStep } from "./ArrivalSequenceProvider";
import { ARRIVAL_STEP_DELAYS } from "./arrivalSequence";
import { arrivalAnimatedClass } from "./ArrivalStyles";
import {
  ctaRowClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "./HeroShellStyles";

// CTAs are "chrome" in the arrival sequence's choreography — they settle
// last, after the display type and positioning text (design.md Decision 1
// / arrivalSequence.ts's ARRIVAL_STEP_DELAYS.heroCtas).
export function HeroCtas() {
  const { openChat } = useChatWidget();
  const step = useArrivalStep(ARRIVAL_STEP_DELAYS.heroCtas);

  return (
    <m.div
      className={`${ctaRowClass} ${arrivalAnimatedClass}`}
      initial={step.initial}
      animate={step.animate}
      transition={step.transition}
    >
      <a href="#career" className={ctaPrimaryClass}>
        Scroll to explore ↓
      </a>
      <button type="button" onClick={openChat} className={ctaSecondaryClass}>
        Ask AI
      </button>
      <a
        href="/resume.pdf"
        download="Jose Munoz Elguezabal.pdf"
        data-analytics-event="resume_download"
        className={ctaSecondaryClass}
      >
        Download résumé
      </a>
      <a href="#contact" className={ctaSecondaryClass}>
        Contact
      </a>
    </m.div>
  );
}
