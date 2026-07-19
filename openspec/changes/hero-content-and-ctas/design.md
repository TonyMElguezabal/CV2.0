## Context

`components/HeroFramer.tsx` (merged via JOS-53) renders `profile.name` and `profile.positioning` inside a `motion.div` whose children use Framer Motion's `initial`/`animate` props for an on-load entrance. Those `initial` values (`opacity: 0`, `y: 24`/`16`) are written into the server-rendered HTML as inline styles — Framer Motion only overrides them once React hydrates and its animation loop starts. `lib/content/read.ts`'s `getProfile()` already returns the full `Profile` type, including `contact.email`, `contact.scheduling`, and `links.linkedin`/`links.github` — none of these are consumed by any component yet. No page section exists below the hero's spacer div.

## Goals / Non-Goals

**Goals:**
- Render a primary "scroll" CTA and three secondary CTAs (Ask AI, Download résumé, Contact) inside the hero, sourced from real content/assets.
- Guarantee the hero's name, positioning, and CTA labels are visible and readable with JavaScript fully disabled (real browser test, not inference).
- Keep JOS-53's chosen entrance/scroll-exit animation intact for JS-enabled visitors.

**Non-Goals:**
- Redesigning or re-comparing the motion approach chosen in JOS-53.
- Building the chatbot behind "Ask AI", or any real scroll destination beyond the current single-section page (Story 2.3+ will add real sections).
- A résumé-generation pipeline — the PDF is a static asset provided directly by the user.

## Decisions

**1. No-JS visibility fix: `<noscript>` CSS override, not a structural rewrite.**
Add a stable class (`heroAnimatedTextClass`) to the two `motion` text elements, and render a `<noscript>` block in the hero containing a `<style>` tag that forces `.hero-animated-text { opacity: 1 !important; transform: none !important; }`. This is scoped, minimal, and testable: with JS disabled, the browser never executes Framer Motion, so the inline `opacity: 0` from SSR stands until the `<noscript>` stylesheet — which browsers only apply when script is disabled — overrides it. Verified by actually disabling JavaScript in Chrome (via `mcp__claude-in-chrome`, since it's confirmed connected in this environment) and confirming the text renders at full opacity.
*Alternative considered*: restructure so text renders unanimated and only a decorative wrapper animates. Rejected — it would change the actual visual entrance JOS-53 selected, which is out of scope here.

**2. CTA component: new `components/HeroCtas.tsx`, not folded into `HeroFramer.tsx`.**
Keeps `HeroFramer.tsx` focused on the animation prototype it already is, and lets the CTA row (a static, non-animated content list) be trivially SSR-safe on its own — it uses no Framer Motion `initial`/`animate` props at all, so it needs no `<noscript>` workaround. `HeroFramer` renders `<HeroCtas profile={profile} />` as a child.
*Alternative considered*: extend `HeroFramer.tsx` directly. Rejected — would mix an animated prototype component with plain static content, and forces the no-JS fix onto content that doesn't need it.

**3. Primary CTA target: the existing spacer div, given an explicit `id="hero-next"`.**
No Story 2.3+ content sections exist yet, so "scroll" can only mean "scroll to the next thing on the page today" — the spacer div HeroFramer already renders below the hero. The primary CTA becomes a real in-page anchor link (`<a href="#hero-next">`), not a fabricated destination. This is a known, documented stub: once Story 2.3+ adds real sections, the anchor target should move to the first real section and this decision revisited.

**4. Ask AI CTA: rendered as a `<button>` (not `<a>`), `disabled`, with a "Coming soon" label.**
Using a real `<button disabled>` communicates non-interactivity through native semantics (keyboard/screen-reader skip it, no `href` implying a broken link) rather than faking a clickable affordance. Label reads "Ask AI — coming soon" so it's honest about current capability, satisfying the AC's "secondary CTAs offer Ask AI" without pretending the chatbot exists.

**5. Download résumé CTA: real `<a href="/resume.pdf" download>` anchor.**
`public/resume.pdf` is served statically by Next.js's public-file convention — no route or API needed. The `download` attribute names the saved file explicitly (`resume.pdf`) rather than leaving it to the browser's URL-derived default.

**6. Contact CTA: `mailto:` link built from `profile.contact.email`.**
`contact.email` is the one contact field guaranteed to work with a plain anchor and no external dependency (a `scheduling` link would also be valid, but `email` is the more universal "Contact" action and avoids picking a third-party scheduling tool as the primary CTA without an explicit product decision to do so). `contact.scheduling` remains available in the `Profile` type for a later story to surface if wanted.

## Risks / Trade-offs

- [The `<noscript>` fix only covers the two text elements inside `HeroFramer.tsx`; any future motion-animated content added to the hero must repeat the same pattern or risk reintroducing the no-JS gap] → Mitigation: documented here and in a code comment on the `<noscript>` block itself, pointing back to this design doc.
- [The primary CTA's `#hero-next` anchor target is a known stub, not a real destination] → Mitigation: explicitly called out above as a decision to revisit once Story 2.3+ ships real sections; not silently left unexplained.
- [Disabling JavaScript via Chrome DevTools/settings inside the `claude-in-chrome` extension is a new verification pattern not used in prior stories] → Mitigation: if it proves unreliable in this environment, fall back to inspecting the rendered SSR HTML for the `<noscript>` block and computed-style reasoning, and document that fallback honestly (same pattern as JOS-53's original browser-verification gap) rather than silently skipping it.

## Migration Plan

Not applicable — additive UI change to a single existing component tree, no data migration, no deployed environment yet.

## Open Questions

None outstanding — all real content/scope questions (résumé source, Ask AI treatment, contact field, primary CTA target) were resolved with the user before this design was written.
