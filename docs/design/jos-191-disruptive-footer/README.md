# JOS-191 — Disruptive footer: art reference and provenance

See `openspec/changes/disruptive-footer/design.md` for the full design
(Decisions 3–5 cover the surface, illustration, and art). This file is
the asset-provenance record Decisions 4–5 and task 8 point at.

## Reference and concept

- `reference.png` — the owner's own mockup: the composition (oversized
  headline, raised CTA, pointing character bottom-right) this footer
  copies, reskinned into the site's existing dark visual language rather
  than the mockup's literal colors/type.
- `concept-option-a.png` — an earlier pose/face reference for the Mar.IA
  illustration, originally scoped as an image-model input (see "Original
  plan" below). Superseded by the artifact in the next section; kept here
  for history, not referenced by the shipped component.
- The concept was originally attached to the JOS-191 Linear ticket.
  **Linear's attachment URLs are signed and expire** — the same gotcha
  noted in `AGENTS.md`/`CLAUDE.md` for `docs/design/jos-121-chatbot-ui/`.
  These files are the only surviving local copies; don't delete this
  directory without reproducing them elsewhere first.

## Art provenance — shipped, 2026-10-08

**The original image-model/raster-export plan (design.md Decisions 4–5,
original text) was superseded.** The owner supplied a vector-concept
Claude Artifact — `https://claude.ai/artifact/YPuqw12ANR5NKuaFbHckAe`,
titled "Mar.IA Pointing Hands" — and directed it to ship as the actual
production illustration, not as a reference for a further image-model
pass.

**What's actually new art, and what isn't:** the artifact's own
`bot-body.png` is byte-for-byte identical (SHA-256
`5bc1f3d377982cf9e0bc40bb14c286d6fc9ebe21cb41138772959f16e86b7aec`) to
the chat widget's existing
`docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png` — no new
raster render exists. That file was plain-copied (not re-exported) to
`public/maria-footer-body-469x564.png`. Everything else — the "come on"
visor face, the pointing hand, the resting fist, both limbs — is
hand-authored inline SVG (gradients, paths, a clip path trimming the
render's original baked-in arm stub), transcribed directly into
`components/FooterIllustration.tsx` from the artifact's markup. There is
no `bot-source/` folder for this art and none is needed — the vector
markup *is* the source, version-controlled as ordinary component code.

**Why this still reads as three independently-posed parts**, matching
the original plan's intent: a static body group (image + face + resting
hand), a static upper-arm limb, and a rotating forearm group (limb +
pointing hand) — composited as one SVG document instead of three stacked
PNGs. See design.md Decision 4 for the full reasoning, including why
there is no seam risk with this approach (nothing to seam — the rotating
part is vector, not a second raster layer).

## Elbow pivot

`components/SiteFooterStyles.ts`'s `FOOTER_ELBOW_TRANSFORM_ORIGIN` is
`"66px 420px"` — the artifact's own pivot, expressed directly in the
canvas's native pixel space (`viewBox="0 0 469 564"`), not a CSS
percentage. A percentage made sense for the original plan's scaled
`<img>` layers, which could in principle have shipped at a different
display size than their source canvas; the SVG approach has exactly one
coordinate space (its `viewBox`), so a pixel value is both simpler and
strictly lossless compared to converting it to a percentage and back.

## Wag motion

`FOOTER_WAG_ROTATE_KEYFRAMES = [0, -9, 7, -6, 3, 0, 0]` over
`FOOTER_WAG_DURATION_SECONDS = 2.4`s, wagging in the first ~55% of the
cycle then resting (`FOOTER_WAG_TIMES`) — mirrors the chat widget's
`BOT_SALUTE_*` constants in shape, tuned to a finger-wag rather than a
shoulder-wave. Unchanged by the Decision 4/5 revision — the artifact's
own CSS `@keyframes` matched these values exactly, confirming it was
built against this codebase's already-shipped constants rather than the
other way around.

## Original plan (2026-10-06), superseded above

Kept for history. Not what shipped.

1. Generate three images with an image model, using the chat widget's
   shipped body render for style and `concept-option-a.png` for pose:
   a full composite (reference only), the body with no raised arm, and
   the raised arm alone.
2. Place all three in `docs/design/jos-191-disruptive-footer/bot-source/`.
3. Check style match against the chat widget's render before cutting.
4. Normalize to a shared 469×564 canvas; split the arm at the elbow into
   `upper-arm`/`forearm` with ~6px of overlap under the joint.
5. Export `public/maria-pointing-{body,upper-arm,forearm}-240.{webp,png}`
   (≤30 KB combined for the three WebP layers).
