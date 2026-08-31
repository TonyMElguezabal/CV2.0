# JOS-121 — Chatbot UI restyle: design assets

Source artifacts for the chatbot restyle (Mar.IA). Captured from the Linear
ticket on 2026-08-31.

**These are the only remaining copies.** Linear serves attachments from
signed URLs with a 5-minute expiry; the originals on
[JOS-121](https://linear.app/josetony/issue/JOS-121/chatbot-ui-restyle) are
no longer retrievable. Do not delete this directory without confirming the
assets are reproduced elsewhere.

## Contents

### `reference/ask-about-jose.html`

The owner's mockup of the **open panel only** (189,962 bytes). It is the
authoritative source for two things:

- **`@keyframes bot-salute`** — 4.5s `ease-in-out infinite`, transform-only
  (`rotate` 0° → 115° → wave → rest). Compositor-friendly, so it satisfies
  `performance-budget-compliance`'s transform/opacity constraint.
- **`.bot-arm` pivot** — `transform-origin: 27.3% 54.1%` (the shoulder). The
  arm is a separate layer stacked over the body, which is why the bot ships
  as two images rather than one.

It already carries a `@media (prefers-reduced-motion: reduce)` guard that
sets `animation: none` — preserve this.

The mockup does **not** implement the icon trigger, the idle bubble, or the
letter-by-letter typing animation. Those exist only as screenshots.

Note the mockup is **green** (`#00703b`). That was superseded — the shipped
implementation uses the site's sapphire `--accent` (`#4d82bd`); see the
enriched ticket, Decision 1. Read the file for layout and animation, not
for colour.

### `screenshots/`

| File | Shows | Status |
| --- | --- | --- |
| `shot1-trigger-icon.png` | Proposed icon trigger — glossy green disc, flat robot face | Superseded: the trigger uses the same 3D robot as the panel, on a sapphire disc |
| `shot2-idle-bubble.png` | Idle speech bubble reading "Hello!" | Shape reference only — final copy is "Hi! I am Mar.IA" |
| `shot3-textarea.png` | Open panel with the 3D bot, greeting, starter questions | Layout reference; recolour to sapphire |

### `bot-source/`

The two PNGs extracted from the mockup's base64 data URIs, at their original
469×564. Keep these as the masters — re-derive other sizes from them rather
than upscaling the optimized copies.

### `bot-optimized/`

Downscaled for actual display size. The mockup inlines the source pair as
~181 KB of base64; serving these from `public/` instead keeps the artwork
out of the JS bundle entirely.

| File | Size | Intended use |
| --- | --- | --- |
| `bot-body-240.png` | 35.0 KB | Panel bot @2× (~120px displayed) |
| `bot-arm-240.png` | 5.2 KB | Panel bot arm, animated |
| `bot-body-112.png` | 11.9 KB | Trigger icon @2× (~56px displayed) |
| `bot-arm-112.png` | 1.9 KB | Trigger arm, if animated at trigger size |

Generated with `sips -Z <width>`. WebP would reduce these further if the
budget ever needs it.

## Before implementing

Read the `[enhanced]` section of
[JOS-121](https://linear.app/josetony/issue/JOS-121/chatbot-ui-restyle) —
it records five owner decisions (sapphire over green, one 3D robot, the
Mar.IA identity and its persona-guardrail scope, always-visible trigger,
idle-bubble cadence) plus the existing spec requirements this change
contradicts and must supersede via delta specs.
