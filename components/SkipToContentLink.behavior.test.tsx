// @vitest-environment jsdom
// jsdom doesn't implement real browsers' "focus the URL-fragment target on
// navigation" behavior, so this doesn't simulate a click end-to-end (that
// was verified live in Chrome). It guards the DOM mechanism the skip link
// depends on: a fragment target needs tabIndex={-1} to be programmatically
// focusable at all, since <main> has no native tab stop.
import { render, cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

describe("skip-link target focusability", () => {
  it("a <main> with id and tabIndex=-1 can receive focus", () => {
    const { getByTestId } = render(
      <main id="main" tabIndex={-1} data-testid="main">
        content
      </main>
    );

    const main = getByTestId("main");
    main.focus();

    expect(document.activeElement).toBe(main);
  });

  it("a <main> without tabIndex cannot receive focus programmatically", () => {
    const { getByTestId } = render(
      <main id="main" data-testid="main">
        content
      </main>
    );

    const main = getByTestId("main");
    main.focus();

    expect(document.activeElement).not.toBe(main);
  });
});
