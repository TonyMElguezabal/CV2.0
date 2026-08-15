// Pure particle-field logic, kept separate from canvas rendering so it is
// testable without a canvas (editorial-frame precedent: CareerTimeline
// separates its own scroll logic from rendering the same way) — see
// openspec/changes/ambient-sparkle-layer/tasks.md Task Group 2.
//
// Positions are normalized to [0, 1) so the simulation has no dependency on
// pixel dimensions or devicePixelRatio — the canvas renderer multiplies by
// the container's real width/height at draw time.

export interface Particle {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly opacity: number;
}

export type RandomFn = () => number;

// Normalized units per second — slow enough to read as drift, not motion.
const DRIFT_SPEED = 0.015;
const MIN_RADIUS_PX = 1;
const MAX_RADIUS_PX = 2.5;
const MIN_OPACITY = 0.25;
const MAX_OPACITY = 0.85;

export function createParticles(
  count: number,
  random: RandomFn = Math.random
): Particle[] {
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    vx: (random() - 0.5) * DRIFT_SPEED,
    vy: (random() - 0.5) * DRIFT_SPEED,
    radius: MIN_RADIUS_PX + random() * (MAX_RADIUS_PX - MIN_RADIUS_PX),
    opacity: MIN_OPACITY + random() * (MAX_OPACITY - MIN_OPACITY),
  }));
}

// Wraps at the [0, 1) boundary rather than bouncing — a particle drifting
// off one edge re-enters from the opposite edge, keeping the field's
// density constant instead of thinning out over time. The in-range check
// is not just an optimization: `%` is not an exact identity even for
// already-in-range floats (rounding in the divide/subtract), so skipping it
// keeps a stationary particle (e.g. deltaSeconds = 0) bit-for-bit unchanged
// instead of drifting by a float-epsilon every step.
function wrap(value: number): number {
  if (value >= 0 && value < 1) {
    return value;
  }
  return ((value % 1) + 1) % 1;
}

export function stepParticles(
  particles: readonly Particle[],
  deltaSeconds: number
): Particle[] {
  return particles.map((particle) => ({
    ...particle,
    x: wrap(particle.x + particle.vx * deltaSeconds),
    y: wrap(particle.y + particle.vy * deltaSeconds),
  }));
}
