import { focusRingClass } from "./a11yStyles.ts";

export const chatTriggerWrapperClass = "group fixed bottom-6 right-6 z-40";

// Filled --accent disc with the white-bodied 3D bot render — the highest-
// attention option that stays on-palette (chatbot-ui-restyle design.md
// Decision 1: white artwork on #4d82bd measures 4.01:1, clearing the 3:1
// non-text threshold). No border needed on a filled circle; hover/focus
// use a compositor-friendly transform + shadow rather than a colour swap,
// since there's no second accent shade defined to swap to.
export const chatTriggerClass = `flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg transition-transform hover:scale-105 hover:shadow-xl ${focusRingClass}`;

export const chatTriggerBotImageClass = "h-9 w-9 object-contain";

// Panel bot: body + saluting arm, two stacked layers matching the
// owner's mockup structure (docs/design/jos-121-chatbot-ui/reference/
// ask-about-jose.html's .bot-wrap). Sized to the documented display
// target — "panel @240px (~120px displayed)" — an arbitrary-value class
// rather than a stock Tailwind size step, since 120px isn't one.
export const chatBotWrapClass = "relative mx-auto mb-4 mt-1 w-fit";
export const chatBotBodyImageClass = "block h-[120px] w-auto";
export const chatBotArmImageClass = "absolute left-0 top-0 h-[120px] w-auto";

// bot-salute, ported from the mockup as a framer-motion keyframe/times
// pair rather than a literal CSS @keyframes block — this codebase has no
// existing mechanism for declaring raw CSS keyframes (every other
// animated surface uses Tailwind's built-in utilities or framer-motion's
// `animate` prop instead), so this is the equivalent construction in the
// pattern already established sitewide. Values match the mockup's
// keyframe percentages (as `times`, 0-1) and rotation degrees exactly:
// 0%,8% -> 0deg; 22% -> 115deg (raise); 30% -> 100deg (wave); 38% ->
// 118deg; 46% -> 102deg; 54% -> 115deg; 70% -> 112deg (hold); 84%,100% ->
// 0deg (rest). Transform-only (rotate), so this stays compositor-friendly
// per performance-budget-compliance.
export const BOT_SALUTE_DURATION_SECONDS = 4.5;
export const BOT_SALUTE_ROTATE_KEYFRAMES = [0, 0, 115, 100, 118, 102, 115, 112, 0, 0];
export const BOT_SALUTE_TIMES = [0, 0.08, 0.22, 0.3, 0.38, 0.46, 0.54, 0.7, 0.84, 1];
// Shoulder pivot, from the mockup's `.bot-arm { transform-origin: 27.3% 54.1% }`.
export const BOT_ARM_TRANSFORM_ORIGIN = "27.3% 54.1%";

// Idle invitation bubble — chat-idle-invitation spec. Positioned the same
// way as the hover tooltip (above the trigger), but persistent while
// visible rather than CSS-hover-revealed, and dismissible.
export const chatIdleBubbleClass =
  "absolute bottom-full right-0 mb-2 flex items-center gap-2 whitespace-nowrap rounded-lg border border-accent bg-zinc-900 px-3 py-1.5 text-xs text-ink-body shadow-lg";

export const chatIdleBubbleDismissClass = `rounded-full p-0.5 text-ink-meta hover:text-ink ${focusRingClass}`;

// Greeting typing animation (chat-widget-entry-point MODIFIED requirement,
// chatbot-ui-restyle Task Group 8). Deliberately its own, shorter timing
// rather than reusing RevealHeading's pace.duration/REVEAL_HEADING_STAGGER
// verbatim: RevealHeading's 1.4s-per-character fade is tuned for a short
// heading's slow cascading reveal, not a multi-sentence greeting simulating
// a typewriter — a snappy per-character fade reads as "typing," a slow one
// reads as "cascading blur reveal" (a different, already-used effect).
// Stagger is shared with RevealHeading's rhythm (0.03s) for cross-site
// consistency in how per-character reveals feel, even though the fade
// duration itself differs for the reason above.
export const CHAT_GREETING_CHAR_STAGGER_SECONDS = 0.03;
export const CHAT_GREETING_CHAR_FADE_SECONDS = 0.12;

// Revealed via CSS :hover/:focus-within on the wrapper — no JS involved in
// the reveal itself; JS only conditionally removes the tooltip from the DOM
// while the panel is open (see ChatWidget.tsx). The tooltip's decorative
// 🤖 emoji and its existing zinc-shaded label colour are intentionally
// untouched by the chatbot-ui-restyle palette conformance pass — kept
// as-is per owner decision (see that change's design.md Decision 2
// correction).
export const chatTooltipClass =
  "pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100";

export const chatPanelClass =
  "fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl";

export const chatPanelHeaderClass =
  "flex items-center justify-between border-b border-zinc-800 px-4 py-3";

export const chatPanelTitleClass = "text-sm font-semibold text-ink";

export const chatCloseButtonClass = `rounded-full p-1 text-ink-meta hover:bg-zinc-800 hover:text-ink ${focusRingClass}`;

export const chatMessageListClass =
  "flex-1 space-y-3 overflow-y-auto px-4 py-3";

export const chatGreetingClass = "px-4 pb-2 text-sm text-ink-body";

export const chatStarterQuestionsClass = "flex flex-col gap-2 px-4 pb-3";

export const chatStarterQuestionButtonClass = `rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-ink-body hover:border-zinc-500 hover:text-ink ${focusRingClass}`;

// Deliberate exception to the --ink family: this bubble is an inverted
// light chip (bg-zinc-200), not the dark page/panel surface the --ink
// tokens are calibrated against, so text-zinc-900 stays as dark-on-light
// text rather than being forced onto a token designed for the opposite
// case. See palette.test.tsx's documented exception for this line.
export const chatMessageVisitorClass =
  "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-200 px-3 py-2 text-sm text-zinc-900";

export const chatMessageAssistantClass =
  "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-800 px-3 py-2 text-sm text-ink-body";

export const chatMessageSystemClass =
  "mx-auto max-w-[90%] rounded-lg bg-red-950 px-3 py-2 text-center text-xs text-red-300";

export const chatContactLinksClass =
  "mt-2 flex justify-center gap-3 text-xs";

export const chatContactLinkClass = `underline underline-offset-2 hover:text-red-100 ${focusRingClass}`;

export const chatCitationListClass =
  "mt-2 flex flex-wrap gap-2 border-t border-zinc-700 pt-2";

export const chatCitationLinkClass = `rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-ink-meta hover:border-zinc-400 hover:text-ink-body ${focusRingClass}`;

export const chatFormClass =
  "flex items-center gap-2 border-t border-zinc-800 px-3 py-3";

// Border moved from zinc-700 to --accent: the prior border measured
// 1.70:1 against the panel background, failing WCAG 1.4.11 non-text
// contrast (needs 3:1) — --accent measures 4.42:1. See
// chatbot-ui-restyle design.md Decision 1.
export const chatInputClass = `flex-1 rounded-full border border-accent bg-zinc-950 px-3 py-2 text-sm text-ink placeholder:text-ink-meta focus:border-accent ${focusRingClass}`;

export const chatSubmitButtonClass = `rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-ink-body hover:border-zinc-500 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`;

// Thinking indicator: a 3-dot row shown inside an assistant-styled bubble
// from submit until the first token arrives — Decisions 2/3 in
// openspec/changes/chat-thinking-indicator. Animated variant uses Tailwind's
// built-in transform-only `animate-bounce`; the static variant (reduced
// motion) omits it entirely.
export const chatThinkingDotsRowClass = "flex items-center gap-1 py-1";

export const chatThinkingDotClass = "h-1.5 w-1.5 rounded-full bg-zinc-400";

export const chatThinkingDotAnimatedClass = `${chatThinkingDotClass} animate-bounce`;
