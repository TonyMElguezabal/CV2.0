import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter — server-rendered (no-JS) output", () => {
  it("discloses cookieless analytics and the 180-day retention period", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).toMatch(/cookieless/i);
    expect(html).toMatch(/no personal data/i);
    expect(html).toMatch(/no cookies/i);
    expect(html).toMatch(/180.day/i);
  });

  it("contains no cookie-consent banner", () => {
    const html = renderToStaticMarkup(<SiteFooter />);

    expect(html).not.toMatch(/consent/i);
    expect(html).not.toMatch(/accept cookies/i);
  });
});
