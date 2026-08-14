// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";
import { siteNavItems } from "./siteNavigation";

describe("SiteHeader", () => {
  it("renders a header landmark", () => {
    render(<SiteHeader brandName="Jose Muñoz" />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the brand wordmark inside the header", () => {
    render(<SiteHeader brandName="Jose Muñoz" />);
    expect(screen.getByRole("banner")).toHaveTextContent("Jose Muñoz");
  });

  it("renders one nav link per site nav item, each with its configured href", () => {
    render(<SiteHeader brandName="Jose Muñoz" />);
    const nav = screen.getByRole("navigation", { name: "Site sections" });
    for (const item of siteNavItems) {
      expect(
        within(nav).getByRole("link", { name: item.label })
      ).toHaveAttribute("href", item.href);
    }
  });

  it("gives its nav an accessible name distinct from the timeline's 'Career timeline'", () => {
    render(<SiteHeader brandName="Jose Muñoz" />);
    expect(
      screen.queryByRole("navigation", { name: "Career timeline" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Site sections" })
    ).toBeInTheDocument();
  });

  it("renders a contact action linking to #contact", () => {
    render(<SiteHeader brandName="Jose Muñoz" />);
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "#contact"
    );
  });
});
