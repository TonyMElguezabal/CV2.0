"use client";

import { useEffect, useRef, useState } from "react";

// Fires once, the first time the observed element scrolls into view, then
// stops observing — a reveal is a one-shot transition, not a continuously
// tracked state the way CareerTimeline's active-chapter indicator is.
//
// Both the IntersectionObserver callback and a scroll listener call the
// same decision function — mirrors CareerTimeline.tsx's own established
// pattern exactly (design.md Decision 6 in
// openspec/changes/scroll-reveal-motion): neither mechanism is the sole
// path to correctness, so a gap in one doesn't leave content gated
// forever. `revealed` starts `false` and is set by JS only — the fail-
// visible guarantee (content is never left permanently hidden) is the
// consuming component's job: it must render at full opacity/no offset by
// default and treat `revealed` as "already past its entrance," not as
// "permission to become visible." See RevealStyles.ts's own note on the
// shared `<noscript>` override that covers the no-JS case.
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    // Fail-visible: no IntersectionObserver support means no mechanism
    // will ever reveal this element — reveal immediately rather than
    // leaving it gated on a capability that doesn't exist.
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    let hasRevealed = false;

    function revealIfInView() {
      if (hasRevealed || !el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        hasRevealed = true;
        setRevealed(true);
        cleanup();
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          revealIfInView();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    window.addEventListener("scroll", revealIfInView, { passive: true });
    revealIfInView();

    function cleanup() {
      observer.disconnect();
      window.removeEventListener("scroll", revealIfInView);
    }

    return cleanup;
  }, []);

  return { ref, revealed };
}
