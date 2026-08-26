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
  // Pointer-attraction displacement from the free-drift position, in
  // normalized units. Optional and treated as (0, 0) when absent, so
  // `createParticles` need not change — ambient-constellation-links
  // design.md Decision 6. Persisted across steps so displacement can be
  // bounded relative to where the particle would otherwise be, and eased
  // back toward zero once the pointer goes inactive.
  readonly pointerOffsetX?: number;
  readonly pointerOffsetY?: number;
}

export type RandomFn = () => number;

// Normalized units per second — slow enough to read as drift, not motion.
const DRIFT_SPEED = 0.015;
const MIN_RADIUS_PX = 1;
const MAX_RADIUS_PX = 2.5;
const MIN_OPACITY = 0.25;
const MAX_OPACITY = 0.85;

// Constellation links — ambient-constellation-links design.md Decision 2/4.
// Distance is measured in **pixel space**, not the particles' own normalized
// [0,1) space: a single normalized radius describes an ellipse in pixels on
// any non-square container, so `linkedPairs` projects positions to pixels
// internally rather than pushing that responsibility onto callers.
export const LINK_RADIUS_PX = 160;

export interface LinkedPair {
  readonly a: number; // index into the input particles array
  readonly b: number; // index into the input particles array
  // 1 at zero separation, falling to (and excluded at) 0 at radiusPx.
  readonly strength: number;
}

export interface LinkGeometry {
  readonly width: number;
  readonly height: number;
  readonly radiusPx: number;
}

// Viewport-derived particle count — design.md Decision 5. A fixed particle
// count produces wildly different link density per viewport (link count
// scales as n^2 * R^2 / A), so density — not count — is the constant: the
// count is derived to hold the mean number of neighbours per particle
// steady at TARGET_MEAN_NEIGHBOURS regardless of viewport area.
const TARGET_MEAN_NEIGHBOURS = 5;
const PARTICLE_AREAL_DENSITY =
  TARGET_MEAN_NEIGHBOURS / (Math.PI * LINK_RADIUS_PX * LINK_RADIUS_PX);
const MIN_PARTICLE_COUNT = 40;
const MAX_PARTICLE_COUNT = 260;

export function particleCountForArea(width: number, height: number): number {
  const raw = Math.round(width * height * PARTICLE_AREAL_DENSITY);
  return Math.min(MAX_PARTICLE_COUNT, Math.max(MIN_PARTICLE_COUNT, raw));
}

// Cell-to-cell offsets that cover every unique pair of adjacent cells
// (including diagonals) exactly once when applied while iterating every
// occupied cell — the standard half-neighbourhood trick for a uniform
// spatial grid. Combined with each cell's own same-cell pairs, this is
// equivalent to checking all 8 neighbours of every cell, without visiting
// any cell-pair twice. design.md Decision 5.
const NEIGHBOR_CELL_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
];

// alpha(d) = strength * PEAK — see AmbientSparkleLayer's link peak-alpha
// constant (design.md Decision 4). Expressed in squared distance so no
// `Math.hypot`/`sqrt` is needed in what is otherwise an O(n^2) hot loop.
//
// Bucketed into a uniform grid at cell size `radiusPx` rather than scanned
// naively: because the cell size equals the link radius, two particles
// further apart than one cell (in either axis) can never be within the
// radius, so only the same cell and its 8 neighbours can ever produce a
// link. This is unconditional (not branched on particle count) — it costs
// nothing extra at small counts and cuts pair tests by roughly the ratio of
// grid cells to the naive O(n^2) count at large ones. Its output is required
// to be identical to a naive full scan — see the equivalence test in
// simulation.test.ts.
export function linkedPairs(
  particles: readonly Particle[],
  { width, height, radiusPx }: LinkGeometry
): LinkedPair[] {
  const radiusSquared = radiusPx * radiusPx;
  const cellSize = radiusPx;
  const cols = Math.max(1, Math.ceil(width / cellSize));
  const rows = Math.max(1, Math.ceil(height / cellSize));

  const grid = new Map<string, number[]>();
  for (let i = 0; i < particles.length; i++) {
    const col = Math.min(cols - 1, Math.floor((particles[i]!.x * width) / cellSize));
    const row = Math.min(rows - 1, Math.floor((particles[i]!.y * height) / cellSize));
    const key = `${col},${row}`;
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
    }
    bucket.push(i);
  }

  const pairs: LinkedPair[] = [];
  function tryLink(i: number, j: number): void {
    const dx = (particles[i]!.x - particles[j]!.x) * width;
    const dy = (particles[i]!.y - particles[j]!.y) * height;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < radiusSquared) {
      pairs.push({ a: i, b: j, strength: 1 - distanceSquared / radiusSquared });
    }
  }

  for (const [key, bucket] of grid) {
    for (let bi = 0; bi < bucket.length; bi++) {
      for (let bj = bi + 1; bj < bucket.length; bj++) {
        tryLink(bucket[bi]!, bucket[bj]!);
      }
    }

    const [colStr, rowStr] = key.split(",");
    const col = Number(colStr);
    const row = Number(rowStr);
    for (const [dCol, dRow] of NEIGHBOR_CELL_OFFSETS) {
      const neighbor = grid.get(`${col + dCol},${row + dRow}`);
      if (!neighbor) {
        continue;
      }
      for (const i of bucket) {
        for (const j of neighbor) {
          tryLink(i, j);
        }
      }
    }
  }

  return pairs;
}

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

// Pointer attraction — design.md Decision 6. Values are starting points
// (design.md Open Questions): the influence radius and cap have no
// principled derivation the way link alpha and particle density do, and are
// tuned by eye during browser verification (Task Group 12).
export const POINTER_INFLUENCE_RADIUS_PX = 220;
export const POINTER_MAX_DISPLACEMENT_PX = 24;
const POINTER_EASE_RATE = 8; // 1/s — larger tracks the pointer more snappily

export interface PointerInfluence {
  readonly x: number; // normalized pointer position
  readonly y: number;
  readonly active: boolean;
  // Container dimensions in pixels, needed to measure pointer distance in
  // pixel space rather than normalized space — same aspect-ratio concern
  // `linkedPairs` resolves for link geometry.
  readonly width: number;
  readonly height: number;
}

export function stepParticles(
  particles: readonly Particle[],
  deltaSeconds: number,
  pointer?: PointerInfluence
): Particle[] {
  // Exact exponential-decay easing: offset_next = target + (offset_prev -
  // target) * exp(-k*dt). Composing sub-steps of the same total elapsed
  // time under a constant target reproduces the same result regardless of
  // step count, because exp(-k*dt1) * exp(-k*dt2) * ... = exp(-k*(dt1+dt2+
  // ...)) — this is what makes the attraction's strength independent of
  // frame rate (design.md Decision 6), unlike the reference implementation's
  // per-frame `* 0.005` pull.
  const easeFactor = 1 - Math.exp(-POINTER_EASE_RATE * deltaSeconds);

  return particles.map((particle) => {
    const prevOffsetX = particle.pointerOffsetX ?? 0;
    const prevOffsetY = particle.pointerOffsetY ?? 0;

    // Recover the free-drift ("core") position by subtracting the previous
    // offset, then advance it exactly as the pointer-less form does. `wrap`
    // is a modular reduction, so this recovers the true core position even
    // when the previous frame's x/y crossed the [0,1) boundary.
    const coreX = wrap(
      wrap(particle.x - prevOffsetX) + particle.vx * deltaSeconds
    );
    const coreY = wrap(
      wrap(particle.y - prevOffsetY) + particle.vy * deltaSeconds
    );

    let targetOffsetX = 0;
    let targetOffsetY = 0;
    if (pointer && pointer.active) {
      const dxPx = (pointer.x - coreX) * pointer.width;
      const dyPx = (pointer.y - coreY) * pointer.height;
      const distancePx = Math.hypot(dxPx, dyPx);
      if (distancePx > 0 && distancePx < POINTER_INFLUENCE_RADIUS_PX) {
        // Capped at POINTER_MAX_DISPLACEMENT_PX regardless of how close the
        // pointer is — the bound is on displacement from the free-drift
        // path, not on how near the particle may approach the pointer.
        const pullPx = Math.min(distancePx, POINTER_MAX_DISPLACEMENT_PX);
        targetOffsetX = ((dxPx / distancePx) * pullPx) / pointer.width;
        targetOffsetY = ((dyPx / distancePx) * pullPx) / pointer.height;
      }
    }

    const nextOffsetX =
      targetOffsetX + (prevOffsetX - targetOffsetX) * (1 - easeFactor);
    const nextOffsetY =
      targetOffsetY + (prevOffsetY - targetOffsetY) * (1 - easeFactor);

    return {
      ...particle,
      x: wrap(coreX + nextOffsetX),
      y: wrap(coreY + nextOffsetY),
      pointerOffsetX: nextOffsetX,
      pointerOffsetY: nextOffsetY,
    };
  });
}
