import { focusRingClass } from "./a11yStyles.ts";
import { ctaPrimaryClass, ctaSecondaryClass } from "./HeroShellStyles.ts";
import {
  chatTriggerClass,
  chatCloseButtonClass,
  chatStarterQuestionButtonClass,
  chatSubmitButtonClass,
  chatCitationLinkClass,
  chatContactLinkClass,
  chatInputClass,
} from "./ChatWidgetStyles.ts";

const RING_MARKER = "focus-visible:outline";

describe("visible focus on every interactive surface", () => {
  it("hero CTAs carry the shared focus ring", () => {
    expect(ctaPrimaryClass).toContain(RING_MARKER);
    expect(ctaSecondaryClass).toContain(RING_MARKER);
  });

  it("every chat-widget control carries the shared focus ring", () => {
    expect(chatTriggerClass).toContain(RING_MARKER);
    expect(chatCloseButtonClass).toContain(RING_MARKER);
    expect(chatStarterQuestionButtonClass).toContain(RING_MARKER);
    expect(chatSubmitButtonClass).toContain(RING_MARKER);
    expect(chatCitationLinkClass).toContain(RING_MARKER);
    expect(chatContactLinkClass).toContain(RING_MARKER);
  });

  it("the chat input no longer suppresses its focus indicator", () => {
    expect(chatInputClass).not.toContain("focus:outline-none");
    expect(chatInputClass).toContain(RING_MARKER);
  });

  it("focusRingClass is the shared utility used everywhere", () => {
    expect(focusRingClass).toContain(RING_MARKER);
  });
});
