"use client";

import { useChatWidget } from "./ChatWidgetContext";
import {
  ctaRowClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "./HeroShellStyles";

export function HeroCtas() {
  const { openChat } = useChatWidget();

  return (
    <div className={ctaRowClass}>
      <a href="#hero-next" className={ctaPrimaryClass}>
        Scroll to explore ↓
      </a>
      <button type="button" onClick={openChat} className={ctaSecondaryClass}>
        Ask AI
      </button>
      <a href="/resume.pdf" download className={ctaSecondaryClass}>
        Download résumé
      </a>
      <a href="#contact" className={ctaSecondaryClass}>
        Contact
      </a>
    </div>
  );
}
