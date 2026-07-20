// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { CareerChapters } from "./CareerChapters";
import type { ExperienceWithId } from "@/lib/content/read.ts";

const CHAPTER_WITH_LINKED_PROJECT: ExperienceWithId = {
  id: "oracle",
  company: "Oracle Corporation",
  role: "Engineer",
  mission: "Fixture mission.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture context.",
  responsibilities: ["Fixture responsibility"],
  projects: [
    {
      title: "Linked project",
      outcome: "Linked outcome",
      metrics: ["10% improvement"],
      projectId: "adehub",
    },
    {
      title: "Unlinked project",
      outcome: "Unlinked outcome",
      metrics: ["20% improvement"],
    },
  ],
  leadership: ["Fixture leadership"],
  technologies: ["Python"],
  lessons: "Fixture lesson.",
};

describe("CareerChapter — project card linking", () => {
  it("renders a View full project link for an embedded project with a projectId", () => {
    render(<CareerChapters experiences={[CHAPTER_WITH_LINKED_PROJECT]} />);
    const link = screen.getByRole("link", { name: /view full project/i });
    expect(link).toHaveAttribute("href", "#adehub");
  });

  it("renders no project-card link for an embedded project without a projectId", () => {
    render(<CareerChapters experiences={[CHAPTER_WITH_LINKED_PROJECT]} />);
    const links = screen.getAllByRole("link", { name: /view full project/i });
    expect(links).toHaveLength(1);
  });
});
