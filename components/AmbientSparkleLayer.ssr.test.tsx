import { renderToStaticMarkup } from "react-dom/server";
import { AmbientSparkleLayer } from "./AmbientSparkleLayer";

describe("AmbientSparkleLayer — server-rendered (no-JS) output", () => {
  it("renders an empty, aria-hidden canvas without any client-side rendering step", () => {
    const html = renderToStaticMarkup(<AmbientSparkleLayer />);

    expect(html).toContain("aria-hidden=\"true\"");
    expect(html).toContain("<canvas");
    // No text, no fallback content — the field is purely decorative, so
    // there is nothing that needs a no-JS equivalent (unlike HeroLaptop's
    // <noscript> override, which exists because it has real content — the
    // terminal — that must look correct without JS). A blank canvas is the
    // fully correct no-JS state here.
    expect(html).not.toMatch(/>[^<]+</);
  });
});
