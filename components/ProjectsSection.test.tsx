// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { ProjectsSection } from "./ProjectsSection";
import type { ProjectWithId } from "@/lib/content/read.ts";

const ADEHUB: ProjectWithId = {
  id: "adehub",
  title: "ADEHub — Unified Developer Experience Platform",
  company: "Oracle Corporation",
  skills: ["Technical Program Leadership", "Stakeholder Management"],
  metrics: ["Reached General Availability (GA)"],
  problem: "Fixture problem text.",
  approach: "Fixture approach text.",
  outcome: "Fixture outcome text.",
};

const BACKGROUND_REMOVAL: ProjectWithId = {
  id: "ai-background-removal",
  title: "AI-Powered Background Removal Tool",
  company: "Envato (Placeit.net)",
  skills: ["AI/RAG Solution Delivery"],
  metrics: ["Grew adoption by ~6%"],
  problem: "Fixture problem text 2.",
  approach: "Fixture approach text 2.",
  outcome: "Fixture outcome text 2.",
};

describe("ProjectsSection", () => {
  it("renders one card per project passed in", () => {
    render(<ProjectsSection projects={[ADEHUB, BACKGROUND_REMOVAL]} />);
    expect(
      screen.getByText("ADEHub — Unified Developer Experience Platform")
    ).toBeInTheDocument();
    expect(
      screen.getByText("AI-Powered Background Removal Tool")
    ).toBeInTheDocument();
  });

  it("gives each card an id matching the project id, as a navigation target", () => {
    const { container } = render(<ProjectsSection projects={[ADEHUB]} />);
    expect(container.querySelector("#adehub")).toBeInTheDocument();
  });

  it("renders title, company, and skills from frontmatter", () => {
    render(<ProjectsSection projects={[ADEHUB]} />);
    expect(screen.getByText("Oracle Corporation")).toBeInTheDocument();
    expect(screen.getByText("Technical Program Leadership")).toBeInTheDocument();
    expect(screen.getByText("Stakeholder Management")).toBeInTheDocument();
  });

  it("renders Problem, Approach, Outcome, and Metrics in that fixed order", () => {
    const { container } = render(<ProjectsSection projects={[ADEHUB]} />);
    const card = container.querySelector("#adehub")!;
    const headings = within(card as HTMLElement)
      .getAllByRole("heading")
      .map((h) => h.textContent);
    expect(headings).toEqual([
      "ADEHub — Unified Developer Experience Platform",
      "Problem",
      "Approach",
      "Outcome",
      "Metrics",
    ]);
  });
});
