// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";
import {
  siteHeaderNavClass,
  siteHeaderTopRowClass,
} from "./SiteHeaderStyles";
import { siteNavItems } from "./siteNavigation";

describe("small-viewport adaptation (editorial-frame Task Group 8)", () => {
  it("keeps every nav link in the document and tab order regardless of viewport — no hidden/conditional rendering", () => {
    expect(siteHeaderNavClass).not.toMatch(/\bhidden\b/);
    render(<SiteHeader brandName="Fixture Person" />);
    for (const item of siteNavItems) {
      expect(screen.getByRole("link", { name: item.label })).toBeVisible();
    }
  });

  it("adapts its own height on short viewports rather than persisting unchanged (design.md Risk: a persistent header costs vertical space there)", () => {
    expect(siteHeaderTopRowClass).toMatch(
      /\[@media\(max-height:\d+px\)\]:h-\d+/
    );
    expect(siteHeaderNavClass).toMatch(
      /\[@media\(max-height:\d+px\)\]:h-\d+/
    );
  });
});
