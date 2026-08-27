import {
  createParticles,
  stepParticles,
  linkedPairs,
  particleCountForArea,
  POINTER_INFLUENCE_RADIUS_PX,
  POINTER_MAX_DISPLACEMENT_PX,
} from "./simulation";
import type { Particle } from "./simulation";

// Deterministic sequence so assertions aren't at the mercy of Math.random.
function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value ?? 0;
  };
}

describe("createParticles", () => {
  it("creates exactly `count` particles", () => {
    expect(createParticles(0)).toHaveLength(0);
    expect(createParticles(5)).toHaveLength(5);
    expect(createParticles(140)).toHaveLength(140);
  });

  it("places every particle's position within the normalized [0, 1) field", () => {
    const particles = createParticles(50);
    for (const p of particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(1);
    }
  });

  it("gives every particle a positive radius and an opacity between 0 and 1", () => {
    const particles = createParticles(50);
    for (const p of particles) {
      expect(p.radius).toBeGreaterThan(0);
      expect(p.opacity).toBeGreaterThan(0);
      expect(p.opacity).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic given a deterministic random source", () => {
    const random = () => 0.5;
    const particles = createParticles(3, random);
    expect(particles[0]).toEqual(particles[1]);
    expect(particles[1]).toEqual(particles[2]);
  });
});

describe("stepParticles", () => {
  it("advances position by velocity * deltaSeconds", () => {
    const random = sequenceRandom([
      0.2, 0.4, // x, y
      1, 0.5, // vx random -> (1-0.5)*DRIFT = +half-drift ; vy random 0.5 -> 0 velocity
      0.5, 0.5, // radius, opacity
    ]);
    const [particle] = createParticles(1, random);
    const [stepped] = stepParticles([particle!], 1);
    // vx = (1 - 0.5) * DRIFT_SPEED = 0.5 * 0.015 = 0.0075
    expect(stepped!.x).toBeCloseTo(particle!.x + 0.0075, 10);
    // vy = (0.5 - 0.5) * DRIFT_SPEED = 0
    expect(stepped!.y).toBeCloseTo(particle!.y, 10);
  });

  it("wraps position around the [0, 1) boundary instead of leaving the field", () => {
    const particle = {
      x: 0.999,
      y: 0.001,
      vx: 0.01,
      vy: -0.01,
      radius: 1,
      opacity: 1,
    };
    const [stepped] = stepParticles([particle], 1);
    expect(stepped!.x).toBeGreaterThanOrEqual(0);
    expect(stepped!.x).toBeLessThan(1);
    expect(stepped!.y).toBeGreaterThanOrEqual(0);
    expect(stepped!.y).toBeLessThan(1);
    // 0.999 + 0.01 = 1.009 -> wraps to 0.009
    expect(stepped!.x).toBeCloseTo(0.009, 10);
    // 0.001 - 0.01 = -0.009 -> wraps to 0.991
    expect(stepped!.y).toBeCloseTo(0.991, 10);
  });

  it("does not mutate the input particles array or its entries", () => {
    const particles = createParticles(5);
    const snapshot = particles.map((p) => ({ ...p }));
    stepParticles(particles, 1);
    expect(particles).toEqual(snapshot);
  });

  it("leaves velocity, radius, and opacity unchanged across a step", () => {
    const [particle] = createParticles(1);
    const [stepped] = stepParticles([particle!], 0.5);
    expect(stepped!.vx).toBe(particle!.vx);
    expect(stepped!.vy).toBe(particle!.vy);
    expect(stepped!.radius).toBe(particle!.radius);
    expect(stepped!.opacity).toBe(particle!.opacity);
  });

  it("is a no-op at deltaSeconds = 0", () => {
    const [particle] = createParticles(1);
    const [stepped] = stepParticles([particle!], 0);
    expect(stepped!.x).toBe(particle!.x);
    expect(stepped!.y).toBe(particle!.y);
  });
});

// Helper for tests that need exact, non-random positions — the same pattern
// the "wraps position" test above already uses for a single particle.
function makeParticle(x: number, y: number): Particle {
  return { x, y, vx: 0, vy: 0, radius: 1, opacity: 1 };
}

// A stationary particle (vx = vy = 0), so its free-drift path never moves —
// isolates pointer-easing behaviour from drift in the tests below.
function stationaryParticle(x: number, y: number): Particle {
  return makeParticle(x, y);
}

function offsetMagnitudePx(
  particle: Particle,
  width: number,
  height: number
): number {
  return Math.hypot(
    (particle.pointerOffsetX ?? 0) * width,
    (particle.pointerOffsetY ?? 0) * height
  );
}

describe("stepParticles — pointer influence", () => {
  const width = 1000;
  const height = 1000;

  it("attraction strength is independent of frame rate (exact under constant target)", () => {
    // vx = vy = 0 so the core (free-drift) position never moves, which keeps
    // the pointer's target offset constant across every sub-step — isolating
    // the easing math itself from the (unrelated, already first-order)
    // Euler drift integration.
    const particle = stationaryParticle(0.5, 0.5);
    const pointer = {
      x: 0.5 + 150 / width,
      y: 0.5,
      active: true,
      width,
      height,
    };
    const totalSeconds = 1;

    const [oneStep] = stepParticles([particle], totalSeconds, pointer);

    let multi: Particle[] = [particle];
    const subSteps = 60;
    for (let i = 0; i < subSteps; i++) {
      multi = stepParticles(multi, totalSeconds / subSteps, pointer);
    }

    expect(multi[0]!.x).toBeCloseTo(oneStep!.x, 9);
    expect(multi[0]!.y).toBeCloseTo(oneStep!.y, 9);
  });

  it("bounds displacement from the free-drift path and does not collapse onto the pointer", () => {
    let particles: Particle[] = [stationaryParticle(0.5, 0.5)];
    // Well beyond the displacement cap but inside the influence radius, so
    // the target offset saturates at the cap rather than at the full
    // distance to the pointer.
    const pointerDistancePx = POINTER_MAX_DISPLACEMENT_PX + 100;
    expect(pointerDistancePx).toBeLessThan(POINTER_INFLUENCE_RADIUS_PX);
    const pointer = {
      x: 0.5 + pointerDistancePx / width,
      y: 0.5,
      active: true,
      width,
      height,
    };

    for (let i = 0; i < 500; i++) {
      particles = stepParticles(particles, 1 / 60, pointer);
    }

    const offsetPx = offsetMagnitudePx(particles[0]!, width, height);
    expect(offsetPx).toBeLessThanOrEqual(POINTER_MAX_DISPLACEMENT_PX + 0.05);
    expect(offsetPx).toBeGreaterThan(POINTER_MAX_DISPLACEMENT_PX - 5); // has converged near the cap

    const dxPx = (pointer.x - particles[0]!.x) * width;
    const dyPx = (pointer.y - particles[0]!.y) * height;
    expect(Math.hypot(dxPx, dyPx)).toBeGreaterThan(pointerDistancePx - POINTER_MAX_DISPLACEMENT_PX - 1);
  });

  it("with the pointer inactive, positions evolve exactly as the pointer-less form does", () => {
    const base = createParticles(10);
    const dt = 1 / 30;
    const withoutPointer = stepParticles(base, dt);
    const withInactivePointer = stepParticles(base, dt, {
      x: 0.1,
      y: 0.1,
      active: false,
      width,
      height,
    });
    withoutPointer.forEach((p, i) => {
      expect(withInactivePointer[i]!.x).toBe(p.x);
      expect(withInactivePointer[i]!.y).toBe(p.y);
    });
  });

  it("eases back toward free drift over multiple steps once the pointer goes inactive, rather than snapping instantly", () => {
    let particles: Particle[] = [stationaryParticle(0.5, 0.5)];
    const activePointer = {
      x: 0.5 + 150 / width,
      y: 0.5,
      active: true,
      width,
      height,
    };

    for (let i = 0; i < 120; i++) {
      particles = stepParticles(particles, 1 / 60, activePointer);
    }
    const offsetAfterAttraction = offsetMagnitudePx(particles[0]!, width, height);
    expect(offsetAfterAttraction).toBeGreaterThan(10);

    const inactivePointer = { ...activePointer, active: false };
    const [afterOneRelease] = stepParticles(particles, 1 / 60, inactivePointer);
    const offsetAfterOneStep = offsetMagnitudePx(afterOneRelease!, width, height);
    expect(offsetAfterOneStep).toBeLessThan(offsetAfterAttraction);
    expect(offsetAfterOneStep).toBeGreaterThan(0); // not snapped to zero in a single step

    let released: Particle[] = particles;
    for (let i = 0; i < 300; i++) {
      released = stepParticles(released, 1 / 60, inactivePointer);
    }
    expect(offsetMagnitudePx(released[0]!, width, height)).toBeLessThan(0.5);
  });

  it("measures pointer distance in pixel space, not normalized space — the aspect-ratio case", () => {
    // 2:1 container: the same normalized offset (0.15) is 300px horizontally
    // (beyond the 220px influence radius — no pull) but 150px vertically
    // (within it — pulled).
    const wideWidth = 2000;
    const wideHeight = 1000;
    const delta = 0.15;

    const [afterHorizontal] = stepParticles(
      [stationaryParticle(0.5, 0.5)],
      1,
      {
        x: 0.5 + delta,
        y: 0.5,
        active: true,
        width: wideWidth,
        height: wideHeight,
      }
    );
    const [afterVertical] = stepParticles([stationaryParticle(0.5, 0.5)], 1, {
      x: 0.5,
      y: 0.5 + delta,
      active: true,
      width: wideWidth,
      height: wideHeight,
    });

    expect(afterHorizontal!.pointerOffsetX ?? 0).toBe(0);
    expect(Math.abs(afterVertical!.pointerOffsetY ?? 0)).toBeGreaterThan(0);
  });

  it("is a no-op at deltaSeconds = 0, matching the two-argument form, even with an active pointer", () => {
    const particle = stationaryParticle(0.3, 0.3);
    const [stepped] = stepParticles([particle], 0, {
      x: 0.5,
      y: 0.5,
      active: true,
      width,
      height,
    });
    expect(stepped!.x).toBe(particle.x);
    expect(stepped!.y).toBe(particle.y);
  });
});

describe("linkedPairs", () => {
  it("links a pair separated by less than the radius, measured in pixels", () => {
    const particles = [makeParticle(0, 0), makeParticle(0.05, 0)]; // 50px on a 1000px-wide container
    const pairs = linkedPairs(particles, {
      width: 1000,
      height: 1000,
      radiusPx: 160,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ a: 0, b: 1 });
  });

  it("does not link a pair separated by more than the radius", () => {
    const particles = [makeParticle(0, 0), makeParticle(0.5, 0)]; // 500px, > 160px radius
    const pairs = linkedPairs(particles, {
      width: 1000,
      height: 1000,
      radiusPx: 160,
    });
    expect(pairs).toHaveLength(0);
  });

  it("excludes the boundary case: separation exactly at radiusPx", () => {
    const particles = [makeParticle(0, 0), makeParticle(0.16, 0)]; // exactly 160px
    const pairs = linkedPairs(particles, {
      width: 1000,
      height: 1000,
      radiusPx: 160,
    });
    expect(pairs).toHaveLength(0);
  });

  it("measures distance in pixel space, not normalized space — the aspect-ratio case", () => {
    // 2:1 container. The same *normalized* delta (0.1) is 200px horizontally
    // but only 100px vertically — only the vertical pair should link.
    const width = 2000;
    const height = 1000;
    const radiusPx = 160;
    const horizontalPair = [makeParticle(0, 0), makeParticle(0.1, 0)];
    const verticalPair = [makeParticle(0, 0), makeParticle(0, 0.1)];
    expect(
      linkedPairs(horizontalPair, { width, height, radiusPx })
    ).toHaveLength(0);
    expect(linkedPairs(verticalPair, { width, height, radiusPx })).toHaveLength(
      1
    );
  });

  it("has strength that decreases monotonically toward zero as separation approaches the radius", () => {
    const width = 1000;
    const height = 1000;
    const radiusPx = 160;
    const strengths = [0, 40, 80, 120, 159].map((distPx) => {
      const pairs = linkedPairs(
        [makeParticle(0, 0), makeParticle(distPx / width, 0)],
        { width, height, radiusPx }
      );
      return pairs[0]!.strength;
    });
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeLessThan(strengths[i - 1]!);
    }
    expect(strengths[0]).toBe(1); // d = 0 -> full strength
    expect(strengths[strengths.length - 1]!).toBeGreaterThan(0);
    expect(strengths[strengths.length - 1]!).toBeLessThan(0.02); // near the radius, strength is near zero
  });

  it("returns each pair once, not twice", () => {
    const particles = [
      makeParticle(0, 0),
      makeParticle(0.01, 0),
      makeParticle(0.02, 0),
    ];
    const pairs = linkedPairs(particles, {
      width: 1000,
      height: 1000,
      radiusPx: 160,
    });
    const keys = pairs.map(
      (p) => `${Math.min(p.a, p.b)}-${Math.max(p.a, p.b)}`
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(pairs).toHaveLength(3); // all three particles are mutually within radius
  });
});

// Ground truth for the grid-acceleration equivalence test below — a naive
// O(n^2) scan kept deliberately separate from the production implementation
// so the two can never accidentally become the same code path.
function naiveLinkedPairsForTest(
  particles: readonly Particle[],
  { width, height, radiusPx }: { width: number; height: number; radiusPx: number }
): Array<{ a: number; b: number }> {
  const radiusSquared = radiusPx * radiusPx;
  const pairs: Array<{ a: number; b: number }> = [];
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = (particles[i]!.x - particles[j]!.x) * width;
      const dy = (particles[i]!.y - particles[j]!.y) * height;
      if (dx * dx + dy * dy < radiusSquared) {
        pairs.push({ a: i, b: j });
      }
    }
  }
  return pairs;
}

function sortedPairKeys(pairs: Array<{ a: number; b: number }>): string[] {
  return pairs
    .map((p) => `${Math.min(p.a, p.b)}-${Math.max(p.a, p.b)}`)
    .sort();
}

// Deterministic PRNG (mulberry32) so a failure here is reproducible.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("linkedPairs — grid acceleration equivalence", () => {
  it("matches a naive O(n^2) scan over randomized particles across several aspect ratios, above the grid's break-even count", () => {
    const random = mulberry32(42);
    const aspectRatios = [
      { width: 1000, height: 1000 },
      { width: 2000, height: 1000 },
      { width: 1000, height: 2000 },
      { width: 3440, height: 1440 },
    ];

    for (const { width, height } of aspectRatios) {
      const particles = createParticles(200, random); // above the ~150 break-even
      const grid = linkedPairs(particles, { width, height, radiusPx: 160 });
      const naive = naiveLinkedPairsForTest(particles, {
        width,
        height,
        radiusPx: 160,
      });
      expect(sortedPairKeys(grid)).toEqual(sortedPairKeys(naive));
    }
  });
});

describe("linkedPairs — grid edge cases", () => {
  const width = 1000;
  const height = 1000;
  const radiusPx = 160; // cell size

  it("links a pair straddling a cell boundary", () => {
    const particles = [
      makeParticle(159 / width, 0),
      makeParticle(161 / width, 0),
    ];
    expect(linkedPairs(particles, { width, height, radiusPx })).toHaveLength(
      1
    );
  });

  it("links particles near the normalized 0 edge", () => {
    const particles = [makeParticle(0, 0), makeParticle(50 / width, 0)];
    expect(linkedPairs(particles, { width, height, radiusPx })).toHaveLength(
      1
    );
  });

  it("links particles near the normalized edge approaching 1", () => {
    const particles = [
      makeParticle(0.999 - 50 / width, 0.999),
      makeParticle(0.999, 0.999),
    ];
    expect(linkedPairs(particles, { width, height, radiusPx })).toHaveLength(
      1
    );
  });

  it("handles a container smaller than a single grid cell", () => {
    const smallWidth = 100;
    const smallHeight = 100; // entirely inside one 160px cell
    const particles = [makeParticle(0, 0), makeParticle(0.5, 0.5)];
    // distance = sqrt(50^2 + 50^2) ~= 70.7px, within the 160px radius
    const pairs = linkedPairs(particles, {
      width: smallWidth,
      height: smallHeight,
      radiusPx,
    });
    expect(pairs).toHaveLength(1);
  });
});

describe("particleCountForArea", () => {
  it("scales with area at a constant density, before clamping", () => {
    // Chosen so neither value is near the [40, 260] clamp — see design.md
    // Decision 5: rho = 5 / (pi * 160^2), so 1,000,000px^2 -> ~62 and
    // doubling the area to 2,000,000px^2 -> ~124, i.e. roughly double.
    const base = particleCountForArea(1000, 1000);
    const doubled = particleCountForArea(2000, 1000);
    expect(base).toBeGreaterThan(40);
    expect(base).toBeLessThan(260);
    expect(doubled).toBeCloseTo(base * 2, -1); // within ~10, i.e. rounding-tolerant
  });

  it("clamps to the minimum at very small areas", () => {
    expect(particleCountForArea(10, 10)).toBe(40);
  });

  it("clamps to the maximum at very large areas", () => {
    expect(particleCountForArea(10000, 10000)).toBe(260);
  });

  it("derives ~81 particles at a 1440x900 laptop viewport (design.md Decision 5)", () => {
    const count = particleCountForArea(1440, 900);
    expect(count).toBeGreaterThanOrEqual(79);
    expect(count).toBeLessThanOrEqual(83);
  });
});
