// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { CareerChapters } from "./CareerChapters";
import type { ExperienceWithId } from "@/lib/content/read.ts";

const CHAPTER_A: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Fixture mission A.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture context A.",
  responsibilities: ["Fixture responsibility A"],
  projects: [
    { title: "Project A", outcome: "Outcome A", metrics: ["10% improvement"] },
  ],
  leadership: ["Fixture leadership A"],
  technologies: ["Python"],
  lessons: "Fixture lesson A.",
};

const CHAPTER_B: ExperienceWithId = {
  id: "beta",
  company: "Beta",
  role: "Senior Engineer",
  mission: "Fixture mission B.",
  dates: { start: "2021-01" },
  context: "Fixture context B.",
  responsibilities: ["Fixture responsibility B"],
  projects: [
    { title: "Project B", outcome: "Outcome B", metrics: ["20% improvement"] },
  ],
  leadership: ["Fixture leadership B"],
  technologies: ["TypeScript"],
  lessons: "Fixture lesson B.",
};

describe("CareerChapter — technology-to-evidence linking", () => {
  it("renders each technology as a link, not plain text", () => {
    render(<CareerChapters experiences={[CHAPTER_A]} />);
    const link = screen.getByRole("link", { name: /Python/i });
    expect(link.tagName).toBe("A");
  });

  it("links a technology to its own chapter's Projects section via a chapter-scoped id", () => {
    render(<CareerChapters experiences={[CHAPTER_A]} />);
    const link = screen.getByRole("link", { name: /Python/i });
    expect(link).toHaveAttribute("href", "#acme-projects");
  });

  it("gives the chapter's Projects section a matching, chapter-scoped id", () => {
    render(<CareerChapters experiences={[CHAPTER_A]} />);
    const heading = screen.getByRole("heading", { name: "Projects" });
    const projectsSection = heading.closest("section");
    expect(projectsSection).toHaveAttribute("id", "acme-projects");
  });

  it("gives the technology link an accessible name indicating its destination, not just the bare tech name", () => {
    render(<CareerChapters experiences={[CHAPTER_A]} />);
    const link = screen.getByRole("link", { name: /Python/i });
    expect(link.textContent?.toLowerCase()).toContain("projects");
  });

  it("scopes technology links per chapter, with no cross-chapter id collision", () => {
    render(<CareerChapters experiences={[CHAPTER_A, CHAPTER_B]} />);

    const pythonLink = screen.getByRole("link", { name: /Python/i });
    expect(pythonLink).toHaveAttribute("href", "#acme-projects");

    const typescriptLink = screen.getByRole("link", { name: /TypeScript/i });
    expect(typescriptLink).toHaveAttribute("href", "#beta-projects");

    const projectsHeadings = screen.getAllByRole("heading", { name: "Projects" });
    const projectsSectionIds = projectsHeadings.map(
      (h) => h.closest("section")?.getAttribute("id")
    );
    expect(new Set(projectsSectionIds).size).toBe(2);
  });
});
