## Why

The site's emotional journey (PRD §1) ends at "Action — book a meeting, reach out," but there is no contact section to land that action. Two of the three contact affordances the visitor needs — the cal.com scheduling link and the LinkedIn profile — exist in `content/profile.yaml` and are validated, yet render nowhere on the page. The only contact touchpoint today is a small "Contact" mailto button in the hero. This delivers the dedicated contact section (PRD §5 F7).

## What Changes

- Add a new `ContactSection` (server component) at the bottom of the page, after Projects, offering three low-friction affordances from validated profile data: **Book a meeting** (cal.com scheduling), **Email** (mailto), and **LinkedIn**.
- External links (scheduling, LinkedIn) open in a new tab with `rel="noopener noreferrer"`; the mailto is a normal link. The section carries `id="contact"` so it's a scroll target.
- Re-point the hero's existing "Contact" CTA to scroll to `#contact` instead of firing a mailto directly — the hero button now leads into the full contact section rather than jumping straight to email.
- Update `content/profile.yaml` with the real scheduling and LinkedIn URLs (the current values appear to be placeholders — owner supplies the real ones during implementation).
- Reconcile a pre-existing spec drift discovered while editing `hero-ctas`: its "Ask AI CTA is visibly present but non-functional (disabled)" requirement is stale — JOS-62 enabled that button to open the chat widget but never updated this spec. This change corrects that requirement text to match shipped reality (no code change — the code is already correct).
- **Out of scope**: contact-click analytics (PRD §F8) — depends on the unbuilt analytics epic (7.1→7.2) and is not required by this story's ACs; deferred, same as JOS-68's résumé-download tracking. No contact form (explicitly excluded by AC3 and PRD §5 F7).

## Capabilities

### New Capabilities
- `contact-options`: the dedicated contact section — scheduling, email, and LinkedIn affordances rendered from profile data, with no contact form.

### Modified Capabilities
- `hero-ctas`: the "Contact" secondary CTA changes from opening a mailto to scrolling to the new `#contact` section. (Also corrects the stale "Ask AI CTA is disabled" requirement to reflect its shipped enabled behavior.)

## Impact

- **New files**: `components/ContactSection.tsx`, `components/ContactSectionStyles.ts`, `components/ContactSection.ssr.test.tsx`.
- **Modified files**: `app/page.tsx` (render `ContactSection`), `components/HeroCtas.tsx` + `components/HeroCtas.test.tsx` (Contact CTA → `#contact` anchor; likely removes a now-unused `profile` prop, rippling to `components/HeroFramer.tsx` + its tests), `content/profile.yaml` (real scheduling + LinkedIn URLs).
- **No new dependencies, no new schema** — `ProfileContactSchema`/`ProfileLinksSchema` already validate all three fields at the content gate. No HTTP surface.
