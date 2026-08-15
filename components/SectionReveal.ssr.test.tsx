import { renderToStaticMarkup } from "react-dom/server";
import { SectionReveal } from "./SectionReveal";
import { MotionProvider } from "./MotionProvider";
import { revealAnimatedClass, revealNoscriptOverrideCss } from "./RevealStyles";

// Documents the exact reason the shared <noscript> override in
// app/(marketing)/layout.tsx exists (design.md Decision 2 in
// openspec/changes/scroll-reveal-motion): framer-motion's `initial` prop
// bakes opacity:0 into the server-rendered HTML. Without JavaScript ever
// running, nothing would ever un-hide it — task 1.1's own "with JavaScript
// disabled every section renders at full opacity" requirement is what the
// noscript override is *for*, not something SectionReveal alone provides.
describe("SectionReveal — server-rendered (no-JS) output", () => {
  it("renders opacity:0 in the raw SSR HTML, which the shared noscript override exists to counteract", () => {
    const html = renderToStaticMarkup(
      <MotionProvider>
        <SectionReveal>
          <p>Fixture content</p>
        </SectionReveal>
      </MotionProvider>
    );

    expect(html).toContain("Fixture content");
    expect(html).toContain("opacity:0");
    expect(html).toContain(revealAnimatedClass);
  });
});

describe("revealNoscriptOverrideCss", () => {
  it("forces every reveal-animated element to its fully visible, un-offset state", () => {
    expect(revealNoscriptOverrideCss).toContain(
      `.${revealAnimatedClass} { opacity: 1 !important; transform: none !important; }`
    );
  });

  it("forces the ghost layer hidden instead, so a no-JS visitor never sees a blurred halo behind sharp text", () => {
    expect(revealNoscriptOverrideCss).toMatch(/reveal-ghost.*opacity:\s*0\s*!important/);
  });
});
