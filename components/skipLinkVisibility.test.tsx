// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { SkipToContentLink, skipLinkClass } from "./SkipToContentLink";
import { SiteHeader } from "./SiteHeader";
import { siteHeaderClass } from "./SiteHeaderStyles";

function extractZIndex(className: string): number {
  const match = className.match(/\bz-(\d+)\b/);
  if (!match) {
    throw new Error(`No z-index utility found in: ${className}`);
  }
  return Number(match[1]);
}

describe("skip link stays visible above the fixed header (design.md Decision 3)", () => {
  it("is the first focusable element in the document with the header mounted", () => {
    const { container } = render(
      <>
        <SkipToContentLink />
        <SiteHeader brandName="Fixture Person" />
      </>
    );
    const focusable = container.querySelectorAll("a[href], button");
    expect(focusable[0]).toHaveTextContent("Skip to content");
  });

  it("keeps the header's z-index below the skip link's focused z-index, so a focused skip link always stacks above it", () => {
    // SkipToContentLink renders at `focus:top-4 focus:left-4` — exactly
    // where the header sits. If the header's stacking order matched or
    // exceeded the skip link's, the skip link would be invisible when
    // focused despite still being present in the DOM.
    expect(extractZIndex(siteHeaderClass)).toBeLessThan(
      extractZIndex(skipLinkClass)
    );
  });
});
