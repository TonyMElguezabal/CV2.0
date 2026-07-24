## Context

The chat entry point is two client components. `components/ChatWidget.tsx` renders the persistent trigger `<button>Ask about Jose</button>` (fixed bottom-right, mounted globally in `app/layout.tsx`) and lazily `next/dynamic`-imports the panel on first open. `components/ChatPanel.tsx` renders the panel via `AnimatePresence`/`m.div` inside `MotionProvider` (`LazyMotion`), with a `useReducedMotion() === true` branch already governing the panel's entrance, FAQ starter questions shown only when `messages.length === 0` (~line 245), streaming, citations, and Escape/close handling. Starter questions come from `getFaq()` in `app/layout.tsx`. This is the accepted `chat-widget-entry-point` capability, which also mandates the widget stay **non-modal** (no backdrop/scroll-lock/focus-trap) and give the close button focus on open.

JOS-91 adds two inviting touches — a trigger tooltip and an on-open greeting — resolved with the owner: greeting copy fixed; robot = 🤖 emoji; greeting animates with fade + slide-in; tooltip on hover **and** focus, omitted on touch, robot decorative.

## Goals / Non-Goals

**Goals:**
- Add a hover/focus tooltip (decorative robot + "chat with me") and an on-open, intro-only animated greeting, both content-sourced.
- Preserve the accepted non-modal, reduced-motion, and focus behaviors, and the code-split/perf budget.
- Add no new dependency.

**Non-Goals:**
- Any change to streaming/citations, `POST /api/chat`, guardrails, or RAG generation.
- Wiring the terminal/robot to anything interactive; auto-popping the tooltip as a timed nudge.

## Decisions

### 1. Robot as an emoji, not an asset
Use 🤖 inline in the tooltip. **Alternatives:** inline SVG (heavier markup, no benefit here) or an image (asset bytes + CSP/LCP considerations). Emoji is zero-weight, CSP-safe, and rendered `aria-hidden` so it is decorative only.

### 2. Tooltip revealed by CSS hover + `focus-visible`, hidden when open
Wrap the trigger in `ChatWidget.tsx` and reveal the tooltip via CSS on `:hover`/`:focus-visible`, guarded by `!isOpen`. Touch devices get no hover and no tooltip — acceptable because the button's visible label already conveys purpose. **Alternative:** a JS-driven tooltip library (rejected — unnecessary dependency for a static hint). The trigger keeps its accessible name; the robot is `aria-hidden`, so the tooltip needs no `aria-describedby` wiring (it adds no information beyond the label).

### 3. Greeting as an intro block in the panel, gated like starter questions
Render the greeting in `ChatPanel.tsx` when `messages.length === 0`, above the starter-questions block, as an `m.div` using the existing `useReducedMotion` branch for the fade + slide-in (final-state, no motion, under reduced-motion). Reusing the `messages.length === 0` guard gives the intro-only lifecycle for free and matches how starter questions already disappear. The greeting must not steal focus — the close button still gets focus on open (unchanged effect in `ChatPanel.tsx`). **Alternative:** a first assistant chat bubble (rejected — it would read as a real streamed answer, complicate the message list/`aria-live`, and not be "prominent" above the starters).

### 4. Copy in content, threaded through the layout
Add `greeting` and `tooltipLabel` (e.g. under a `chat` block) to `lib/content/schemas.ts` (Zod), authored in `/content`, read in `app/layout.tsx`, and passed as props to `ChatWidget` (label) and `ChatPanel` (greeting). Validated by `npm run validate:content`. Keeps user-facing copy out of components per the content-first principle.

### 5. No perf/bundle impact
The tooltip is CSS + an emoji in the already-shipped trigger; the greeting is a small block inside the already code-split panel using the motion features it already loads. No new dependency, no change to the code-split boundary, so First Load JS is unaffected.

## Risks / Trade-offs

- **[Risk] Touch users never see the tooltip.** → Accepted: the visible button label "Ask about Jose" conveys purpose; the tooltip is a progressive enhancement, not the only affordance.
- **[Risk] The greeting could feel like a chat message or be announced disruptively.** → Render it as a distinct non-bubble block outside the `aria-live` message list, static text (only the container animates), so screen readers get plain content and the animation is decorative.
- **[Risk] Greeting animation regresses reduced-motion or focus behavior.** → Reuse the existing `useReducedMotion` branch and leave the close-button focus effect untouched; cover both with tests.
- **[Trade-off] Copy lives in content, adding a schema field for two short strings.** → Accepted; consistent with the repo's content-first rule and keeps wording editable without a code change.

## Migration Plan

Branch `joseelguezabal/jos-91-chat-window-with-more-information` → add `greeting`/`tooltipLabel` to the content schema + `/content` (`validate:content` green) → implement the tooltip in `ChatWidget.tsx` and the greeting in `ChatPanel.tsx`, threading content from `app/layout.tsx` → `npm test` / `tsc` / `validate:content` clean → `next build` to confirm no First Load JS regression and the panel stays a separate chunk → merge → sync the delta into `openspec/specs/chat-widget-entry-point/` and archive. Rollback is a plain revert of the two components + the content field; behavior returns to the current entry point.

## Open Questions

- None blocking — greeting copy, robot representation, animation style, and tooltip trigger are all resolved on the ticket. The exact content-schema field names and mobile/touch styling are implementation details.
