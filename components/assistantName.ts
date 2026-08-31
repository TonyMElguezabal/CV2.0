// Single source of truth for the assistant's name in both its visual and
// spoken forms — chatbot-ui-restyle design.md Decision 3. "Mar.IA" is
// announced by screen readers as "Mar dot I A" (the period is read
// literally), so every rendering needs a pronounceable alternative. Kept
// as plain string constants + a derivation function, not hardcoded per
// call site, so the two forms can never drift apart.
export const ASSISTANT_NAME_STYLED = "Mar.IA";
export const ASSISTANT_NAME_SPOKEN = "Maria";

// Derives the screen-reader-safe form of any content string containing
// the styled name — used directly by the greeting's typing animation
// (chatbot-ui-restyle Task Group 8), which needs a complete spoken
// sentence for its sr-only layer, not just the name in isolation.
export function toSpokenForm(text: string): string {
  return text.split(ASSISTANT_NAME_STYLED).join(ASSISTANT_NAME_SPOKEN);
}
