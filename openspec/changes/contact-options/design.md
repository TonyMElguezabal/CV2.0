## Context

The page (`app/page.tsx`) is Hero → CareerTimeline → CareerChapters → SkillsSection → ProjectsSection. There is no contact section and no footer. All three contact data points exist and are Zod-validated in `content/profile.yaml`:
- `contact.email` (`ProfileContactSchema`) — rendered only as the hero's "Contact" mailto CTA.
- `contact.scheduling` (`ProfileContactSchema`) — a cal.com URL, rendered nowhere on the page (only used inside the ChatWidget's outage fallback).
- `links.linkedin` (`ProfileLinksSchema`) — rendered nowhere on the site at all.

Section components in this repo follow a fixed convention (`ProjectsSection`): a plain server component (no `"use client"`), a companion `*Styles.ts` of Tailwind class constants, and a `*.ssr.test.tsx` using `renderToStaticMarkup`. `HeroCtas`/`HeroFramer` currently thread a `profile: Pick<Profile, "contact">` prop from `page.tsx` down to the hero's "Contact" mailto.

Two of the URLs in `profile.yaml` (`cal.com/josemunoz`, `linkedin.com/in/josemunoz`) look like placeholders — the email is `jose.elguezabal@gmail.com`, a surname mismatch with the slugs.

## Goals / Non-Goals

**Goals:**
- A dedicated contact section rendering all three affordances (schedule, email, LinkedIn) from validated profile data, landing the PRD §1 "Action" endpoint.
- Make the hero's "Contact" CTA lead into that section rather than jumping straight to email.
- Ship with real, working destination URLs — a "Book a meeting" link that 404s is worse than no link for a conversion feature.

**Non-Goals:**
- Contact-click analytics (PRD §F8) — deferred, depends on the unbuilt 7.x analytics epic; not required by JOS-69's ACs.
- A contact form — explicitly excluded (AC3, PRD §5 F7).
- Any change to the résumé or Ask AI CTAs' behavior (only the hero-ctas *spec* text for Ask AI is corrected — see Decision 4).

## Decisions

### 1. `ContactSection` is a plain server component, like `ProjectsSection`
It renders static links from profile data — no state, no interactivity — so it needs no `"use client"` and its primary test is an SSR test (`renderToStaticMarkup`), matching the repo convention exactly. Props: `Pick<Profile, "contact" | "links">`, fed from the `getProfile()` call already present in `page.tsx`. Rendered last, after `ProjectsSection`, with a wrapping `<section id="contact">` so it's a scroll anchor.
- *Alternative considered:* a footer instead of a section. Rejected — AC1 says "contact section," and the PRD journey ends on a deliberate Action beat; a full section is the right weight, not a footer afterthought.

### 2. External links open in a new tab with `rel="noopener noreferrer"`; mailto does not
`scheduling` and `linkedin` leave the site, so they get `target="_blank" rel="noopener noreferrer"` (prevents `window.opener` hijacking and referrer leak, PRD §9 security). `mailto:` hands off to the mail client — no `target`/`rel` needed. Link text is descriptive ("Book a meeting", "Email Jose", "LinkedIn"), never a bare URL, for accessibility and scannability.

### 3. Re-pointing the hero "Contact" CTA cascades into a clean prop removal
The hero "Contact" CTA becomes `<a href="#contact">` (mirroring the existing primary CTA's `href="#hero-next"` pattern), no longer a mailto. This makes `HeroCtas`'s `profile` prop dead: after the change, `HeroCtas` uses `useChatWidget()` (Ask AI), a static `/resume.pdf` (résumé), and now an in-page anchor (Contact) — nothing reads `profile`. The cleanup cascade, done test-first:
- `HeroCtas.tsx` — drop the `profile` prop; `HeroCtas.test.tsx` — the Contact assertion changes from `mailto:{email}` to `href="#contact"`, and the profile-plumbing tests drop.
- `HeroFramer.tsx` — its `profile` prop exists *only* to forward to `HeroCtas` (line 81); it becomes unused too, so drop it from `HeroProps` and the call site; update `HeroFramer.test.tsx`.
- `app/page.tsx` — stop passing `profile={profile}` to `HeroFramer` (still passes `name`/`positioning`); `getProfile()` stays (needed for `HeroFramer`'s name/positioning and the new `ContactSection`).
- *Alternative considered:* keep the now-unused `profile` prop to minimize churn. Rejected — the owner explicitly asked not to leave a dead prop, and the cascade is small and bounded.

### 4. Reconcile the stale `hero-ctas` "Ask AI" requirement in the same delta
While editing `openspec/specs/hero-ctas/spec.md` for the Contact change, its "Ask AI CTA is visibly present but non-functional (disabled)" requirement is stale — JOS-62 (chat widget) enabled that button to open the chat, but the delta at the time only touched `chat-widget-entry-point`, leaving this spec describing behavior that no longer ships. Since a spec must reflect reality (CLAUDE.md §7) and this file is already being modified, the same MODIFIED delta corrects the Ask AI requirement to describe its enabled, chat-opening behavior. **No code change** — the code is already correct; only the spec catches up. Flagged explicitly here so it's a conscious reconciliation, not silent scope creep.

### 5. Real URLs are collected mid-implementation, never invented
The placeholder-looking URLs are a content correctness risk the owner must resolve. `tasks.md` includes a step that **pauses** to collect the real `contact.scheduling` and `links.linkedin` values, updates `content/profile.yaml`, and re-runs `npm run validate:content`. The agent does not guess URLs.

## Risks / Trade-offs

- **[Risk]** Shipping with placeholder URLs would make the whole feature actively harmful (a "Book a meeting" button that 404s). → **Mitigation:** Decision 5 — a hard pause to collect real URLs before the story is done; the content-validation gate confirms the file still parses.
- **[Risk]** The prop-removal cascade could break `HeroFramer`/`page.tsx` rendering if missed. → **Mitigation:** done test-first; `HeroFramer.ssr`/`HeroCtas` tests plus a full `tsc --noEmit` catch any dangling reference.
- **[Trade-off]** Correcting the Ask AI spec requirement slightly widens this change beyond the literal JOS-69 ACs. Accepted — it's spec-only, the code already conforms, and leaving a knowingly-false requirement in a file I'm editing violates the source-of-truth principle.

## Migration Plan

No data migration, no dependencies. Implement per `tasks.md` → collect + apply real URLs → `npm run validate:content`, `npm test`, `tsc --noEmit` clean → manual check in the dev server (section renders, all three links resolve, hero Contact scrolls to `#contact`) → merge. Rollback is a plain revert.

## Open Questions

- None blocking. The real scheduling/LinkedIn URLs are collected during implementation (Decision 5), not pre-resolved here.
