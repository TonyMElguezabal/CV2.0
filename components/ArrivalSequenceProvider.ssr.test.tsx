import { renderToStaticMarkup } from "react-dom/server";
import { m } from "framer-motion";
import { MotionProvider } from "./MotionProvider";
import { ArrivalSequenceProvider, useArrivalStep } from "./ArrivalSequenceProvider";
import { arrivalAnimatedClass, arrivalNoscriptOverrideCss } from "./ArrivalStyles";

// Documents the exact reason the shared <noscript> override in
// app/(marketing)/layout.tsx exists (mirrors scroll-reveal-motion's own
// SectionReveal.ssr.test.tsx): framer-motion's `initial` prop bakes
// opacity:0 into the server-rendered HTML for every participant, so
// without JavaScript ever running, nothing would un-hide it on its own —
// task 1.1's "with JavaScript disabled every participant renders in final
// visible state" is what the noscript override is *for*.
function Probe() {
  const step = useArrivalStep(0.5);
  return (
    <m.div
      className={arrivalAnimatedClass}
      initial={step.initial}
      animate={step.animate}
      transition={step.transition}
    >
      Fixture content
    </m.div>
  );
}

describe("arrival-sequence participants — server-rendered (no-JS) output", () => {
  it("renders opacity:0 in the raw SSR HTML, which the shared noscript override exists to counteract", () => {
    const html = renderToStaticMarkup(
      <MotionProvider>
        <ArrivalSequenceProvider>
          <Probe />
        </ArrivalSequenceProvider>
      </MotionProvider>
    );

    expect(html).toContain("Fixture content");
    expect(html).toContain("opacity:0");
    expect(html).toContain(arrivalAnimatedClass);
  });
});

describe("arrivalNoscriptOverrideCss", () => {
  it("forces every arrival-animated element to its fully visible, un-offset state", () => {
    expect(arrivalNoscriptOverrideCss).toBe(
      `.${arrivalAnimatedClass} { opacity: 1 !important; transform: none !important; }`
    );
  });
});
