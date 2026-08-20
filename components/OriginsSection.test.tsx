// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { OriginsSection } from "./OriginsSection";
import type { Origins } from "@/lib/content/types.ts";

const ORIGINS: Origins = {
  title: "Origins",
  period: "1994 – 2006",
  summary: "Fixture origins summary describing the formative period.",
  entries: [
    {
      id: "ccej",
      label: "Fixture school entry",
      period: "age 13–14",
      organization: "Fixture School",
      narrative: "Fixture self-taught narrative.",
      highlight: "Fixture self-taught highlight.",
      phase: "self-taught",
    },
    {
      id: "inegi",
      label: "Fixture internship entry",
      period: "2004–2006",
      organization: "Fixture Institute",
      narrative: "Fixture formal narrative.",
      phase: "formal",
    },
  ],
};

describe("OriginsSection", () => {
  it("renders the section with id=origins as its anchor target", () => {
    const { container } = render(<OriginsSection origins={ORIGINS} />);
    expect(container.querySelector("#origins")).toBeInTheDocument();
  });

  it("renders the origins record's title and summary from content", () => {
    render(<OriginsSection origins={ORIGINS} />);
    expect(
      screen.getByRole("heading", { name: "Origins" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fixture origins summary describing the formative period.")
    ).toBeInTheDocument();
  });

  it("renders each entry's label, period, and narrative", () => {
    render(<OriginsSection origins={ORIGINS} />);
    expect(screen.getByText(/Fixture school entry/)).toBeInTheDocument();
    expect(screen.getByText("age 13–14")).toBeInTheDocument();
    expect(screen.getByText("Fixture self-taught narrative.")).toBeInTheDocument();
  });

  it("renders an entry's highlight when present, and omits it when absent", () => {
    render(<OriginsSection origins={ORIGINS} />);
    expect(screen.getByText("Fixture self-taught highlight.")).toBeInTheDocument();
    // The formal-phase fixture entry has no highlight — nothing extra rendered for it.
    expect(screen.queryByText(/Fixture formal.*highlight/)).not.toBeInTheDocument();
  });

  it("groups entries into 'The self-taught years' and 'The formal years' beats by their authored phase", () => {
    render(<OriginsSection origins={ORIGINS} />);
    expect(screen.getByText("The self-taught years")).toBeInTheDocument();
    expect(screen.getByText("The formal years")).toBeInTheDocument();
  });

  it("gives each entry an id matching its content id, as a navigation target", () => {
    const { container } = render(<OriginsSection origins={ORIGINS} />);
    expect(container.querySelector("#ccej")).toBeInTheDocument();
    expect(container.querySelector("#inegi")).toBeInTheDocument();
  });

  it("does not drop an entry with no phase — renders it under a fallback group", () => {
    const withUnphased: Origins = {
      ...ORIGINS,
      entries: [
        ...ORIGINS.entries,
        {
          id: "unphased-entry",
          label: "Fixture unphased entry",
          period: "age 20",
          narrative: "Fixture unphased narrative.",
        },
      ],
    };
    render(<OriginsSection origins={withUnphased} />);
    expect(screen.getByText(/Fixture unphased entry/)).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});
