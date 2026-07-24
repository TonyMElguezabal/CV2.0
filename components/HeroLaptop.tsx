"use client";

import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { MotionProvider } from "./MotionProvider";
import { Terminal } from "./Terminal";
import {
  heroLaptopLayerClass,
  heroLaptopScrimClass,
  heroLaptopSceneClass,
  heroLaptopBaseClass,
  heroLaptopLidClass,
  heroLaptopScreenClass,
} from "./HeroShellStyles";

export interface HeroLaptopProps {
  terminalLines: string[];
}

// Lid: closed (flat against the base) -> fully open, over the first 85% of
// the document's scroll range. Body: angled toward the lower-left/tilted
// down -> front-facing, over the full scroll range. See design.md Decisions
// 1-2 in openspec/changes/hero-laptop-scroll-motion.
const CLOSED_LID_ROTATE_X = -100;
const OPEN_LID_ROTATE_X = 0;
const ANGLED_ROTATE_Y = -35;
const FRONT_ROTATE_Y = 0;
const ANGLED_ROTATE_Z = -8;
const FRONT_ROTATE_Z = 0;

export function HeroLaptop({ terminalLines }: HeroLaptopProps) {
  // No `target`: progress spans the whole document, not a single element —
  // the laptop is a page-level layer, not hero-contained (Decision 2).
  const { scrollYProgress } = useScroll();
  // `null` (SSR / not-yet-resolved) is treated as "not reduced" — matches
  // HeroFramer's convention.
  const prefersReducedMotion = useReducedMotion() === true;

  const lidRotateX = useTransform(
    scrollYProgress,
    [0, 0.85],
    [CLOSED_LID_ROTATE_X, OPEN_LID_ROTATE_X]
  );
  const bodyRotateY = useTransform(
    scrollYProgress,
    [0, 1],
    [ANGLED_ROTATE_Y, FRONT_ROTATE_Y]
  );
  const bodyRotateZ = useTransform(
    scrollYProgress,
    [0, 1],
    [ANGLED_ROTATE_Z, FRONT_ROTATE_Z]
  );
  const terminalOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);

  const sceneStyle = prefersReducedMotion
    ? { rotateY: FRONT_ROTATE_Y, rotateZ: FRONT_ROTATE_Z }
    : { rotateY: bodyRotateY, rotateZ: bodyRotateZ };
  const lidStyle = prefersReducedMotion
    ? { rotateX: OPEN_LID_ROTATE_X }
    : { rotateX: lidRotateX };
  const screenStyle = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: terminalOpacity };

  return (
    <MotionProvider>
      {/* Without JS, `scrollYProgress`'s SSR-rendered initial value never
          advances, so the SSR HTML would otherwise show the closed/angled
          entry pose forever. This override forces the readable, no-JS
          static state (open, front-facing, terminal visible) — mirrors
          HeroFramer.tsx's noscript override for its own text. */}
      <noscript>
        <style>{`
          .hero-laptop-scene { transform: none !important; }
          .hero-laptop-lid { transform: none !important; }
          .hero-laptop-screen { opacity: 1 !important; }
        `}</style>
      </noscript>
      <div
        className={heroLaptopLayerClass}
        aria-hidden="true"
        data-testid="hero-laptop-layer"
      >
        <div className={heroLaptopScrimClass} />
        <m.div
          className={heroLaptopSceneClass}
          style={sceneStyle}
          data-testid="hero-laptop-scene"
        >
          <div className={heroLaptopBaseClass} />
          <m.div
            className={heroLaptopLidClass}
            style={lidStyle}
            data-testid="hero-laptop-lid"
          >
            <m.div
              className={heroLaptopScreenClass}
              style={screenStyle}
              data-testid="hero-laptop-screen"
            >
              <Terminal lines={terminalLines} />
            </m.div>
          </m.div>
        </m.div>
      </div>
    </MotionProvider>
  );
}
