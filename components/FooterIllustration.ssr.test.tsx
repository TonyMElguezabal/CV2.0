import { renderToStaticMarkup } from "react-dom/server";
import { FooterIllustration } from "./FooterIllustration";

describe("FooterIllustration — server-rendered (no-JS requirement)", () => {
  it("renders the body image and the vector hands/face into the static markup", () => {
    const html = renderToStaticMarkup(<FooterIllustration />);

    expect(html).toMatch(/<svg/);
    expect(html).toMatch(/<image\b/);
    expect(html).toMatch(/maria-footer-body-469x564\.png/);
    expect(html).toMatch(/data-layer="body"/);
    expect(html).toMatch(/data-layer="forearm"/);
    // The hands/face are drawn as real vector shapes, present without JS.
    expect((html.match(/<path\b/g) ?? []).length).toBeGreaterThan(0);
  });
});
