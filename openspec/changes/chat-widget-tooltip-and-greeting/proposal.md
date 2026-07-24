## Why

The "Ask about Jose" chat entry point is functional but bare: the trigger gives no hint of what it does, and the panel opens straight into starter questions with no framing. JOS-91 makes it more inviting — a hover/focus tooltip with a friendly robot, and a warm animated greeting when the panel opens — so visitors understand the assistant and feel encouraged to ask (PRD §5 F5).

## What Changes

- **A tooltip on the chat trigger.** On hover or keyboard focus (panel closed), a small popup shows a robot emoji (🤖, decorative) and the label "chat with me". It dismisses on blur/mouse-leave, is not shown while the panel is open, and does not obscure content, trap focus, or change the button's accessible name. Omitted on touch (no hover; the button label already conveys purpose).
- **An animated greeting on open.** When the panel opens with no prior messages, a prominent greeting appears with a fade + slide-in animation, positioned above the existing FAQ starter questions. Copy: _"Hi! I'm an AI assistant Jose built to answer questions about him. Here are a few examples — or just type your own question!"_ The greeting is intro-only — it is no longer shown once the first message is sent (same lifecycle as the starter questions).
- **Copy is content-sourced.** The greeting text and tooltip label live in `/content` (Zod-validated), not hardcoded in components.
- **Reduced-motion and accessibility preserved.** Under `prefers-reduced-motion: reduce`, the tooltip/greeting show their final state with no motion; the widget stays non-modal (no backdrop, scroll lock, or focus trap) and the close button still receives focus on open.
- **Out of scope:** changing the streaming/citation contract, the `POST /api/chat` endpoint, guardrails/cost controls, or the RAG generation; adding any new chat capability beyond the tooltip and greeting.

## Capabilities

### New Capabilities

_None._ The tooltip and greeting are additions to the existing chat entry point, modeled as a modification of `chat-widget-entry-point` rather than a new capability.

### Modified Capabilities

- `chat-widget-entry-point`: adds a hover/focus tooltip on the trigger (decorative robot + "chat with me" label, hidden while open, non-interfering) and an on-open, intro-only animated greeting shown above the starter questions, with reduced-motion respected and the existing non-modal guarantees preserved. The trigger, starter-question, streaming, non-modal, and dismiss requirements are otherwise unchanged.

## Impact

- **Modified files:** `components/ChatWidget.tsx` (tooltip on the trigger), `components/ChatPanel.tsx` (greeting block above starter questions, reduced-motion aware), `components/ChatWidgetStyles.ts` (tooltip + greeting styles), `lib/content/schemas.ts` + `/content/*` (greeting + tooltip label as validated content), `app/layout.tsx` (thread the new content to the widget/panel).
- **Tests touched:** `components/ChatWidget.test.tsx` (tooltip on hover/focus, hidden when open), `components/ChatPanel.test.tsx` (greeting on open with no messages, reduced-motion static, disappears after first message).
- **Capabilities this change must continue to satisfy (not modified):** `performance-budget-compliance` (chat panel stays code-split; no First Load JS regression; transform/opacity only; 60fps) and `accessibility-compliance` (decorative `aria-hidden` robot, keyboard-reachable tooltip, contrast, reduced-motion).
- **No new dependency, no new endpoint, no API schema change, no new environment variable.** Robot is an emoji (no asset, CSP-safe).
