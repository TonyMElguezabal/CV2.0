// @vitest-environment node
//
// Source-content checks on the Tailwind arbitrary-value strings themselves,
// not rendered CSS — jsdom has no layout engine and can't resolve clamp()
// against a real viewport (the same reason HeroLaptop's contrast tests work
// on hex math rather than computed style). This verifies the *declared*
// scale is internally consistent; task 9.3 verifies real rendering with the
// site's actual longest headings in a browser.
import { describe, expect, it } from "vitest";
import { heroNameClass, heroPositioningClass } from "./HeroShellStyles.ts";
import { skillsHeadingClass } from "./SkillsSectionStyles.ts";
import { projectsHeadingClass, projectTitleClass } from "./ProjectsSectionStyles.ts";
import { contactHeadingClass } from "./ContactSectionStyles.ts";
import { chapterHeadingClass } from "./CareerChaptersStyles.ts";

function extractPx(className: string): number {
  const fixed = className.match(/text-\[(\d+(?:\.\d+)?)px\]/);
  if (fixed) return Number(fixed[1]);
  const clampMax = className.match(/text-\[clamp\([^,]+,[^,]+,(\d+(?:\.\d+)?)px\)\]/);
  if (clampMax) return Number(clampMax[1]);
  throw new Error(`No text size found in "${className}"`);
}

describe("type scale (site-typography-and-palette)", () => {
  it("display is at least 5x body at its largest resolved size", () => {
    const displayMax = extractPx(heroNameClass);
    const bodySize = extractPx(heroPositioningClass);
    expect(displayMax / bodySize).toBeGreaterThanOrEqual(5);
  });

  it("distinct heading levels do not share a size", () => {
    const hero = extractPx(heroNameClass);
    const sectionHeading = extractPx(skillsHeadingClass);
    const chapterTitle = extractPx(chapterHeadingClass);

    // Every section heading uses the identical clamp string (that's the
    // point — one shared step), so checking one stands for all four.
    expect(extractPx(projectsHeadingClass)).toBe(sectionHeading);
    expect(extractPx(contactHeadingClass)).toBe(sectionHeading);
    // Both <h3> title roles (chapter, project) share their own step.
    expect(extractPx(projectTitleClass)).toBe(chapterTitle);

    const levels = new Set([hero, sectionHeading, chapterTitle]);
    expect(levels.size).toBe(3);
  });

  it("headings carry text-balance", () => {
    for (const cls of [
      heroNameClass,
      skillsHeadingClass,
      projectsHeadingClass,
      contactHeadingClass,
      chapterHeadingClass,
      projectTitleClass,
    ]) {
      expect(cls).toContain("text-balance");
    }
  });

  it("heading roles use the display face, not the ambient body face", () => {
    for (const cls of [
      heroNameClass,
      skillsHeadingClass,
      projectsHeadingClass,
      contactHeadingClass,
      chapterHeadingClass,
      projectTitleClass,
    ]) {
      expect(cls).toContain("font-display");
    }
  });

  it("the hero display size uses a fluid clamp(), not a fixed value or a breakpoint jump", () => {
    expect(heroNameClass).toMatch(/text-\[clamp\(/);
    expect(heroNameClass).not.toMatch(/\bsm:text-|\bmd:text-/);
  });
});
