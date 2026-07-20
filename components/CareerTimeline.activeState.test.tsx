// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { CareerTimeline } from "./CareerTimeline";
import type { ExperienceWithId } from "@/lib/content/read.ts";

const OLDER: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Older mission statement.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Older context.",
  responsibilities: ["Did an older thing"],
  projects: [
    { title: "Older project", outcome: "Older outcome", metrics: ["50% improvement"] },
  ],
  leadership: ["Led an older thing"],
  technologies: ["JavaScript"],
  lessons: "Older lesson.",
};

const NEWER: ExperienceWithId = {
  id: "beta",
  company: "Beta",
  role: "Senior Engineer",
  mission: "Newer mission statement.",
  dates: { start: "2021-01" },
  context: "Newer context.",
  responsibilities: ["Did a newer thing"],
  projects: [
    { title: "Newer project", outcome: "Newer outcome", metrics: ["200% improvement"] },
  ],
  leadership: ["Led a newer thing"],
  technologies: ["TypeScript"],
  lessons: "Newer lesson.",
};

// jsdom has no IntersectionObserver implementation. This fake captures the
// callback the component registers so tests can invoke it directly with
// synthetic entries, mirroring the matchMedia-mocking approach used for
// Framer Motion's useReducedMotion in HeroFramer.test.tsx.
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function fireIntersection(
  observer: FakeIntersectionObserver,
  target: Element,
  isIntersecting: boolean
) {
  act(() => {
    observer.callback(
      [{ isIntersecting, target } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver
    );
  });
}

function mockScrollState({
  scrollY,
  innerHeight,
  scrollHeight,
}: {
  scrollY: number;
  innerHeight: number;
  scrollHeight: number;
}) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: innerHeight,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver =
    FakeIntersectionObserver;
  // Default to "not scrolled to the bottom" so the general tracking tests
  // exercise the normal (non-override) path; individual tests override this
  // to exercise the at-bottom behavior.
  mockScrollState({ scrollY: 0, innerHeight: 800, scrollHeight: 4000 });
});

function renderWithChapterTargets(experiences: ExperienceWithId[]) {
  render(
    <>
      <CareerTimeline experiences={experiences} />
      {experiences.map((experience) => (
        <div key={experience.id} id={experience.id} />
      ))}
    </>
  );
  const observer =
    FakeIntersectionObserver.instances[
      FakeIntersectionObserver.instances.length - 1
    ];
  if (!observer) {
    throw new Error("Expected CareerTimeline to construct an IntersectionObserver");
  }
  return observer;
}

describe("CareerTimeline — active-chapter indicator", () => {
  it("marks no node as current before any intersection is reported", () => {
    renderWithChapterTargets([OLDER, NEWER]);
    expect(
      screen.queryByRole("link", { name: /Acme/, current: "location" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Beta/, current: "location" })
    ).not.toBeInTheDocument();
  });

  it("marks the matching node current when its chapter reports isIntersecting: true", () => {
    const experiences = [OLDER, NEWER];
    const observer = renderWithChapterTargets(experiences);
    const acmeTarget = observer.observed.find((el) => el.id === "acme")!;

    fireIntersection(observer, acmeTarget, true);

    const acmeLink = screen.getByRole("link", { name: /Acme/ });
    expect(acmeLink).toHaveAttribute("aria-current", "location");
  });

  it("moves the indicator when a different chapter later intersects", () => {
    const experiences = [OLDER, NEWER];
    const observer = renderWithChapterTargets(experiences);
    const acmeTarget = observer.observed.find((el) => el.id === "acme")!;
    const betaTarget = observer.observed.find((el) => el.id === "beta")!;

    fireIntersection(observer, acmeTarget, true);
    // A narrow reading-line band means the outgoing chapter exits before
    // the next one enters — acme leaving and beta entering as separate
    // callbacks, not simultaneous membership.
    fireIntersection(observer, acmeTarget, false);
    fireIntersection(observer, betaTarget, true);

    expect(screen.getByRole("link", { name: /Beta/ })).toHaveAttribute(
      "aria-current",
      "location"
    );
    expect(screen.getByRole("link", { name: /Acme/ })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("keeps the current indicator when a callback batch has no isIntersecting: true entries", () => {
    const experiences = [OLDER, NEWER];
    const observer = renderWithChapterTargets(experiences);
    const acmeTarget = observer.observed.find((el) => el.id === "acme")!;

    fireIntersection(observer, acmeTarget, true);
    fireIntersection(observer, acmeTarget, false);

    expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute(
      "aria-current",
      "location"
    );
  });

  it("marks the last chapter current once the page is scrolled to the bottom, even if it never entered the reading-line band", () => {
    // Reproduces a real bug found in manual verification: on a short page,
    // a short trailing chapter can rest entirely below the tracking band at
    // max scroll and never report isIntersecting: true on its own.
    const experiences = [OLDER, NEWER];
    const observer = renderWithChapterTargets(experiences);
    const acmeTarget = observer.observed.find((el) => el.id === "acme")!;

    fireIntersection(observer, acmeTarget, true);
    expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute(
      "aria-current",
      "location"
    );

    mockScrollState({ scrollY: 3200, innerHeight: 800, scrollHeight: 4000 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByRole("link", { name: /Beta/ })).toHaveAttribute(
      "aria-current",
      "location"
    );
  });
});
