import { focusRingClass } from "./a11yStyles.ts";

export const chatTriggerWrapperClass = "group fixed bottom-6 right-6 z-40";

export const chatTriggerClass = `rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 shadow-lg hover:border-zinc-500 hover:text-white ${focusRingClass}`;

// Revealed via CSS :hover/:focus-within on the wrapper — no JS involved in
// the reveal itself; JS only conditionally removes the tooltip from the DOM
// while the panel is open (see ChatWidget.tsx).
export const chatTooltipClass =
  "pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100";

export const chatPanelClass =
  "fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl";

export const chatPanelHeaderClass =
  "flex items-center justify-between border-b border-zinc-800 px-4 py-3";

export const chatPanelTitleClass = "text-sm font-semibold text-zinc-200";

export const chatCloseButtonClass = `rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white ${focusRingClass}`;

export const chatMessageListClass =
  "flex-1 space-y-3 overflow-y-auto px-4 py-3";

export const chatGreetingClass = "px-4 pb-2 text-sm text-zinc-300";

export const chatStarterQuestionsClass = "flex flex-col gap-2 px-4 pb-3";

export const chatStarterQuestionButtonClass = `rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 hover:border-zinc-500 hover:text-white ${focusRingClass}`;

export const chatMessageVisitorClass =
  "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-200 px-3 py-2 text-sm text-zinc-900";

export const chatMessageAssistantClass =
  "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-100";

export const chatMessageSystemClass =
  "mx-auto max-w-[90%] rounded-lg bg-red-950 px-3 py-2 text-center text-xs text-red-300";

export const chatContactLinksClass =
  "mt-2 flex justify-center gap-3 text-xs";

export const chatContactLinkClass = `underline underline-offset-2 hover:text-red-100 ${focusRingClass}`;

export const chatCitationListClass =
  "mt-2 flex flex-wrap gap-2 border-t border-zinc-700 pt-2";

export const chatCitationLinkClass = `rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 ${focusRingClass}`;

export const chatFormClass =
  "flex items-center gap-2 border-t border-zinc-800 px-3 py-3";

export const chatInputClass = `flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-500 ${focusRingClass}`;

export const chatSubmitButtonClass = `rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${focusRingClass}`;
