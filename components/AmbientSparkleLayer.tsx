"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { createParticles, stepParticles } from "@/lib/particles/simulation.ts";
import type { Particle } from "@/lib/particles/simulation.ts";
import { hexToRgb } from "@/lib/color/contrast.ts";
import { heroLaptopAccentHex } from "./HeroShellStyles";
import {
  ambientSparkleLayerClass,
  ambientSparkleCanvasClass,
} from "./AmbientSparkleLayerStyles";

const PARTICLE_COUNT = 140;
const [ACCENT_R, ACCENT_G, ACCENT_B] = hexToRgb(heroLaptopAccentHex);

export function AmbientSparkleLayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion() === true;

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

    let particles: Particle[] = createParticles(PARTICLE_COUNT);
    let rafId: number | null = null;
    let lastFrameTime: number | null = null;
    let isTabVisible = document.visibilityState === "visible";
    let isInView = true;

    function currentSize(): { width: number; height: number } {
      const rect = container!.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
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
      // Additive glow: overlapping particles sum toward white instead of
      // compositing as opaque dots — design.md Decision 1.
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
      particles = stepParticles(particles, delta);
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
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={ambientSparkleLayerClass}
      data-testid="ambient-sparkle-layer"
    >
      <canvas ref={canvasRef} className={ambientSparkleCanvasClass} />
    </div>
  );
}
