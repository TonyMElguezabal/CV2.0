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
  heroLaptopLidFaceClass,
  heroLaptopLidFaceScreenClass,
  heroLaptopLidFaceOuterClass,
  heroLaptopScreenClass,
  heroLaptopHingeClass,
  heroLaptopKeyboardClass,
  heroLaptopKeyClass,
  heroLaptopTrackpadClass,
  heroLaptopLidAccentClass,
  heroLaptopLightOverlayClass,
  heroLaptopContactShadowPositionClass,
  heroLaptopSpecularPositionClass,
  heroLaptopRimMarkerClass,
  heroLaptopSpillMarkerClass,
  heroLaptopContactShadowMarkerClass,
  heroLaptopHingeAoMarkerClass,
  heroLaptopSpecularMarkerClass,
  heroLaptopRimGradient,
  heroLaptopDeckSpillGradient,
  heroLaptopBezelBloomGradient,
  heroLaptopContactShadowGradient,
  heroLaptopSpecularGradient,
} from "./HeroShellStyles";

export interface HeroLaptopProps {
  terminalLines: string[];
}

const KEYBOARD_KEY_COUNT = 50;

// Lid: closed (flat against the base) -> fully open, over the first 85% of
// the document's scroll range. Body: angled toward the lower-left/tilted
// down -> front-facing, over the full scroll range. See design.md Decisions
// 1-2 in openspec/changes/hero-laptop-scroll-motion.
const CLOSED_LID_ROTATE_X = -170;
const OPEN_LID_ROTATE_X = 0;
const ANGLED_ROTATE_Y = -35;
const FRONT_ROTATE_Y = 0;
const ANGLED_ROTATE_Z = -8;
const FRONT_ROTATE_Z = 0;

// Reduced-motion / no-JS static lighting values — each is its formula's own
// value at the static open, front-facing pose (p=1, openness=1), so the
// lighting matches the laptop's own static geometry rather than an
// arbitrary constant. See design.md Decision 2 formulas in
// openspec/changes/hero-laptop-cinematic-lighting.
const STATIC_RIM_OPACITY = 0.28;
const STATIC_SPILL_OPACITY = 1;
const STATIC_CONTACT_OPACITY = 1;
const STATIC_HINGE_AO_OPACITY = 0.5;
const STATIC_SPECULAR_OPACITY = 0.45;
const STATIC_SPECULAR_X = "12%";

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

  // ── Lighting rig (design.md Decision 2, openspec/changes/
  // hero-laptop-cinematic-lighting) ────────────────────────────────────
  // Every intensity below is derived from the geometry MotionValues above
  // — no new scroll listener, no new driver. Curves are hand-authored
  // (art-directed), not physically simulated: a physically-correct rim
  // reads as dim, one that lingers past its true falloff reads as
  // intentional.
  const openness = useTransform(scrollYProgress, [0, 0.85], [0, 1]);
  // ① Rim: grazing-angle (Fresnel) falloff, strongest when most turned away.
  const rimIntensity = useTransform(
    scrollYProgress,
    (p) => 0.28 + 0.72 * (1 - p)
  );
  // ② Screen spill: the display "wakes up" late in the opening.
  const spillIntensity = useTransform(openness, (o) => Math.pow(o, 1.6));
  // ③ Contact shadow: weight arrives as the body straightens. Hinge AO is
  // deepest at the closed pose and softens as the lid opens.
  const contactIntensity = useTransform(
    scrollYProgress,
    (p) => 0.34 + 0.66 * p
  );
  const hingeAoOpacity = useTransform(openness, (o) => 1 - o * 0.5);
  // ④ Specular sweep: a gentle bell across the rotation, translated (never
  // a shifting background-position) across an overflow-hidden face.
  const specularIntensity = useTransform(
    scrollYProgress,
    (p) => 0.45 + 0.55 * Math.sin(p * Math.PI)
  );
  const specularX = useTransform(scrollYProgress, [0, 1], ["-45%", "12%"]);
  // ⑤ Key/shadow wash was evaluated and removed — see design.md Decision 8
  // ("Light ⑤ was removed after real-browser verification") in
  // openspec/changes/hero-laptop-cinematic-lighting. A before/after DOM
  // toggle at scroll progress 0.6 and 1.0 (peak intensity in both cases)
  // produced visually identical screenshots: not distinguishable from the
  // other four lights once composited under the scrim.

  const sceneStyle = prefersReducedMotion
    ? { rotateY: FRONT_ROTATE_Y, rotateZ: FRONT_ROTATE_Z }
    : { rotateY: bodyRotateY, rotateZ: bodyRotateZ };
  const lidStyle = prefersReducedMotion
    ? { rotateX: OPEN_LID_ROTATE_X }
    : { rotateX: lidRotateX };
  const rimStyle = prefersReducedMotion
    ? { opacity: STATIC_RIM_OPACITY }
    : { opacity: rimIntensity };
  const spillStyle = prefersReducedMotion
    ? { opacity: STATIC_SPILL_OPACITY }
    : { opacity: spillIntensity };
  const contactStyle = prefersReducedMotion
    ? { opacity: STATIC_CONTACT_OPACITY }
    : { opacity: contactIntensity };
  const hingeStyle = prefersReducedMotion
    ? { opacity: STATIC_HINGE_AO_OPACITY }
    : { opacity: hingeAoOpacity };
  const specularStyle = prefersReducedMotion
    ? { opacity: STATIC_SPECULAR_OPACITY, x: STATIC_SPECULAR_X }
    : { opacity: specularIntensity, x: specularX };

  const screenStyle = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: terminalOpacity };

  return (
    <MotionProvider>
      {/* Without JS, `scrollYProgress`'s SSR-rendered initial value never
          advances, so the SSR HTML would otherwise show the closed/angled
          entry pose forever. This override forces the readable, no-JS
          static state (open, front-facing, terminal visible) — mirrors
          HeroFramer.tsx's noscript override for its own text. The lighting
          rules below force every light layer to its open-pose value too:
          without this, each light would be stuck at its SSR-rendered p=0
          default (e.g. spill=0, no screen glow) even though the terminal
          above is forced open — AC8 / hero-signature-motion "Lighting
          renders sensibly without JavaScript". */}
      <noscript>
        <style>{`
          .hero-laptop-scene { transform: none !important; }
          .hero-laptop-lid { transform: none !important; }
          .hero-laptop-screen { opacity: 1 !important; }
          .hero-laptop-rim { opacity: ${STATIC_RIM_OPACITY} !important; }
          .hero-laptop-spill { opacity: ${STATIC_SPILL_OPACITY} !important; }
          .hero-laptop-contact-shadow-layer { opacity: ${STATIC_CONTACT_OPACITY} !important; }
          .hero-laptop-hinge { opacity: ${STATIC_HINGE_AO_OPACITY} !important; }
          .hero-laptop-specular { opacity: ${STATIC_SPECULAR_OPACITY} !important; transform: translateX(${STATIC_SPECULAR_X}) !important; }
        `}</style>
      </noscript>
      <div
        className={heroLaptopLayerClass}
        aria-hidden="true"
        data-testid="hero-laptop-layer"
      >
        <m.div
          className={heroLaptopSceneClass}
          style={sceneStyle}
          data-testid="hero-laptop-scene"
        >
          <div className={heroLaptopBaseClass} data-testid="hero-laptop-base">
            <m.div
              className={`${heroLaptopHingeAoMarkerClass} ${heroLaptopHingeClass}`}
              style={hingeStyle}
              data-testid="hero-laptop-hinge"
            />
            <m.div
              className={`${heroLaptopRimMarkerClass} ${heroLaptopLightOverlayClass}`}
              style={{ backgroundImage: heroLaptopRimGradient, ...rimStyle }}
              data-testid="hero-laptop-rim-base"
            />
            <m.div
              className={`${heroLaptopSpillMarkerClass} ${heroLaptopLightOverlayClass}`}
              style={{
                backgroundImage: heroLaptopDeckSpillGradient,
                ...spillStyle,
              }}
              data-testid="hero-laptop-deck-spill"
            />
            <div
              className={heroLaptopKeyboardClass}
              data-testid="hero-laptop-keyboard"
            >
              {Array.from({ length: KEYBOARD_KEY_COUNT }, (_, index) => (
                <div key={index} className={heroLaptopKeyClass} />
              ))}
            </div>
            <div
              className={heroLaptopTrackpadClass}
              data-testid="hero-laptop-trackpad"
            />
            <m.div
              className={`${heroLaptopContactShadowMarkerClass} ${heroLaptopContactShadowPositionClass}`}
              style={{
                backgroundImage: heroLaptopContactShadowGradient,
                ...contactStyle,
              }}
              data-testid="hero-laptop-contact-shadow"
            />
          </div>
          <m.div
            className={heroLaptopLidClass}
            style={lidStyle}
            data-testid="hero-laptop-lid"
          >
            <div
              className={`${heroLaptopLidFaceClass} ${heroLaptopLidFaceScreenClass}`}
              data-testid="hero-laptop-lid-face-screen"
            >
              <m.div
                className={heroLaptopScreenClass}
                style={screenStyle}
                data-testid="hero-laptop-screen"
              >
                <Terminal lines={terminalLines} />
              </m.div>
              <m.div
                className={`${heroLaptopSpillMarkerClass} ${heroLaptopLightOverlayClass}`}
                style={{
                  backgroundImage: heroLaptopBezelBloomGradient,
                  ...spillStyle,
                }}
                data-testid="hero-laptop-bezel-bloom"
              />
              <m.div
                className={`${heroLaptopSpecularMarkerClass} ${heroLaptopSpecularPositionClass}`}
                style={{
                  backgroundImage: heroLaptopSpecularGradient,
                  ...specularStyle,
                }}
                data-testid="hero-laptop-specular-screen"
              />
              <m.div
                className={`${heroLaptopRimMarkerClass} ${heroLaptopLightOverlayClass}`}
                style={{ backgroundImage: heroLaptopRimGradient, ...rimStyle }}
                data-testid="hero-laptop-rim-screen"
              />
            </div>
            <div
              className={`${heroLaptopLidFaceClass} ${heroLaptopLidFaceOuterClass}`}
              data-testid="hero-laptop-lid-face-outer"
            >
              <div
                className={heroLaptopLidAccentClass}
                data-testid="hero-laptop-lid-accent"
              />
              <m.div
                className={`${heroLaptopSpecularMarkerClass} ${heroLaptopSpecularPositionClass}`}
                style={{
                  backgroundImage: heroLaptopSpecularGradient,
                  ...specularStyle,
                }}
                data-testid="hero-laptop-specular-outer"
              />
              <m.div
                className={`${heroLaptopRimMarkerClass} ${heroLaptopLightOverlayClass}`}
                style={{ backgroundImage: heroLaptopRimGradient, ...rimStyle }}
                data-testid="hero-laptop-rim-outer"
              />
            </div>
          </m.div>
        </m.div>
        {/* Painted after (on top of) the scene: as a `position:absolute`,
            z-index:auto sibling, DOM order after the scene means it paints
            over the laptop's own opaque material and every light layer,
            actually dimming them — not just the empty viewport space
            around the laptop shape, which was the only thing it affected
            when it was DOM-first (see design.md Decision in
            openspec/changes/hero-laptop-cinematic-lighting Step 6). */}
        <div
          className={heroLaptopScrimClass}
          data-testid="hero-laptop-scrim"
        />
      </div>
    </MotionProvider>
  );
}
