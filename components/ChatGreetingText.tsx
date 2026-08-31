"use client";

import { m } from "framer-motion";
import { toSpokenForm } from "./assistantName";
import {
  CHAT_GREETING_CHAR_STAGGER_SECONDS,
  CHAT_GREETING_CHAR_FADE_SECONDS,
} from "./ChatWidgetStyles";

export interface ChatGreetingTextProps {
  text: string;
  prefersReducedMotion: boolean;
}

// Letter-by-letter typing reveal for the panel greeting — chat-widget-entry-
// point's MODIFIED "Panel shows an animated greeting on open" requirement.
// Follows RevealHeading's *technique* (full text present in the DOM
// immediately, only per-character opacity animated — never progressive
// insertion, so assistive technology never encounters a partial, shifting
// string) but NOT its accessible-name construction: RevealHeading supplies
// the real string via `aria-label` on the heading element itself, which
// works because a heading supports naming from author. This greeting is a
// generic-role element in context (rendered inside a <p> by ChatPanel), and
// `aria-label` on a generic role is unreliably announced across AT
// combinations — so this uses the `aria-hidden` animated layer + `sr-only`
// full-text sibling pattern instead, matching AssistantNameText's
// construction and Decision 3's requirement that "Mar.IA" be announced as
// "Maria" (toSpokenForm handles that derivation for the sr-only layer).
export function ChatGreetingText({
  text,
  prefersReducedMotion,
}: ChatGreetingTextProps) {
  const characters = Array.from(text);
  const spoken = toSpokenForm(text);

  return (
    <>
      <span aria-hidden="true">
        {characters.map((char, index) => {
          const delay = index * CHAT_GREETING_CHAR_STAGGER_SECONDS;
          // A literal space collapses visually in an inline-block span
          // unless preserved — same fix RevealHeading uses.
          const displayChar = char === " " ? " " : char;
          const initial = prefersReducedMotion ? { opacity: 1 } : { opacity: 0 };

          return (
            <m.span
              key={index}
              className="inline-block"
              initial={initial}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: CHAT_GREETING_CHAR_FADE_SECONDS, delay }
              }
            >
              {displayChar}
            </m.span>
          );
        })}
      </span>
      <span className="sr-only">{spoken}</span>
    </>
  );
}
