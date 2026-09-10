## 0. Setup: Branch (MANDATORY — FIRST STEP)

- [x] 0.1 Working on `joseelguezabal/jos-123-change-cv`, branched from `main` before any code change
- [x] 0.2 `git status --short` on the branch shows only the three pre-existing untracked items (`docs/project_sep6.PRD.md`, `dplyprod.sh`, `openspec/changes/project-evidence-and-technical-depth/`) plus this change's own new artifacts — no unrelated tracked work carried in

## 1. Convert and verify the new CV (Decisions 1–2)

- [x] 1.1 Fetched the ticket's `.docx` attachment from Linear (signed URL, ~5-minute TTL — fetched immediately, not deferred)
- [x] 1.2 Inspected the `.docx`: text-only (no `word/media`), standard structure — good conversion-fidelity candidate
- [x] 1.3 Extracted structured content (headings, bold/italic, tab-stop dates, bullet lists) via `textutil` + custom parsing, preserving every fact verbatim
- [x] 1.4 Typeset as HTML matching the existing published PDF's typographic system (Oswald headings, Source Sans Pro body — read from the old PDF's own embedded-font metadata) rather than inventing a new look
- [x] 1.5 Rendered to PDF via headless Chrome `--print-to-pdf` — confirmed via the old PDF's `/Producer` metadata (`PDFium`) that this is the same rendering pipeline already in production for this asset
- [x] 1.6 Verified the output directly: 2 pages, 259,572 bytes, all fonts subset-embedded (no bare system-font fallback), both pages visually inspected via Quick Look render — no truncation, no overflow, no substituted glyphs

## 2. Publish the asset and preserve provenance (Decision 3)

- [x] 2.1 Committed `docs/cv/Jose_Munoz_Elguezabal_CV_EN.docx` (the Word source) and `.pdf` (the rendered output) — Linear attachment URLs expire in ~5 minutes; this repo already lost design assets that way once (`docs/design/jos-121-chatbot-ui/`)
- [x] 2.2 Replaced `public/resume.pdf` with the converted PDF, path and filename unchanged
- [x] 2.3 Confirmed `components/HeroCtas.tsx`'s `href`/`download` attributes needed no edit — format stayed PDF, path stayed the same

## 3. Content reconciliation

- [x] 3.1 Diffed every `content/experience/*.yaml` company, role, and date against the new CV — all already matched exactly (Oracle 2021-11→2026-01, Envato, Tiempo, all three TCS accounts, IBM); no experience-content edit needed
- [x] 3.2 Repo-wide search for the superseded email (`josem99@hotmail.com`) and for any "13+ years" claim: **zero occurrences** anywhere in code, content, or docs — every `mailto:` already derives from `profile.yaml`'s single `contact.email` field, already `jose.elguezabal@gmail.com`
- [x] 3.3 **Found and fixed the one real divergence**: `profile.yaml`'s `positioning` ("Technical Delivery Manager") no longer matched the new CV's stated title ("Director of Delivery & Engineering") — this is the change's actual trigger, not a mechanical sync step

## 4. Sync every surface the title reaches (Decision 5)

- [x] 4.1 `content/profile.yaml`: `positioning` field updated
- [x] 4.2 `content/profile.yaml`: `hero.terminalLines` easter-egg line updated (`jose_munoz — director of delivery & engineering`)
- [x] 4.3 `content/faq.md`: "Who is Jose?" answer updated — this is the surface that mattered most, since it is indexed into the chatbot's retrieval corpus and Mar.IA would otherwise keep asserting the superseded title after the CV shipped
- [x] 4.4 `docs/PRD.md`: product line and Positioning statement updated to match, as documentation rather than runtime content
- [x] 4.5 Repo-wide search confirms no remaining "Technical Delivery Manager" occurrence in `content/` or `docs/PRD.md`
- [x] 4.6 **Correction, found by `/verify`**: 4.3's checkbox verified the *source file* was edited, not that the chatbot's live answer changed. It hadn't — see Task Group 9. Left 4.3 checked (the file edit is real and correct) but recording this distinction explicitly rather than letting the checkbox imply more than it verified.

## 5. Review and Update Existing Unit Tests (MANDATORY)

- [x] 5.1 `components/HeroCtas.test.tsx` run — asserts `href="/resume.pdf"` and `download="Jose Munoz Elguezabal.pdf"` verbatim; both unchanged, still passes
- [x] 5.2 Confirmed no test asserts the literal string "Technical Delivery Manager" against real `/content` output — the only hardcoded occurrences are unrelated component-prop fixtures (`HeroFramer.test.tsx`, `heroGradient.test.tsx`, `ChatPanel.test.tsx`, `eval-grade.test.ts`) that pass a fixture value in, not a `/content` read; none needed editing
- [x] 5.3 `git diff main --stat` on content files: 3 files changed, 5 insertions / 5 deletions — every change a like-for-like string replacement, no structural edit

## 6. Run Unit Tests and Verify State (MANDATORY)

This repo has no database; `/content` integrity is the equivalent state to verify.

- [x] 6.1 Pre- and post-edit `npm run validate:content`: clean both times
- [x] 6.2 `npx tsc --noEmit`: clean
- [x] 6.3 Full suite run twice: 648/649 both times, same single known flake (`ChatWidget.test.tsx`, hardcoded fixtures, never reads `/content` — confirmed unrelated and pre-existing)
- [x] 6.4 That flaky test run in isolation 3×: 16/16 every time
- [x] 6.5 Report written: `reports/2026-09-09-step-unit-test-and-state-verification.md`

## 7. Browser Verification (MANDATORY — AGENT MUST EXECUTE)

- [x] 7.1 Started a fresh dev server against the exact working tree at the final commit (`988aa81`); confirmed the tree had no uncommitted diff before verifying
- [x] 7.2 `curl -sI /resume.pdf`: `200`, `application/pdf`, `259572` bytes; SHA-256 of the served body matches `public/resume.pdf` on disk exactly
- [x] 7.3 Live DOM/network check of the CTA: `href`, `download`, `data-analytics-event`, and accessible name all correct and unchanged
- [x] 7.4 Live DOM check of positioning sync: page `<title>`, hero text, and terminal line all read the new title; regex check for the old title across `document.body.innerText` returns no match
- [x] 7.5 Console checked for errors/warnings/hydration issues: none found; only pre-existing, unrelated dev-mode notices (eval() CSP notice, local Upstash Redis env-var warnings — `/api/events` itself still returned `204`)
- [x] 7.6 Report written: `reports/2026-09-09-step-browser-verification.md`
- [ ] 7.7 **Not verified — carried as an open item, not silently closed**: real mobile-device rendering of the PDF, and cache-invalidation behavior on the actual deployed Cloudflare Worker (only local dev-server byte-identity was checked; Decision 3 in design.md names this explicitly as unresolved)

## 8. Spec and documentation sync (MANDATORY)

- [x] 8.1 `specs/one-click-resume-download/spec.md` delta written: ADDED requirement tying the published résumé's stated title to `profile.yaml`'s `positioning`
- [x] 8.2 Confirmed no other spec references the résumé's content (only `one-click-resume-download` mentions the PDF at all) — no second delta needed
- [x] 8.3 Decided against a CLAUDE.md/AGENTS.md addition: this change is a content/asset update governed entirely by the new spec requirement above, not a new architectural pattern or non-obvious code decision of the kind that file otherwise records

## 9. Fix: rebuild the stale RAG index (found via `/verify` — FAIL)

`/verify` ran the app and drove the chat widget live, rather than trusting
the earlier source-file diff. Clicking the site's own first suggested
question, "Who is Jose?", returned *"Jose is a **Technical Delivery
Manager**..."* — the superseded title, tagged `#faq`. Root cause: `next
dev` never rebuilds `lib/rag/index.json`/`public/rag-index.json`; only
`npm run build`'s `prebuild` chain does. Both files were dated 2026-09-06,
before this change's content edits — confirmed directly by grepping the
index for both strings (0 hits for the new title, 2 for the old, in the
exact `profile-summary` and `faq-0` chunks). This is a real gap in what
Task Group 4 claimed done, not a false positive.

- [x] 9.1 Ran `npm run prebuild` to regenerate `lib/rag/index.json` from
      current `/content` and republish it to `public/rag-index.json`
- [x] 9.2 Verified the regenerated index directly: 0 chunks contain
      "Technical Delivery Manager", `profile-summary` and `faq-0` chunks
      now contain "Director of Delivery & Engineering"
- [x] 9.3 Re-drove the live chat widget with the same question ("Who is
      Jose?") against a fresh dev server — confirmed the answer now
      states the correct title
- [x] 9.4 Report written: `reports/2026-09-10-step-9-rag-index-rebuild-verification.md`

## 10. OpenSpec sync (not yet done)

- [ ] 10.1 Push branch and open PR
- [ ] 10.2 Merge PR
- [ ] 10.3 Sync `specs/one-click-resume-download/spec.md`'s ADDED requirement into `openspec/specs/one-click-resume-download/spec.md`
- [ ] 10.4 `openspec validate refresh-published-cv --type change --strict` and `--type spec --strict`
- [ ] 10.5 Archive to `openspec/changes/archive/`
- [ ] 10.6 Comment on JOS-123 with what shipped; move ticket to Done once merged and confirmed live
