import { renderToStaticMarkup } from "react-dom/server";
import { SkipToContentLink } from "./SkipToContentLink";

describe("SkipToContentLink — server-rendered output", () => {
  it("renders an anchor to #main with skip-to-content text", () => {
    const html = renderToStaticMarkup(<SkipToContentLink />);

    expect(html).toMatch(/<a[^>]*href="#main"[^>]*>/);
    expect(html).toMatch(/skip to content/i);
  });

  it("stays visually hidden until focused", () => {
    const html = renderToStaticMarkup(<SkipToContentLink />);

    expect(html).toContain("sr-only");
    expect(html).toMatch(/focus:not-sr-only/);
  });
});
