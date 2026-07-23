## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create feature branch `joseelguezabal/jos-69-62-contact-options` (Linear-provided branch name for JOS-69) from `main`
- [x] 0.2 Verify branch creation and current branch status

<!--
Note on adapted mandatory steps: as with prior frontend changes on this repo,
there is no database or HTTP endpoint, so curl/database-state steps from
docs/openspec-tasks-mandatory-steps.md don't apply. This is a content +
frontend component change. Applicable mandatory gates: TDD unit/SSR tests,
`npx vitest run`, `npx tsc --noEmit`, `npm run validate:content` (a
content file changes), `npm run lint` (currently broken repo-wide, same
skip as prior changes), and in-browser manual verification via
claude-in-chrome, all agent-executed.
-->

## 1. `ContactSection` component (TDD)

- [x] 1.1 Write a failing SSR test in `components/ContactSection.ssr.test.tsx` (pattern from `components/ProjectsSection.ssr.test.tsx`, `renderToStaticMarkup`, no jsdom) with a fixture `Pick<Profile, "contact" | "links">`: (AC1) the rendered HTML contains a scheduling link with the fixture's `contact.scheduling` href, a mailto link built from `contact.email`, and a LinkedIn link with `links.linkedin` href; (AC2) the scheduling link's markup includes `target="_blank"` and `rel="noopener noreferrer"`; (AC3) the rendered section contains no `<form>` element; and the wrapping element has `id="contact"`
- [x] 1.2 Implement `components/ContactSectionStyles.ts` (Tailwind class constants mirroring `ProjectsSectionStyles.ts` — section wrapper `mx-auto max-w-3xl px-6 py-24`, an `h2` heading class, a links row/list class, a link class with a visible focus treatment consistent with the rest of the site)
- [x] 1.3 Implement `components/ContactSection.tsx` — a plain server component (no `"use client"`), props `Pick<Profile, "contact" | "links">`, wrapping `<section id="contact">` with an `<h2>` and three descriptive links: "Book a meeting" (`contact.scheduling`, `target="_blank" rel="noopener noreferrer"`), "Email Jose" (`mailto:${contact.email}`), "LinkedIn" (`links.linkedin`, `target="_blank" rel="noopener noreferrer"`)
- [x] 1.4 Run `npx vitest run components/ContactSection.ssr.test.tsx` and confirm all cases pass

## 2. Render the section into the page

- [x] 2.1 In `app/page.tsx`, render `<ContactSection contact={profile.contact} links={profile.links} />` after `<ProjectsSection />` (the `getProfile()` call is already present)
- [x] 2.2 Confirm `npx tsc --noEmit` is clean after wiring

## 3. Re-point the hero "Contact" CTA to `#contact` and clean up the now-dead prop (TDD)

- [x] 3.1 Update `components/HeroCtas.test.tsx`: change the Contact-link assertion from `mailto:${email}` to `href="#contact"`; remove the tests that assert the mailto is built from `profile.contact.email` (and the "different profile prop" test) since `HeroCtas` no longer takes `profile`
- [x] 3.2 Update `components/HeroCtas.tsx`: the "Contact" CTA becomes `<a href="#contact" className={ctaSecondaryClass}>Contact</a>` (matching the existing primary CTA's `href="#hero-next"` anchor pattern); remove the now-unused `profile` prop and its `HeroCtasProps`/`Profile` import
- [x] 3.3 Update `components/HeroFramer.tsx`: `HeroFramer`'s `profile` prop existed only to forward to `HeroCtas` — remove it from `HeroProps`, the destructure, and the `<HeroCtas />` call; update `components/HeroFramer.test.tsx` to stop constructing/passing `profile`
- [x] 3.4 Update `app/page.tsx`: stop passing `profile={profile}` to `<HeroFramer>` (keep `name`/`positioning`); `getProfile()` and the `profile` object stay (used by `HeroFramer` name/positioning and the new `ContactSection`)
- [x] 3.5 Run `npx vitest run components/HeroCtas.test.tsx components/HeroFramer.test.tsx` and confirm all cases pass

## 4. Real destination URLs (owner input required — do not invent)

- [x] 4.1 **PAUSE and ask the owner** for the real `contact.scheduling` (cal.com or equivalent) and `links.linkedin` URLs — the current `content/profile.yaml` values (`https://cal.com/josemunoz`, `https://www.linkedin.com/in/josemunoz`) appear to be placeholders. Do not guess or fabricate URLs
- [x] 4.2 Update `content/profile.yaml` with the real scheduling and LinkedIn URLs provided by the owner (also confirm `contact.email` and `links.github` are correct while there)
- [x] 4.3 Run `npm run validate:content` and confirm the content gate still passes

## 5. Full verification (agent executes all of this itself)

- [x] 5.1 Run `npx vitest run` (full suite) and confirm no regressions
- [x] 5.2 Run `npx tsc --noEmit` clean
- [x] 5.3 Run `npm run validate:content` clean
- [x] 5.4 Run `npm run lint` — expect the same pre-existing repo-wide failure noted in prior changes (missing `eslint.config.mjs`); skip with the same rationale unless it has since been fixed
- [x] 5.5 Start the dev server and via claude-in-chrome: confirm the contact section renders at the bottom with all three links; confirm the hero "Contact" CTA scrolls to the `#contact` section; confirm the scheduling and LinkedIn links point at the real URLs and open in a new tab (check the anchor `target`/`href`, do not necessarily complete external navigation)
- [x] 5.6 Stop the dev server; confirm no stray processes left running

## 6. OpenSpec sync

- [ ] 6.1 After merge, sync `specs/contact-options/spec.md` (new capability) and the `hero-ctas` delta (REMOVED + ADDED requirements) into `openspec/specs/` and archive this change (per CLAUDE.md §10 / `opsx:archive`)
