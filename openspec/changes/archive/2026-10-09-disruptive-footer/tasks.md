## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create `feature/disruptive-footer` from `main`, pulling first. The working tree currently sits on `joseelguezabal/jos-123-change-cv`, so switch before touching code.
- [x] 0.2 Verify with `git branch --show-current`.
- [x] 0.3 Baseline recorded: `npm test` = 648 passed, 1 failed (pre-existing: `ChatWidget.test.tsx` "returns focus to the trigger after the panel closes", fails deterministically on `main` ce9b83a, unrelated to this change); `npx tsc --noEmit` clean.

## 1. Content contract: `footer` block (design.md Decision 2)

- [x] 1.1 Write failing tests in `lib/content/` that check two things:
  - a profile without `footer`, or missing any of `headline`/`subline`/`ctaLabel`/`ctaSubLabel`, fails `ProfileSchema` with an error naming the field
  - a complete block passes
- [x] 1.2 Add `FooterSchema` and wire it into `ProfileSchema` in `lib/content/schemas.ts`. Update `lib/content/test-fixtures.ts` and every inline profile fixture that `tsc` flags.
- [x] 1.3 Add the `footer` block to `content/profile.yaml` with the approved copy (JOS-191 Decision 6):
  - `headline`: "Hey, you're at the bottom of my interactive CV page."
  - `subline`: "Just click the contact button if you're interested. There's nothing to lose!"
  - `ctaLabel`: "Come on, click on this"
  - `ctaSubLabel`: "Don't make me beg"
- [x] 1.4 Run `npx vitest run lib/content/` and `npm run validate:content`; both must be clean.

## 2. Analytics: two new contact targets (design.md Decision 8)

- [x] 2.1 Write failing tests:
  - `EventPayloadSchema` accepts `contact_click` with `contactTarget` `github` and `whatsapp`, and still rejects an unknown target
  - `ConversionsSection` renders "GitHub" and "WhatsApp" labels, never raw keys
- [x] 2.2 Extend `CONTACT_TARGETS` in `lib/analytics/schema.ts`. Retype `CONTACT_TARGET_LABELS` in `components/admin/ConversionsSection.tsx` as `Record<ContactTarget, string>` and add both labels.
- [x] 2.3 Check `lib/analytics/reports.ts`, its tests, and the admin fixtures for any hardcoded three-target assumption, and update them.
- [x] 2.4 Run `npx vitest run lib/analytics/ components/admin/` and `npx tsc --noEmit`; both must be clean.
- [x] 2.5 Write failing tests that `lib/analytics/schema.sql` declares the `contact_target` CHECK with all five targets, and that the new migration file drops and re-adds the constraint with the same five targets inside one transaction (a SQL-text test, no database needed).
- [x] 2.6 Update `lib/analytics/schema.sql` so the `contact_target` CHECK lists all five targets. Add `lib/analytics/migrations/2026-10-disruptive-footer-contact-targets.sql`, which drops `analytics_event_contact_target_check` and re-adds it with the five targets inside `BEGIN`/`COMMIT`. Its header states that the owner applies it, and the agent never runs it.
- [x] 2.7 Replace the hardcoded three-target list in `lib/analytics/reports.ts` (`CONTACT_TARGETS`, used at lines ~201 and ~418) with the shared `CONTACT_TARGETS` from `schema.ts`, and widen the `track.ts` `contactTarget` union to the shared `ContactTarget` type.

## 3. WhatsApp redirect route (design.md Decision 7, spec `whatsapp-contact-redirect`)

- [x] 3.1 Write failing tests in `app/go/whatsapp/route.test.ts`, with the rate-limit store injected or mocked:
  - **valid secret:** `302` to `https://wa.me/<digits>`, with `Cache-Control: no-store` and an `X-Robots-Tag` containing `noindex`
  - **unset, empty, `+52 55…`, or too short:** `503` with no `Location`
  - **over the limit:** `429` with no `Location`
  - **store throws:** fails open and redirects
  - **rate-limit key:** starts with `go-whatsapp:`
  - **no logging:** `console.*` is never called with the number
- [x] 3.2 Implement `app/go/whatsapp/route.ts` (`GET`, `dynamic = "force-dynamic"`). Rate limit first, then read and validate `WHATSAPP_NUMBER` against `/^\d{8,15}$/`, then redirect.
- [x] 3.3 Write a failing test in `app/robots.test.ts` that `/go/` is disallowed alongside `/admin`. Then update `app/robots.ts`. Confirm `app/sitemap.ts` lists no `/go/` route.
- [x] 3.4 Document `WHATSAPP_NUMBER` in `README.md`, next to the other server-only secrets (~line 299). Do **not** create `.env.example`: the repo's `.gitignore` ignores `.env*`, so such a file would never be committed. Never commit a real number.
- [x] 3.5 Run `npx vitest run app/`; it must be clean.

## 4. Palette: `--surface-raised` (design.md Decision 3)

- [x] 4.1 Write failing tests in `components/palette.test.tsx`:
  - `--ink`, `--ink-body`, `--ink-meta`, and `--accent` each reach ≥ 4.5:1 on `--surface-raised`
  - `--hair` reaches ≥ 3:1
  - `--surface-raised` is defined in `globals.css`
- [x] 4.2 Add `--surface-raised: #16140f` to the `:root` block and the matching `--color-surface-raised` to the Tailwind theme block in `app/globals.css`. Add a comment carrying the measured ratios, in the same style as the existing tokens.
- [x] 4.3 Run `npx vitest run components/palette.test.tsx`; it must be clean.

## 5. Icons (design.md Decision 6)

- [x] 5.1 Create `components/SocialIcons.tsx` with five 24×24 single-path inline SVG icons: LinkedIn, GitHub, WhatsApp, calendar, envelope. Each has `fill="currentColor"` and `aria-hidden="true"`. Use simple-icons-style paths, with no package installed.
- [x] 5.2 Write an SSR test that each icon renders an `<svg>` with `aria-hidden="true"` and no `<title>`. The accessible name belongs on the link, not the icon.

## 6. Footer markup and behaviour (spec `site-footer`)

- [x] 6.1 Rewrite the failing SSR tests in `components/SiteFooter.ssr.test.tsx`:
  - **order:** a `<footer>` containing the headline `h2`, subline, CTA, icon row, and disclosure, in that order
  - **disclosure:** the existing disclosure assertions are kept unchanged
  - **CTA:** one `<a>` with `href` = scheduling, `target="_blank"`, `rel` ⊇ `noopener noreferrer`, both labels, and the `contact_click`/`scheduling` data attributes
  - **icon links:** each of the five has an `aria-label`, the right `href`, and the right `data-analytics-target`
  - **WhatsApp link:** `href="/go/whatsapp"`, `rel` contains `nofollow`, and no `wa.me` anywhere in the markup
  - **no GitHub:** with no `links.github`, the GitHub link is absent and no link has an empty `href`
- [x] 6.2 Implement `components/SiteFooter.tsx` as a server component taking `footer`, `links`, and `contact` props. Put all classes in `SiteFooterStyles.ts`:
  - the raised surface and the `--accent` top rule
  - the radial glow, kept behind the illustration column only
  - the raised CTA, whose offset shadow collapses on `:active`
  - `pb-28` chat-trigger clearance
  - wrap the text block in `SectionReveal` (design.md Decision 9)
- [x] 6.3 In `app/(marketing)/layout.tsx`, pass `footer`, `links`, and `contact` from the existing `getProfile()` call into `<SiteFooter>`.
- [x] 6.4 Run `npx vitest run components/SiteFooter components/accessibilityStructure components/focusVisibility`. Confirm the heading order is still valid and the footer has visible focus rings.
- [x] 6.5 **Revised 2026-10-08** (design.md Decision 3): remove `bg-surface-raised` from `siteFooterClass` so the page's existing ambient background (`AmbientSparkleLayer`, the hero scene's fixed layers) shows through the footer instead of being boxed off by a flat panel. Keep the `--accent` top rule and the glow. `--surface-raised` stays, now exercised only by `footerCtaClass`'s own fill. No new contrast risk: the footer's text was already validated against `--background` by `palette.test.tsx`'s pre-existing "against the page background" assertions.

## 7. Illustration component (design.md Decision 4, built against stand-in layers) — SUPERSEDED, see Task Group 8

The final art may not exist yet. Build and test against the shipped chat-bot body and arm as stand-ins; Task Group 8 swaps in the real layers.

- [x] 7.1 Write failing tests in `components/FooterIllustration.test.tsx` (jsdom):
  - the container is `aria-hidden="true"` and every `<img>` has `alt=""`
  - every `<img>` has explicit `width`/`height`, `loading="lazy"`, and a `src` under `/`, never `data:`
  - there are exactly three layers
  - with motion allowed, only the forearm layer animates, and its `transform-origin` equals the elbow pivot constant
  - with `useReducedMotion()` mocked true, nothing animates
- [x] 7.2 Add the `FOOTER_WAG_ROTATE_KEYFRAMES`, `FOOTER_WAG_TIMES`, `FOOTER_WAG_DURATION_SECONDS`, and `FOOTER_ELBOW_TRANSFORM_ORIGIN` constants to `SiteFooterStyles.ts`. The keyframes are `[0, -9, 7, -6, 3, 0, 0]` over 2.4s, wagging in the first ~55% of the cycle.
- [x] 7.3 Implement `components/FooterIllustration.tsx` as `"use client"`, wrapped in `<MotionProvider>`, with three stacked `<img>` layers and the forearm as `m.img`. Mount it in `SiteFooter`.
- [x] 7.4 Add an SSR test that the illustration's three `<img>` are present in `renderToStaticMarkup` output (the no-JS requirement).

*(Task Group 7's three-stacked-`<img>` structure was replaced by Task Group 8's inline-SVG rewrite below — these boxes stay checked as a record that the stand-in build-and-test step happened and worked, not as a claim that this exact `<img>`-based structure still exists in the component.)*

## 8. Final Mar.IA artwork (design.md Decisions 4–5, revised 2026-10-08)

**Revised scope.** The owner supplied a vector-concept Claude Artifact
(`https://claude.ai/artifact/YPuqw12ANR5NKuaFbHckAe`, "Mar.IA Pointing
Hands") and directed it to ship as the actual production art, superseding
the original image-model-and-raster-export plan (design.md Decisions 4–5,
both updated with a provenance note and the superseded plan kept
visible in a `<details>` block). The artifact's own `bot-body.png` is
confirmed byte-identical (SHA-256) to the already-shipped
`docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png` — no new
raster art exists; the hands, face, and limbs are hand-authored inline
SVG layered on that one existing PNG.

- [x] 8.1 Copy `docs/design/jos-121-chatbot-ui/bot-source/bot-body-469x564.png` to `public/maria-footer-body-469x564.png` unmodified (plain file copy, confirmed identical by SHA-256 — not a re-export, no image model involved).
- [x] 8.2 Rewrite `components/FooterIllustration.tsx` as an inline SVG (`viewBox="0 0 469 564"`): the body `<image>` + clip path, the "come on" visor face, a static resting-hand group, a static upper-arm limb, and an `m.g`-wrapped forearm group (limb + pointing hand) carrying the wag animation — transcribed from the artifact's SVG markup (gradients, paths, clip path) with its hand-drawn shapes reproduced exactly.
- [x] 8.3 Update `FOOTER_ELBOW_TRANSFORM_ORIGIN` in `SiteFooterStyles.ts` to `"66px 420px"` (the artifact's own pivot, in the canvas's native pixel space) — document in `docs/design/jos-191-disruptive-footer/README.md` why this is no longer a percentage.
- [x] 8.4 Rewrite `components/FooterIllustration.test.tsx` and `FooterIllustration.ssr.test.tsx` for the new SVG structure (no more three `<img>` layers; one body `<image>`, static groups, one animated `<m.g>`).
- [x] 8.5 Remove the now-unused `public/footer-stand-in-forearm.png` and its references.
- [x] 8.6 Run the component's tests, `npx tsc --noEmit`, and the full suite; verify in the browser (wag renders, reduced motion stops it, no seam — there is structurally nothing to seam now since it's one vector document, not two raster layers).

## 9. Review and Update Existing Unit Tests (MANDATORY)

- [x] 9.1 Grep for every test that renders `SiteFooter`, builds a profile fixture, or asserts the three-target contact set, and update each to the new shape.
- [x] 9.2 Confirm `ContactSection` tests are untouched and still pass, because the `#contact` section is unchanged.
- [x] 9.3 Confirm `oneScrollIndicator.test.tsx` and `anchorClearance.test.tsx` still pass, so the footer introduces no second scroll indicator and no anchor regressions.

## 10. Run Unit Tests and Verify State (MANDATORY - AGENT MUST EXECUTE)

- [x] 10.1 Capture a pre-test baseline. Unit tests use fakes and never touch Neon or Upstash; confirm that by grepping the new tests for real store construction.
- [x] 10.2 Run targeted suites: `npx vitest run app/ lib/content/ lib/analytics/ components/SiteFooter components/FooterIllustration components/SocialIcons components/palette components/admin/`.
- [x] 10.3 Run the full suite (`npm test`), `npx tsc --noEmit`, `npm run lint`, and `npm run validate:content`. Compare the pass count with 0.3.
- [x] 10.4 Confirm no persistent state changed.
- [x] 10.5 Create `openspec/changes/disruptive-footer/reports/YYYY-MM-DD-step-10-unit-test-and-state-verification.md` from the template in `docs/openspec-tasks-mandatory-steps.md`.

## 11. Manual Endpoint Testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [x] 11.1 Start `npm run dev` with a test `WHATSAPP_NUMBER` (a fake digits-only value) passed as an environment variable on the command line. **Not** written into `.env.local`: that file holds live `DATABASE_URL` and Upstash credentials and must not be modified by tests.
- [x] 11.2 Run `curl -si http://localhost:3000/go/whatsapp`. Verify the `302`, the `Location: https://wa.me/<test digits>`, `Cache-Control: no-store`, and an `X-Robots-Tag` containing `noindex`.
- [x] 11.3 Restart with `WHATSAPP_NUMBER` unset, then with `+52 55 1234 5678`. Verify `503` and no `Location` both times.
- [x] 11.4 Loop past the limit from one client. Verify `429` with no `Location`. Note in the report that keys are namespaced `go-whatsapp:`, so the chat and events counters are unaffected.
- [x] 11.5 Run `curl -s http://localhost:3000/robots.txt`. Verify `Disallow: /admin` and `Disallow: /go/`.
- [x] 11.6 POST a `contact_click` with `contactTarget: "whatsapp"` to `/api/events`:
  - with no `DATABASE_URL` configured: verify the endpoint's documented no-store behaviour
  - with `DATABASE_URL` configured: verify `2xx`, then delete that row by its unique test `sessionId` and confirm the count is back to baseline
- [x] 11.7 Restore `.env.local`, removing the test number, and record every command and response in `reports/YYYY-MM-DD-step-11-curl-verification.md`.

## 12. Browser Verification (MANDATORY - AGENT MUST EXECUTE)

- [x] 12.1 Load the site and scroll to the bottom. Verify the footer renders on the raised surface with the glow and the top rule, and that the illustration wags.
- [x] 12.2 At 360, 768, and 1440px, compare bounding boxes:
  - the chat trigger intersects neither the CTA nor any icon link
  - there is no horizontal scroll
  - the headline wraps balanced
- [x] 12.3 Under emulated `prefers-reduced-motion: reduce`, confirm the forearm is static. Sample the computed `transform` several times in one in-page loop: per `CLAUDE.md`, `getAnimations()` returns `[]` for framer-motion, and two samples taken via separate tool round-trips can land in the same phase.
- [x] 12.4 Tab through the footer. Every link must show a visible focus ring, and the CTA's pressed state must show on activation.
- [x] 12.5 Click every footer link and confirm a `contact_click` request fires with the right target (network panel). Confirm the WhatsApp click lands on `/go/whatsapp`.
- [x] 12.6 With JavaScript disabled, confirm the footer's text, links, illustration, and disclosure are all visible.
- [x] 12.7 Spot-check live contrast of the subline and the disclosure against the raised surface. Confirm the glow sits behind neither.
- [x] 12.8 If the art from Task Group 8 is in, wag to both extremes and confirm no seam shows at the elbow.
- [x] 12.9 Save `reports/YYYY-MM-DD-step-12-browser-verification.md` with screenshots at the three widths.

## 13. Build and bundle sanity

- [x] 13.1 Run `npm run build` (requires `OPENAI_API_KEY`) and confirm it succeeds.
- [x] 13.2 Confirm the Worker bundle is still within `performance-budget-compliance`. The illustration is static assets and adds no JS beyond one small client island.
- [x] 13.3 Grep `.next/`/`.open-next/` output and `public/rag-index.json` for the test number and for `wa.me`; neither may be present.

## 14. Update Technical Documentation (MANDATORY)

- [x] 14.1 Add a footer bullet to section 9 of `CLAUDE.md`, covering:
  - the footer is a second contact surface; `#contact` stays the nav target
  - the analytics disclosure must stay in it
  - the three-layer art and elbow pivot, and where the masters live
  - the `/go/whatsapp` secret and why the number must never enter `/content`
  - the rate-limit key namespacing
- [x] 14.2 Document the `WHATSAPP_NUMBER` secret (local `.env.local` and `wrangler secret put WHATSAPP_NUMBER`) in the deploy notes next to the other runtime secrets.
- [x] 14.3 Update `docs/api-spec.yml` with `GET /go/whatsapp` (`302`/`429`/`503`) and the extended `contactTarget` enum.
- [x] 14.4 Write `docs/design/jos-191-disruptive-footer/README.md`: the reference, the concept, the art provenance, the pivots, and a note that Linear's signed URLs expire.

## 15. OpenSpec sync

- [x] 15.1 Run `openspec validate disruptive-footer --strict` and fix any findings.
- [x] 15.2 Move JOS-191 through In Review once all tasks above are checked. Archive via `/opsx:archive`.
