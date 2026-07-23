"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

// domAnimation covers the site's animated surfaces (opacity/transform
// entrances, AnimatePresence enter/exit) without the larger domMax bundle.
// Loaded lazily via dynamic import so it's not in the initial page bundle —
// see design.md Decision 1.
//
// The fetch itself is deferred to browser idle time (with a setTimeout
// fallback for Safari, which lacks requestIdleCallback) rather than
// starting immediately on mount. `m` components apply their target
// style/transform synchronously regardless of whether the feature bundle
// has finished loading — only the animated transition depends on it — so
// this delay doesn't affect content visibility, just how soon the
// entrance animation becomes available. It exists to stop this fetch
// from competing with the LCP-critical request chain on a throttled
// mobile connection (found via a live Lighthouse mobile run).
function loadFeatures(): Promise<typeof import("framer-motion").domAnimation> {
  return new Promise((resolve) => {
    const load = () => {
      import("framer-motion").then((mod) => resolve(mod.domAnimation));
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(load);
    } else {
      setTimeout(load, 0);
    }
  });
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
