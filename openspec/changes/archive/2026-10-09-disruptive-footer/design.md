## Context

Today `components/SiteFooter.tsx` is one `<p>` of analytics small print, mounted once in `app/(marketing)/layout.tsx`, after `<MotionProvider>{children}</MotionProvider>` and inside `ChatWidgetProvider`. `cookieless-analytics-baseline` requires that disclosure to live in a footer, so it has to survive the redesign.

The `#contact` section (`ContactSection.tsx`) already offers scheduling, email, and LinkedIn. It is the anchor target of both the header nav and the contact pill, so it stays.

Constraints this design works within:

- **Bounded, contrast-measured palette** (`app/globals.css`, `components/palette.test.tsx`). Every text tint is measured against the real background it sits on.
- **Fixed chat trigger.** It sits at `bottom-6 right-6 z-40` (`ChatWidgetStyles.ts`) and floats over whatever ends the page.
- **Contact-click analytics are closed-set.** `CONTACT_TARGETS` in `lib/analytics/schema.ts` is a Zod enum. Any other target gets a `400` from `/api/events`.
- **Mar.IA art exists only as a two-layer 469×564 render** (`docs/design/jos-121-chatbot-ui/bot-source/`): a body plus a salute arm. It has fingerless mittens and a fixed smile.
- **Motion runs through framer-motion.** This codebase has no mechanism for raw CSS `@keyframes`. `ChatPanel.tsx` animates the salute arm with a framer-motion keyframe array (`BOT_SALUTE_*`) and `useReducedMotion()`.
- **Rate limiting is shared.** `lib/chat/rateLimit.ts` provides an Upstash-backed `checkRateLimit` that fails open, used by `/api/chat` and `/api/events`, both keyed `ip:${x-forwarded-for}`.

Reference material:
- `docs/design/jos-191-disruptive-footer/reference.png` (the owner's mockup)
- `concept-option-a.png` (the approved pose and face)
- the concept page linked from JOS-191

## Goals / Non-Goals

**Goals:**
- Turn the last scroll into a contact: one oversized CTA to cal.com plus every contact channel.
- Match the reference's composition and tone (pointing character, big headline, raised button) in the site's own dark visual language.
- Offer WhatsApp without publishing the phone number in any scrapable form.
- Keep everything that already holds: the analytics disclosure, no-JS rendering, reduced motion, AA contrast, the bundle budget, and one owner per element's entrance.

**Non-Goals:**
- Replacing or restyling the `#contact` section.
- Changing the chat widget's bot art. The new Mar.IA art is footer-only.
- Hiding the number from someone who actually follows the WhatsApp link. That is impossible by WhatsApp's design.
- Any new dependency: no icon library and no animation library beyond framer-motion.
- Indexing footer copy into the chatbot's retrieval corpus.

## Decisions

### 1. `SiteFooter` stays a server component; only the illustration is a client island

The footer's text, links, and disclosure are static and content-sourced, so they render on the server. That satisfies the no-JS requirement for free and adds no client JS for the bulk of the footer.

Only `FooterIllustration.tsx` is `"use client"`, because it needs `useReducedMotion()` and `m.img`.

Like `HeroLaptop`/`HeroFramer`, the island wraps itself in `<MotionProvider>`. The footer sits outside the layout's existing `MotionProvider` (which wraps only `{children}`), and nested `LazyMotion` providers are safe.

*Alternative considered:* make the whole footer a client component. Rejected, because it ships the copy and links as JS for no benefit and makes the SSR test weaker.

### 2. Props, not a content read inside the component

`app/(marketing)/layout.tsx` already calls `getProfile()`. It passes `footer`, `links`, and `contact` into `<SiteFooter>`, the same way it feeds `ChatWidget`. The component stays pure and is tested with fixtures.

The new `FooterSchema` (`headline`, `subline`, `ctaLabel`, `ctaSubLabel`, all required strings) joins `ProfileSchema`, so `npm run validate:content` gates it.

The WhatsApp href is the constant `/go/whatsapp` in the component, not a content field: it is a route of this app, not profile data.

### 3. Lifted dark surface — introduced, then scoped down to the CTA only (revised 2026-10-08)

**Original decision:** the owner asked for dark, "with slight contrast so the footer can shine," so the whole `<footer>` was painted with a new `--surface-raised: #16140f` token (1.08:1 against the page's `#0a0a0a`, a deliberately subtle lift), with a 1px `--accent` top rule and a soft radial glow for the "shine."

**Revised:** live review found the full-bleed raised backdrop fought the page's existing ambient background (`AmbientSparkleLayer`'s particles, the hero scene's `fixed inset-0` layers — all deliberately visible for the entire scroll, not just the hero) — it visually boxed the footer off as a separate flat panel instead of letting that ambient treatment continue underneath it. `siteFooterClass` no longer sets `bg-surface-raised`; the footer is transparent and the page's existing fixed background layers show through, same as every other section. The `--accent` top rule and the glow stay (they don't depend on an opaque backdrop).

**`--surface-raised` itself stays** — it's still the CTA button's own fill (`footerCtaClass`'s `bg-surface-raised`), giving the button a slightly raised, boxed look against the now-transparent footer, consistent with its "press" interaction. The token and its `palette.test.tsx` contrast measurements (table below) are unchanged and still exercised by the CTA.

Measured on `#16140f` (still applies — CTA surface only):

| Token | Contrast | Threshold |
|---|---|---|
| `--ink` | 14.93 | 4.5 (text) |
| `--ink-body` | 8.75 | 4.5 (text) |
| `--ink-meta` | 4.86 | 4.5 (text) |
| `--accent` | 4.60 | 4.5 (text) |
| `--hair` | 3.22 | 3 (borders) |

`#1a1814` was also measured and rejected: `--accent` drops to 4.43 there and `--hair` to 3.10, with no headroom.

**The footer's own text (headline/subline/disclosure) now sits on `--background` (`#0a0a0a`) directly** — no new contrast risk: `--ink`/`--ink-body`/`--ink-meta`/`--accent` were originally measured against this exact background (`app/globals.css`'s own comment: "Every value was measured... against this page's real #0a0a0a background"), and `palette.test.tsx` already asserts `--ink-body`/`--ink-meta` meet 4.5:1 "against the page background" independent of this change — this is the site's proven default pairing, not a new one.

**CTA styling:** an `--ink` border, `--ink` text, and a hard offset shadow in `--accent`. On `:active`, the shadow collapses and the button translates down by the shadow offset, which is the reference's "press".

### 4. Illustration: inline SVG vector overlay on the existing body render, framer-motion rotate on the forearm group only

**Supersedes the original plan below** (image-model-generated three-layer
raster art). Revised 2026-10-08: the owner supplied a vector concept
built as a Claude Artifact
(`https://claude.ai/artifact/YPuqw12ANR5NKuaFbHckAe`, "Mar.IA Pointing
Hands") and asked for it to ship as the actual production art, not as a
reference for an image-model pass. See
`docs/design/jos-191-disruptive-footer/README.md` for full provenance.

**What changed and why this is still three independently-posed parts:**
the artifact's `bot-body.png` is byte-identical (same SHA-256) to the
chat widget's existing `docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png`
— no new raster art was generated at all. The hands, the "come on" face,
and the limbs connecting them are hand-drawn inline SVG shapes (gradients,
paths, a radial-gradient visor) layered over that one existing PNG via an
SVG `<image>` + `clipPath` (the clip path trims away the original render's
baked-in arm stub so the vector hand replaces it cleanly). This keeps the
same three-part structure the original plan called for — a static body
(with the new face and resting hand drawn on top), a static upper-arm
limb, and a rotating forearm-plus-pointing-hand group — just composited
as one SVG document instead of three stacked PNGs.

**Why a rotating group, not a whole-arm rotation:** unchanged reasoning
from the original decision — the finger wag pivots at the elbow; rotating
a whole arm at the shoulder reads as waving, not wagging.

**Motion values — unchanged, reused exactly:**
- keyframes `[0, -9, 7, -6, 3, 0, 0]` degrees, with `times` placing the
  wag in the first ~55% of a 2.4s cycle and resting for the remainder
- constants stay in `SiteFooterStyles.ts` (`FOOTER_WAG_*`); the artifact's
  own CSS `@keyframes` matched them exactly, confirming the artifact was
  built against this codebase's already-shipped values
- `FOOTER_ELBOW_TRANSFORM_ORIGIN` is now an SVG `transform-origin` in the
  canvas's own pixel coordinate space (`"66px 420px"` on the `0 0 469 564`
  viewBox) rather than a CSS percentage on a scaled `<img>` — the artifact
  specifies the pivot this way and it only has one meaningful coordinate
  space now, so a percentage conversion would be strictly lossier for no
  benefit

**Reduced motion:** unchanged — `useReducedMotion()` true → no `animate`
prop on the forearm group, which renders at rest.

**No seam risk:** the original plan's ~6px elbow overlap existed to hide
any gap between two separately-rotating raster layers. That failure mode
doesn't exist here — the forearm limb and hand are vector shapes drawn
relative to the rotating group's own origin, so there is nothing to seam.

**Assets:** one existing PNG, already in the repo (see Decision 5), plus
inline SVG markup (gradients, paths) that ships as ordinary JSX — no new
binary asset, no WebP export, no size budget concern (the original 30 KB
raster budget doesn't apply to markup).

### 5. Art production: reuse the existing body render; no image model, no export pipeline

**Supersedes the original plan below.** The image-model generation step,
the elbow-split-with-overlap cut, and the WebP/PNG export pipeline are
all unneeded: `docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png`
is copied into `public/maria-footer-body-469x564.png` unmodified (a plain
file copy, confirmed identical by SHA-256 — not a re-export), and every
other visual element (hands, face, limbs) is inline SVG, authored
directly in `FooterIllustration.tsx`, not a separate asset file at all.
`ffmpeg`/`img2webp`, mentioned in the original plan below, are not used.

<details>
<summary>Original plan (2026-10-06), superseded above</summary>

The owner generates three images with an image model, using the shipped body render (style) and `concept-option-a.png` (pose) as inputs:
1. a full composite, used as a reference only
2. the body with no raised arm
3. the raised arm alone

The arm image is split at the elbow into `upper-arm` and `forearm`, with ~6px of overlap under a rounded elbow joint, so the ±9° rotation never opens a seam.

Masters go in `docs/design/jos-191-disruptive-footer/bot-source/`. Web exports (240px wide @2×, WebP plus PNG fallback) go in `public/maria-pointing-*`. The 30 KB budget is for the three layers combined.

`ffmpeg`/`img2webp` are already available locally; no new tooling is needed.

</details>

### 6. Icons: inline SVG paths, no library

There are five icons: LinkedIn, GitHub, WhatsApp, calendar for cal.com, and envelope for email. Each is a single-path 24×24 SVG with `fill="currentColor"` and `aria-hidden="true"`, in one small `components/SocialIcons.tsx`. The accessible name sits on the `<a>` via `aria-label`.

An icon library would add a dependency to draw five glyphs, against the ladder.

### 7. WhatsApp: `/go/whatsapp` route handler, number in a server secret

The handler is `app/go/whatsapp/route.ts`, exporting `GET`. It sits outside `(marketing)` because it is a route handler, not a page. `export const dynamic = "force-dynamic"` guarantees it is never statically rendered at build time, when the secret may be absent.

Flow:
1. Read `process.env.WHATSAPP_NUMBER`, the same runtime-secret mechanism as `OPENAI_API_KEY` in `/api/chat`.
2. Validate it against `/^\d{8,15}$/`. If it fails, return `503` with no `Location` header.
3. Rate limit via `checkRateLimit(createUpstashRateLimitStore(), \`go-whatsapp:ip:${ip}\`, 10, 3600)`. If over the limit, return `429`.
4. Otherwise return `302` to `https://wa.me/${number}` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.
5. Log nothing about the number or the target.

The key gets its own `go-whatsapp:` prefix because `/api/chat` and `/api/events` both key on bare `ip:${ip}`, and this limiter must not share or reset their counters.

The rate limit is enforced before reading or validating the secret, so a missing secret doesn't let a client probe without limits.

`app/robots.ts` changes `disallow` from `"/admin"` to `["/admin", "/go/"]`. The footer link adds `nofollow`.

*Alternatives considered:*
- **WhatsApp Business short link:** zero code, but it requires a Business account. The owner chose the redirect.
- **Plain `wa.me/<number>` in the HTML:** it leaks the number to every HTML scraper.

### 8. Two new contact targets, one shared source of truth

`CONTACT_TARGETS` becomes `["scheduling", "email", "linkedin", "github", "whatsapp"]`. `ConversionsSection.tsx`'s `CONTACT_TARGET_LABELS` is retyped as `Record<ContactTarget, string>` (from `Record<string, string>`), so a future target without a label fails `tsc` instead of rendering a raw key.

**The database also enforces the closed set, and that constraint is already live.** `lib/analytics/schema.sql` declares `analytics_event.contact_target` with `CHECK (... IN ('scheduling', 'email', 'linkedin'))`. The file is applied once to the existing Neon database and is not a migrations framework, so `CREATE TABLE IF NOT EXISTS` never rewrites that constraint. Without a change, a `github` or `whatsapp` click passes Zod, then fails the insert. The tracker is fire-and-forget, so the failure is silent and the click is lost.

The fix is an explicit, owner-run migration file, `lib/analytics/migrations/2026-10-disruptive-footer-contact-targets.sql`. It drops the auto-named constraint `analytics_event_contact_target_check` and adds it back with all five targets, in one transaction. `schema.sql` is updated to match so a fresh database is correct. The migration is **not** run by the agent against any database. The owner applies it, and the deploy notes say so.

The footer reuses `AnalyticsTracker`'s existing delegated `data-analytics-event`/`data-analytics-target` attribute pattern. No new tracking code is needed.

### 9. Entrance motion: `SectionReveal` on the text block only

The footer's text block uses the existing `SectionReveal`, a one-shot fade and rise. The illustration's entrance is *not* also revealed, because its only motion is the wag. That keeps "one owner per element's entrance" (`site-arrival-sequence`) trivially true.

The headline is not a `RevealHeading`. Its per-character blur-up is scoped to short section headings, and this headline is a full sentence.

### 10. Chat-trigger clearance

The trigger is about 56px tall at `bottom-6` (24px). The footer gets `pb-28` (112px) of bottom padding at every breakpoint, so its last interactive row ends above the trigger's top edge. The disclosure line, which is not interactive, is allowed to sit in that zone.

This is verified live at 360, 768, and 1440px by comparing bounding boxes, not inferred from CSS.

## Risks / Trade-offs

- **The art does not arrive, or does not match the body's 3D style** → The footer ships behind the art. Tasks split the code work, which can be tested with the existing chat-bot layers as stand-ins, from the art task, which gates completion. A style mismatch is judged against the shipped body side by side before export.
- **The elbow seam shows during rotation** → A rounded elbow joint on the forearm layer plus ~6px of overlap. Checked live at both extremes of the wag (−9° and +7°).
- **The glow pushes a text tint below AA** → The glow is placed behind the illustration column only, never under the text column, and `palette.test.tsx` measures the tints on the raised surface. Live contrast is spot-checked in the browser task.
- **The secret is missing in production** → The route returns `503` rather than a broken link, and the deploy notes name the secret. The icon still renders. A visitor who taps it gets a plain error rather than a half-formed WhatsApp URL. That is acceptable, and the deploy checklist covers it.
- **Rate limiting fails open during an Upstash outage** → Accepted. The redirect leaks nothing a single human click wouldn't, and the chat and events routes already take the same stance.
- **`x-forwarded-for` can be spoofed to dodge the limit** → The same accepted trade-off as the existing limiters. The limit is a deterrent against harvesting, not a security boundary.
- **Footer CTA clicks are indistinguishable from `#contact` clicks in analytics** (both are `scheduling`) → Accepted for now. Splitting by source would need a new event field and a schema migration. Revisit if the owner wants to know which surface converts.
