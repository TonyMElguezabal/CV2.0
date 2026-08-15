import { createParticles, stepParticles } from "./simulation";

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
