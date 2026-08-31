## Context

The chat widget is the site's only interactive demonstration that Jose builds AI products. It currently renders as a text button ("Ask about Jose") with a `🤖` emoji tooltip, and its panel is the one surface still styled from raw `zinc-*` Tailwind classes rather than the site's bounded palette tokens.

The owner supplied four reference artifacts. Their Linear signed URLs have since expired; the only surviving copies live on the `feature/chatbot-ui-restyle` branch under `docs/design/jos-121-chatbot-ui/`, which makes that branch a hard build input rather than a convenience.

What the reference mockup (`ask-about-jose.html`, 189,962 bytes) actually implements is narrower than it first appears: it is a static mockup of the **open panel only**. It contributes exactly two things — the `bot-salute` keyframes (4.5s, transform-only, `rotate` 0°→115°→wave→rest) and the `.bot-arm` shoulder pivot (`transform-origin: 27.3% 54.1%`), which is why the bot ships as two stacked layers rather than one image. It already carries a `prefers-reduced-motion` guard. The icon trigger, the idle bubble, and the typing greeting exist **only as screenshots** — there is no implementation to copy for any of them.

Three current-state facts were verified in code before designing against them:

| Fact | Evidence |
| --- | --- |
| Trigger is already always-visible | `chatTriggerWrapperClass` = `group fixed bottom-6 right-6 z-40` |
| Input border fails non-text contrast | `border-zinc-700` on panel `bg-zinc-900` = **1.70:1** (needs 3:1) |
| Widget is off the bounded palette | `ChatWidgetStyles.ts` is entirely `zinc-*`; no `--ink`/`--accent` tokens |

Contrast figures in this document were recomputed from the WCAG 2.1 relative-luminance formula against the actual token values in `app/globals.css`, not carried over from the ticket.

## Goals / Non-Goals

**Goals:**

- Make the trigger read as an AI assistant rather than a support link, without losing its accessible name.
- Give the assistant a recallable identity (Mar.IA) while keeping every existing guardrail green.
- Fix the input's non-text contrast failure and bring the widget onto the bounded palette.
- Add a proactive idle invitation that cannot harm keyboard or screen-reader users.
- Keep the bot artwork out of the JS bundle.

**Non-Goals:**

- Changing the streaming/citation contract (`streamed-chat-answers`) — untouched.
- Making the widget modal. It stays non-modal: no backdrop, no scroll lock, no focus trap.
- Adopting the mockup's green (`#00703b`). See Decision 1.
- Rewriting `RevealHeading` to be shared. See Decision 4.
- Adding a cookie or any server-side persistence for the bubble.

## Decisions

### Decision 1 — Sapphire, not the mockup's green; and the input border is a real defect

The mockup samples as `#00703b`. Green appears nowhere in the site's palette, and `--accent` was **owner-selected from an explicit bronze/emerald/sapphire comparison in which emerald was evaluated and rejected** (JOS-105). Re-introducing green through the chat widget would silently reverse a decision already made deliberately. The widget recolours to `--accent: #4d82bd`.

The input border is not merely a preference. Measured against the surfaces they actually render on:

| Element | Contrast | Verdict |
| --- | --- | --- |
| Input border `zinc-700` on panel `zinc-900` | **1.70:1** | ❌ fails WCAG 1.4.11 (needs 3:1) |
| Input border `--accent` on panel `zinc-900` | **4.42:1** | ✅ |
| Input text `zinc-100` on `zinc-950` | 18.10:1 | ✅ |
| Placeholder `zinc-400` on `zinc-950` | 7.76:1 | ✅ |
| White bot on filled `--accent` disc | 4.01:1 | ✅ passes 3:1 non-text |

The text was never the problem; the *boundary* was nearly invisible. Moving it to `--accent` fixes the accessibility failure and the attention problem with one change.

**Why no existing gate caught this:** `accessibility-compliance`'s contrast requirement is scoped to **text** ("normal-size text meets at least 4.5:1 and large text at least 3:1"). WCAG 1.4.11 non-text contrast — which governs input borders and other UI component boundaries — has no corresponding requirement. That gap is closed by this change rather than worked around.

**The palette move is a conformance fix, not a new requirement.** `site-visual-language` already requires that "the site's foreground colours ... resolve to the defined token set rather than to arbitrary steps of an open colour scale." The chat widget's `zinc-*` usage violates that today. No delta spec is needed for it; it needs fixing, and `palette.test.tsx` should cover `ChatWidgetStyles.ts` so it cannot drift back.

*Alternative considered:* keeping `zinc-*` and only darkening the border. Rejected — it would fix the number while leaving the widget the single off-palette surface, and the bounded-palette requirement would still be violated.

### Decision 2 — The trigger gets the 3D render; the tooltip keeps its emoji

**Correction, 2026-08-31**: an earlier draft of this decision removed the tooltip's `🤖` emoji (`ChatWidget.tsx:63`) on "one robot, not two" reasoning. The owner asked to keep it — it stays exactly as-is. The reasoning below is corrected accordingly.

These are two distinct surfaces serving different purposes, not one robot in competition with itself. The **trigger button** currently shows plain text ("Ask about Jose") and gains the 3D render as its icon — that's the actual IA gap this decision closes, since the trigger has never had any robot imagery. The **tooltip** is a separate, small hover/focus popup that already shows `🤖 chat with me` and is untouched by this change; it is a lightweight, zero-asset, purely decorative flourish, not a second attempt at the same branding job the trigger icon does. Nothing requires them to use the same artwork.

The 3D render becomes the trigger and panel's canonical robot, but is **not** shipped the way the mockup ships it:

| Delivery | Size |
| --- | --- |
| As-is, inline base64 (mockup) | **181 KB**, inside the bundle |
| Optimised PNG from `/public`, panel @240px | **40.2 KB** |
| Optimised PNG from `/public`, trigger @112px | **13.8 KB** |

Same artwork, ~3.5× smaller, and served as cacheable static assets so it never enters First Load JS (~123 KB gzip today against a documented ~160 KB regression threshold). `img-src 'self' data:` in `lib/security/config.ts` already permits this — no CSP change.

*Alternative considered:* an SVG robot. Rejected — no SVG exists; the owner's artwork is a raster 3D render, and redrawing it would change the design the owner approved.

### Decision 3 — Mar.IA is a *defined role*, not an *adopted persona*

This distinction is the whole safety argument, so it is stated precisely:

- ✅ Mar.IA **may** self-identify ("I'm Mar.IA", "I'm his assistant") — **new, allowed**
- ✅ Answers about Jose remain **third person** — unchanged
- ❌ Mar.IA still **refuses** to become a pirate, another bot, or Jose himself — unchanged

Naming the assistant does not widen what it may claim; it names the role it already occupied. The `SYSTEM_PROMPT` change must therefore be additive and narrow — permitting self-identification — while leaving "requests to adopt another persona — decline and remain in this role" intact.

**The panel title stays "Ask about Jose."** It is task-oriented and meaningful to a first-time visitor and to screen readers; "Mar.IA" as a title would be a name with no explanation. The name is introduced in the greeting *inside* the panel instead.

**Pronunciation is a hard requirement, not polish.** Screen readers announce "Mar.IA" as *"Mar dot I A"*. Every rendering uses:

```html
<span aria-hidden="true">Mar.IA</span><span class="sr-only">Maria</span>
```

Assistant pronouns are deliberately left unspecified; copy avoids pronouns for Mar.IA entirely.

*Risk this decision carries:* a prompt loosened to allow self-identification could also loosen persona refusal. Unit tests against fake providers cannot detect this — only a live eval run can, which is why the ship gate is non-negotiable for this change.

### Decision 4 — The typing greeting follows `RevealHeading`'s technique but **cannot** reuse its accessibility trick

`RevealHeading` is the established per-character precedent, and its core technique transfers directly: **render the full text, animate per-character opacity** — never progressively insert DOM nodes, which would make a screen reader announce a partial, shifting string.

Its *accessibility* mechanism does not transfer. `RevealHeading` wraps the per-character markup in `aria-hidden` and supplies the real string via `aria-label` **on the heading element itself** (`<h2 aria-label={text}>`). That works because `h2`/`h3` support naming from author. The greeting is a `<p>` — a generic role — and `aria-label` on a generic element is unreliably announced across AT combinations, so copying the pattern verbatim would silently produce a greeting that some screen readers announce as nothing at all.

The greeting therefore uses the **`aria-hidden` animated layer + `sr-only` full-text sibling** pattern instead. This is the same construction Decision 3 already requires for the Mar.IA name, so the panel uses one consistent approach rather than two.

*Alternative considered:* giving the greeting `role="status"`. Rejected — a status region announces on *change*, and the greeting is present from open; it would also compete with the existing "Thinking…" status region already in the panel.

*Alternative considered:* extracting a shared `RevealText` component from `RevealHeading`. Rejected for this change — `RevealHeading` carries a hard-won fix (its ghost layer is deliberately not a DOM sibling, because nesting it broke native double-click word-selection in real-browser testing). Refactoring it to serve a second caller risks regressing that fix for a benefit this change does not need.

### Decision 5 — Idle bubble: `sessionStorage`, and a deliberate departure from `lib/session.ts`

Copy is **"Hi! I am Mar.IA"** (the screenshot's "Hello!" was a shape reference only). Cadence is random 1–5 minutes, repeating **indefinitely until the visitor opens the chat**.

State lives in `sessionStorage`, whose lifetime *is* "until the tab closes" — which matches the reset-on-next-visit requirement exactly, with no cookie and no expiry arithmetic.

**This is a conscious departure from an existing convention and is recorded as such.** `lib/session.ts` documents an in-memory-only rule ("never persisted (no localStorage/cookies)"), grounded in PRD §9's privacy constraint. A "bubble already seen" boolean is not personal data and is never transmitted, so it does not conflict with the *rationale* behind that rule — but it does depart from its letter, and that should read as a decision rather than as drift.

**Decision 4 of the enriched ticket struck one previously-drafted stop condition.** Because the trigger is `position: fixed`, it is never scrolled out of view, so a "stop the timer when the widget scrolls out of view" condition would have been inert. It is dropped. Three conditions survive, each for a reason unrelated to visibility:

| Condition | Rationale |
| --- | --- |
| Never steal keyboard focus | Auto-focusing a popup breaks keyboard/SR users mid-task (WCAG 2.4.3) |
| Clean up the timer on unmount | A leaked interval is a bug in any design |
| Pause while the document is hidden | A bubble firing into a backgrounded tab is a *wasted* prompt; pausing means it fires when the visitor actually returns |

## Risks / Trade-offs

**[Persona guardrail regresses silently while allowing self-identification]** → The one failure mode that unit tests cannot catch. Mitigation: treat the live eval run as a required gate, not a formality — every existing `trap` and `injection` case must still refuse, and new identity cases must pass, in the same run.

**[`bot-salute` is a >5s looping animation running in parallel with content]** → This is WCAG 2.2.2 territory. Mitigation: the reduced-motion guard inherited from the mockup is the accepted mitigation, recorded here as a conscious call rather than an oversight. The animation is also transform-only, so it stays on the compositor and within `performance-budget-compliance`.

**[Bot PNGs push First Load JS past the ~160 KB gzip threshold]** → Mitigated structurally by serving from `/public` rather than inlining; the artwork never enters the bundle. Verify by measurement, not assumption. WebP is the fallback lever if needed.

**[The design assets exist on exactly one branch]** → If `feature/chatbot-ui-restyle` were lost, the artwork is unrecoverable (Linear URLs expired). Mitigation: committing the optimised PNGs into `public/` as part of this change removes the single point of failure.

**[An icon-only trigger loses its accessible name in a future refactor]** → An icon-only button with no accessible name is a WCAG 4.1.2 failure and is easy to reintroduce. Mitigation: pin the accessible name in a test, not just in review.

**[The typing greeting is announced as a partial string]** → Mitigated by Decision 4's construction (full text rendered, opacity animated, `sr-only` sibling). The failure mode of the naive implementation is invisible in jsdom, so this needs real assistive-technology reasoning in review, not only a passing test.

## Migration Plan

No data migration, no API change, no dependency change. The change is additive to the widget and reversible by revert. The one non-reversible-by-revert element is the `/public` bot artwork, which should be committed early in implementation so later steps have it available.

Sequence: assets committed → styles/tokens → icon trigger → contrast fix → identity (content + prompt + evals) → idle bubble → typing greeting. The identity step is placed before the two motion steps deliberately, so the eval gate runs against a settled prompt rather than being re-run after every subsequent commit.

## Open Questions

1. **Is the arm animated at trigger size, or only in the panel?** `bot-arm-112.png` was optimised on the assumption it might be, but a 56px saluting arm may read as noise rather than charm. Resolve by eye during browser verification; defaulting to a static trigger bot is the safer starting point.
2. **Does the idle bubble need its own dismiss affordance, or is "ignore it and it disappears" sufficient?** AC7 requires it be dismissible per appearance; whether that is an explicit close control or an auto-hide timeout is a UI call best made against the rendered result.
3. **Should `content/faq.md` and `content/meta.md` adopt the Mar.IA name, or keep describing "the chat assistant" generically?** Both are indexed into the retrieval corpus, so naming it there changes what the bot retrieves about itself — which is either the point or an unnecessary corpus churn. Decide before the index rebuild, since it affects that step's output.
