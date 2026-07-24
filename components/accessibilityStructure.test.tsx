// @vitest-environment jsdom
import { render, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { HeroFramer } from "./HeroFramer";
import { HeroLaptop } from "./HeroLaptop";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";
import { CareerChapters } from "./CareerChapters";
import { ContactSection } from "./ContactSection";
import type { ExperienceWithId } from "@/lib/content/read.ts";
import type { Profile } from "@/lib/content/types.ts";

// Structural rules only — jsdom cannot compute contrast (no real layout),
// so color-contrast is left to the manual/browser gate (design.md
// Decision 6). This exercises heading-order, landmark-unique, button/
// link accessible names, label associations, and ARIA validity.
const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
};

const FIXTURE_EXPERIENCE: ExperienceWithId = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  mission: "Fixture mission statement.",
  dates: { start: "2018-01", end: "2020-06" },
  context: "Fixture business context sentence.",
  responsibilities: ["Fixture responsibility one"],
  projects: [
    { title: "Fixture project", outcome: "Fixture outcome", metrics: ["10%"] },
  ],
  leadership: ["Fixture leadership story"],
  technologies: ["FixtureLang"],
  lessons: "Fixture lesson learned.",
};

const FIXTURE_CONTACT: Pick<Profile, "contact" | "links"> = {
  contact: {
    email: "fixture@example.com",
    scheduling: "https://cal.com/fixture",
  },
  links: { linkedin: "https://www.linkedin.com/in/fixture" },
};

afterEach(() => {
  cleanup();
});

describe("Automated accessibility structure checks", () => {
  it("hero has no structural violations", async () => {
    const { container } = render(
      <ChatWidgetProvider>
        <HeroFramer name="Fixture Person" positioning="Fixture Positioning" />
      </ChatWidgetProvider>
    );

    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("an expanded career chapter has no structural violations", async () => {
    const { container } = render(
      <main>
        <CareerChapters experiences={[FIXTURE_EXPERIENCE]} />
      </main>
    );
    const details = container.querySelector("details");
    if (details) details.open = true;

    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("the open chat widget has no structural violations", async () => {
    const { container } = render(
      <ChatWidgetProvider>
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={{
            email: "fixture@example.com",
            scheduling: "https://cal.com/fixture",
          }}
          tooltipLabel="chat with me"
          greeting="Hi! Fixture greeting."
        />
      </ChatWidgetProvider>
    );
    const trigger = container.querySelector('button[aria-expanded]');
    trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("the contact section has no structural violations", async () => {
    const { container } = render(<ContactSection {...FIXTURE_CONTACT} />);

    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
  });

  it("the composed key surfaces have no structural violations (heading order, unique landmarks)", async () => {
    const { container } = render(
      <ChatWidgetProvider>
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <HeroLaptop terminalLines={["$ whoami", "fixture_person"]} />
        <main id="main">
          <HeroFramer name="Fixture Person" positioning="Fixture Positioning" />
          <CareerChapters experiences={[FIXTURE_EXPERIENCE]} />
          <ContactSection {...FIXTURE_CONTACT} />
        </main>
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={{
            email: "fixture@example.com",
            scheduling: "https://cal.com/fixture",
          }}
          tooltipLabel="chat with me"
          greeting="Hi! Fixture greeting."
        />
      </ChatWidgetProvider>
    );

    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();

    expect(
      container.querySelector('[data-testid="hero-laptop-layer"]')
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      container.querySelectorAll(
        '[data-testid="hero-laptop-layer"] button, [data-testid="hero-laptop-layer"] a, [data-testid="hero-laptop-layer"] [tabindex]'
      )
    ).toHaveLength(0);
  });
});
