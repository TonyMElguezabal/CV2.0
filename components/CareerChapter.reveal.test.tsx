// @vitest-environment jsdom
import { render, cleanup } from "@testing-library/react";
import { CareerChapter } from "./CareerChapter";
import { MotionProvider } from "./MotionProvider";
import type { ExperienceWithId } from "@/lib/content/read.ts";

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  (
    globalThis as { IntersectionObserver?: unknown }
  ).IntersectionObserver = NoopIntersectionObserver;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    top: 2000,
    bottom: 2100,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON() {},
  } as DOMRect);
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const FIXTURE_EXPERIENCE: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Fixture mission statement.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture business context sentence.",
  responsibilities: ["Fixture responsibility one", "Fixture responsibility two"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["10% fixture metric"] },
  ],
  leadership: ["Fixture leadership story"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson learned.",
};

// design.md Decision 3 in openspec/changes/scroll-reveal-motion: reveals
// are scoped to headings and section entrances only — chapter body text,
// dates, metrics, and skill evidence are never individually gated behind
// scroll position. A chapter reveals as one whole unit (its outer
// SectionReveal wrapper fades/rises); nothing inside it is separately
// hidden or conditionally rendered based on `revealed` state.
describe("CareerChapter — section entrance reveal scope (Task Group 4)", () => {
  it("renders every piece of substantive content regardless of reveal state — nothing inside a chapter is individually gated", () => {
    // Out of view (not yet revealed) at mount, per the beforeEach mock.
    const { container } = render(
      <MotionProvider>
        <CareerChapter experience={FIXTURE_EXPERIENCE} />
      </MotionProvider>
    );

    // All of this is real content a recruiter or in-page search needs to
    // find — none of it is contingent on the chapter having scrolled into
    // view yet.
    expect(container.textContent).toContain("Fixture business context sentence.");
    expect(container.textContent).toContain("Fixture responsibility one");
    expect(container.textContent).toContain("Fixture responsibility two");
    expect(container.textContent).toContain("Fixture outcome");
    expect(container.textContent).toContain("10% fixture metric");
    expect(container.textContent).toContain("Fixture leadership story");
    expect(container.textContent).toContain("FixtureLang");
    expect(container.textContent).toContain("Fixture lesson learned.");
    expect(container.textContent).toContain("Jan 2018");
  });

  it("reveals the whole chapter as one unit — the outer wrapper carries the reveal marker, not any of its inner sections", () => {
    const { container } = render(
      <MotionProvider>
        <CareerChapter experience={FIXTURE_EXPERIENCE} />
      </MotionProvider>
    );

    const details = container.querySelector("details")!;
    expect(details.className).toContain("reveal-animated");

    // Inner content sections are plain, un-gated markup — no reveal
    // marker class of their own.
    const innerSections = details.querySelectorAll(":scope > div > section");
    expect(innerSections.length).toBeGreaterThan(0);
    for (const section of Array.from(innerSections)) {
      expect(section.className).not.toContain("reveal-animated");
    }
  });
});
