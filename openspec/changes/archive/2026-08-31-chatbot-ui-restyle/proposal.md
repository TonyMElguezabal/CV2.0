## Why

The chat widget is the site's one interactive proof that Jose builds AI products, and it currently presents as a plain text button reading "Ask about Jose" — indistinguishable from a support-desk link. It is also the only surface on the site still drawing from raw `zinc-*` classes rather than the bounded palette, which puts it in violation of an already-accepted requirement (`site-visual-language`: "the site's foreground colours ... resolve to the defined token set"), and its input border measures **1.70:1** against the panel — a WCAG 1.4.11 non-text contrast failure that no current spec requirement happens to cover.

Naming the assistant **Mar.IA** turns an anonymous widget into a personality the visitor can recall, which is the actual differentiator on a profile site. That name has to be introduced without weakening the guardrails that keep the bot honest.

## What Changes

- The trigger becomes an **icon-only button** — the 3D robot on a filled `--accent` disc — while keeping its accessible name ("Ask about Jose") via `aria-label`. The existing hover/focus tooltip and its decorative `🤖` emoji (`ChatWidget.tsx:63`) are **kept as-is** — the icon change applies to the trigger button's own content, not the separate tooltip popup.
- The chat widget moves **onto the site's palette tokens** (`--ink`/`--ink-body`/`--hair`/`--accent`), off raw `zinc-*`. This is a conformance fix to an existing requirement, not a new one.
- The input border moves to `--accent`, taking it **1.70:1 → 4.42:1** and clearing the 3:1 non-text threshold.
- The assistant is named **Mar.IA** (pronounced "Maria"). It **may** self-identify; it still answers about Jose in the third person and still refuses to adopt any other persona. Every rendering of the name carries an `aria-hidden`/`sr-only` split so assistive technology announces "Maria", not "Mar dot I A".
- A new **idle invitation bubble** ("Hi! I am Mar.IA") appears on a random 1–5 minute cadence, repeating until the visitor opens the chat, with the interacted flag in `sessionStorage`.
- The panel greeting's fade-and-slide entrance is replaced by a **letter-by-letter typing animation**. **BREAKING** against the current spec's "fade and slide-in entrance".
- The bot's saluting arm animation is carried over from the owner's mockup — transform-only, 4.5s, with its existing reduced-motion guard.
- The bot ships as **optimised PNGs from `/public`** (~40 KB panel, ~14 KB trigger) rather than the mockup's ~181 KB of inline base64, keeping the artwork out of the JS bundle.

## Capabilities

### New Capabilities

- `chat-assistant-identity`: The assistant's defined role as Mar.IA — what it may say about itself, what it must still refuse, and how the name is rendered for assistive technology. Distinct from the refusal capability because it defines an *allowance* (self-identification) that the guardrail spec would otherwise read as prohibited.
- `chat-idle-invitation`: The proactive idle bubble — its cadence, its session-scoped persistence, and the safety rules that keep a timer-driven popup from harming keyboard and screen-reader users.

### Modified Capabilities

- `chat-widget-entry-point`: Trigger becomes icon-only while retaining its accessible name (the existing tooltip and its `🤖` emoji are unchanged); the greeting's fade+slide entrance becomes letter-by-letter typing; the reduced-motion requirement extends to cover the bot animation and idle bubble; the trigger's new icon artwork must be hidden from assistive technology alongside the tooltip's existing emoji.
- `graceful-refusals-and-injection-resistance`: Adds the carve-out that self-identification as Mar.IA is the assistant's defined role rather than an adopted persona — while the requirement to decline *other* personas is unchanged and must stay green.
- `chatbot-eval-and-ship-gate`: The site-meta scenario currently forbids "answering as the chatbot about itself"; identity questions are now expected to succeed. Adds eval coverage for both the new allowance and the retained refusal.
- `accessibility-compliance`: Adds a WCAG 1.4.11 non-text contrast requirement (≥3:1 for UI component boundaries). The existing contrast requirement covers text only, which is why the failing input border passed every gate.

## Impact

**Components** — `ChatWidget.tsx` (icon trigger, `aria-label`, idle-timer state — the tooltip's existing `🤖` emoji markup is left untouched), `ChatWidgetStyles.ts` (palette tokens, sapphire trigger/bubble/input, `bot-salute` keyframes), `ChatPanel.tsx` (typing greeting, replacing the `m.p` fade+slide at the greeting block).

**Content** — `content/profile.yaml` (`chat.greeting` gains the Mar.IA introduction; bubble copy added as content rather than hardcoded), `content/faq.md` and `content/meta.md` (references to "the chat assistant" where naming it is accurate).

**Retrieval** — `lib/rag/generate.ts`'s `SYSTEM_PROMPT` (permit self-identification, retain persona refusal), `lib/rag/eval-set.ts` (identity cases; persona-injection cases that must still refuse). A prompt change means the eval ship-gate must be re-run, not merely re-typechecked.

**Assets** — the bot PNGs must be committed to `public/`. Their only surviving copies are on the `feature/chatbot-ui-restyle` branch under `docs/design/jos-121-chatbot-ui/` (the Linear attachments' signed URLs have expired), so that branch is a hard input to this change.

**Not affected** — `lib/security/config.ts` (`img-src 'self' data:` already permits self-hosted images). No new dependencies. `chatTriggerWrapperClass` is already `position: fixed`, so the always-visible requirement is met today and only needs preserving.

**Risk** — the persona change is the one that can regress silently: a prompt loosened enough to allow self-identification could also loosen persona refusal, which only a live eval run detects.
