"use client";

import { useEffect, useRef } from "react";
import { m, useReducedMotion } from "framer-motion";
import {
  createParticles,
  stepParticles,
  linkedPairs,
  particleCountForArea,
  LINK_RADIUS_PX,
} from "@/lib/particles/simulation.ts";
import type { Particle, PointerInfluence } from "@/lib/particles/simulation.ts";
import { hexToRgb } from "@/lib/color/contrast.ts";
import { heroLaptopAccentHex } from "./HeroShellStyles";
import { MotionProvider } from "./MotionProvider";
import { useArrivalStep } from "./ArrivalSequenceProvider";
import { ARRIVAL_STEP_DELAYS } from "./arrivalSequence";
import { arrivalAnimatedClass } from "./ArrivalStyles";
import {
  ambientSparkleLayerClass,
  ambientSparkleCanvasClass,
} from "./AmbientSparkleLayerStyles";

const [ACCENT_R, ACCENT_G, ACCENT_B] = hexToRgb(heroLaptopAccentHex);

// A resize that changes the derived particle count by less than this
// fraction is ignored entirely — positions AND count stay untouched. Above
// it, particles are added or removed incrementally (never a full
// regeneration) — design.md Decision 5. Without this, every resize would
// visibly teleport the whole field, most noticeably during a window drag.
const PARTICLE_COUNT_HYSTERESIS = 0.15;

// Link peak opacity — ambient-constellation-links design.md Decision 4.
// Composited `source-over` (never `lighter` — Decision 3), this is bounded
// by construction: 0.75 measures 3.23:1 against the page background, just
// below `--hair`'s 3.47:1 parity, the palette's designated weight for
// structure that is not content. LINK_PEAK_ALPHA_CEILING (0.79, --hair
// parity itself) is the hard, non-negotiable bound a unit test enforces in
// components/palette.test.tsx; LINK_PEAK_ALPHA is the rendered value, an
// owner-tunable starting point below it (design.md Open Questions).
export const LINK_PEAK_ALPHA = 0.75;
export const LINK_PEAK_ALPHA_CEILING = 0.79;

// Strokes are grouped into a bounded number of alpha buckets rather than
// issued one stroke() per link, so draw-call count stays bounded regardless
// of how many links are on screen — design.md Decision 5. 14 sits inside the
// 12–16 range design.md targets.
const LINK_ALPHA_BUCKET_COUNT = 14;

export function AmbientSparkleLayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion() === true;

  // Fades up as an arrival-sequence step (openspec/changes/arrival-sequence
  // design.md Decision 6: "the ambient layer enters as a step of the
  // sequence rather than appearing abruptly alongside it") rather than
  // simply being present the instant it mounts. Opacity only — a
  // full-viewport atmosphere layer has no sensible "rise into place".
  const entranceStep = useArrivalStep(ARRIVAL_STEP_DELAYS.ambient, false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    function currentSize(): { width: number; height: number } {
      const rect = container!.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }

    const initialSize = currentSize();
    let particles: Particle[] = createParticles(
      particleCountForArea(initialSize.width, initialSize.height)
    );
    let rafId: number | null = null;
    let lastFrameTime: number | null = null;
    let isTabVisible = document.visibilityState === "visible";
    let isInView = true;

    // Adjusts the field toward the count the current area derives, without
    // ever fully regenerating it — design.md Decision 5. A resize under the
    // hysteresis threshold is ignored entirely (positions AND count stay
    // put); above it, particles are appended or truncated, so any particle
    // that survives the resize keeps its exact position.
    function adjustParticleCountForSize(width: number, height: number) {
      const targetCount = particleCountForArea(width, height);
      const delta = Math.abs(targetCount - particles.length);
      const relativeDelta =
        particles.length === 0 ? 1 : delta / particles.length;
      if (relativeDelta < PARTICLE_COUNT_HYSTERESIS) {
        return;
      }
      if (targetCount > particles.length) {
        particles = particles.concat(
          createParticles(targetCount - particles.length)
        );
      } else if (targetCount < particles.length) {
        particles = particles.slice(0, targetCount);
      }
    }

    // Pointer state — design.md Decision 6. Normalized coordinates, so it
    // stays valid across a resize without itself needing updating; width
    // and height are read fresh from currentSize() wherever it's consumed.
    // Registered only when motion isn't reduced (attraction is positional
    // movement) — under reduced motion, no listener is attached at all
    // rather than one that's merely ignored.
    let pointer: { x: number; y: number; active: boolean } = {
      x: 0,
      y: 0,
      active: false,
    };

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return; // a touch contact is a tap, not a hover
      }
      const { width, height } = currentSize();
      if (width === 0 || height === 0) {
        return;
      }
      const rect = container!.getBoundingClientRect();
      pointer = {
        x: (event.clientX - rect.left) / width,
        y: (event.clientY - rect.top) / height,
        active: true,
      };
    }

    function releasePointer() {
      pointer = { ...pointer, active: false };
    }

    // The container's own size is the single source of truth for whether
    // the layer is gated off — `ambientSparkleLayerClass`'s `hidden
    // sm:block` collapses it to 0x0 below the `sm` breakpoint, so there is
    // no separate breakpoint value to keep in sync with the CSS class.
    function isGatedOff(): boolean {
      const { width, height } = currentSize();
      return width === 0 || height === 0;
    }

    function resizeCanvas() {
      const { width, height } = currentSize();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const { width, height } = currentSize();
      ctx!.clearRect(0, 0, width, height);

      // Links first, composited `source-over` — never `lighter`. Additive
      // compositing would let overlapping links accumulate past the site's
      // text-contrast floor at a dense crossing; `source-over` structurally
      // cannot exceed a single link's own colour, regardless of overlap
      // density — ambient-constellation-links design.md Decision 3.
      ctx!.globalCompositeOperation = "source-over";
      const pairs = linkedPairs(particles, {
        width,
        height,
        radiusPx: LINK_RADIUS_PX,
      });
      if (pairs.length > 0) {
        const buckets: (typeof pairs)[] = Array.from(
          { length: LINK_ALPHA_BUCKET_COUNT },
          () => []
        );
        for (const pair of pairs) {
          const bucketIndex = Math.min(
            LINK_ALPHA_BUCKET_COUNT - 1,
            Math.floor(pair.strength * LINK_ALPHA_BUCKET_COUNT)
          );
          buckets[bucketIndex]!.push(pair);
        }
        for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
          const bucket = buckets[bucketIndex]!;
          if (bucket.length === 0) {
            continue;
          }
          // Bucket midpoint strength, not its edge — avoids every link in
          // the bucket rendering at the bucket's dimmest boundary value.
          const bucketStrength = (bucketIndex + 0.5) / LINK_ALPHA_BUCKET_COUNT;
          const alpha = bucketStrength * LINK_PEAK_ALPHA;
          ctx!.strokeStyle = `rgba(${ACCENT_R}, ${ACCENT_G}, ${ACCENT_B}, ${alpha})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          for (const pair of bucket) {
            const a = particles[pair.a]!;
            const b = particles[pair.b]!;
            ctx!.moveTo(a.x * width, a.y * height);
            ctx!.lineTo(b.x * width, b.y * height);
          }
          ctx!.stroke();
        }
      }

      // Nodes second, additive glow: overlapping particles sum toward white
      // instead of compositing as opaque dots — ambient-sparkle-layer
      // design.md Decision 1.
      ctx!.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${ACCENT_R}, ${ACCENT_G}, ${ACCENT_B}, ${particle.opacity})`;
        ctx!.arc(
          particle.x * width,
          particle.y * height,
          particle.radius,
          0,
          Math.PI * 2
        );
        ctx!.fill();
      }
    }

    function shouldRun(): boolean {
      return (
        !prefersReducedMotion && isTabVisible && isInView && !isGatedOff()
      );
    }

    function loop(time: number) {
      if (!shouldRun()) {
        rafId = null;
        return;
      }
      const delta = lastFrameTime === null ? 0 : (time - lastFrameTime) / 1000;
      lastFrameTime = time;
      const { width, height } = currentSize();
      const pointerInfluence: PointerInfluence = {
        x: pointer.x,
        y: pointer.y,
        active: pointer.active,
        width,
        height,
      };
      particles = stepParticles(particles, delta, pointerInfluence);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function startLoopIfNeeded() {
      if (rafId === null && shouldRun()) {
        lastFrameTime = null;
        rafId = requestAnimationFrame(loop);
      }
    }

    resizeCanvas();
    // Always paint one static frame immediately — this is the reduced-motion
    // state (design.md Decision 3: a still field, not nothing, since
    // "renders nothing" and "failed to initialise" look identical) and also
    // the very first frame in the normal-motion case.
    draw();
    startLoopIfNeeded();

    function handleResize() {
      const { width, height } = currentSize();
      adjustParticleCountForSize(width, height);
      resizeCanvas();
      draw();
      startLoopIfNeeded();
    }
    window.addEventListener("resize", handleResize);

    function handleVisibilityChange() {
      isTabVisible = document.visibilityState === "visible";
      startLoopIfNeeded();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isInView = entry ? entry.isIntersecting : true;
      startLoopIfNeeded();
    });
    intersectionObserver.observe(container);

    // Not gated behind an `if` at registration time so the removal below is
    // unconditional too — attached only when motion isn't reduced.
    if (!prefersReducedMotion) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      document.addEventListener("pointerleave", releasePointer);
      window.addEventListener("blur", releasePointer);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", releasePointer);
      window.removeEventListener("blur", releasePointer);
    };
  }, [prefersReducedMotion]);

  return (
    <MotionProvider>
      <m.div
        ref={containerRef}
        className={`${ambientSparkleLayerClass} ${arrivalAnimatedClass}`}
        initial={entranceStep.initial}
        animate={entranceStep.animate}
        transition={entranceStep.transition}
        aria-hidden="true"
        data-testid="ambient-sparkle-layer"
      >
        <canvas ref={canvasRef} className={ambientSparkleCanvasClass} />
      </m.div>
    </MotionProvider>
  );
}
