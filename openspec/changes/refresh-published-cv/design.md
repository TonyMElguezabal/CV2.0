## Context

`public/resume.pdf` is a single static asset served by Next.js's static-file convention — no route, no build step, no content-schema field (`one-click-resume-download`). It is hardcoded into `components/HeroCtas.tsx` by path and by save-as filename. Nothing in the system ties its *content* back to `/content`, because it isn't part of `/content` — it's a designed PDF, while `/content` is structured YAML/Markdown consumed by both the rendered site and the RAG chatbot's retrieval index (`content-model`).

That gap is exactly what let this change's triggering bug happen. A new CV arrived from the owner as a `.docx`, stating "Director of Delivery & Engineering." Nothing checked it against `profile.yaml`'s `positioning` field ("Technical Delivery Manager"), which independently drives the hero, the page `<title>`, and — via `content/faq.md`, indexed into the chatbot's corpus — Mar.IA's own answer to "Who is Jose?" All three would have kept stating the old title indefinitely if the mismatch hadn't been caught by hand while implementing the file swap.

## Goals / Non-Goals

**Goals:**
- Publish the new CV as the served résumé without regressing any guarantee `one-click-resume-download` already makes (single static PDF, no dynamic generation, one-click, professional save-as name).
- Bring every place the professional title is stated — the résumé, the hero, the page title, the chatbot's FAQ source — into agreement.
- Add a spec requirement that makes the next title mismatch a defined violation, not a silent regression someone has to notice by inspection.

**Non-Goals:**
- Multi-format download (PDF + DOCX side by side). The existing spec's "no intermediate step" requirement effectively rules out a format picker, and the D1 decision (`.docx` → PDF conversion) already resolves the immediate ask without touching that guarantee.
- Moving the résumé path into the content schema. The href is hardcoded and this is a one-file swap; a schema field would be abstraction the task doesn't need.
- A general "keep all published documents in sync with `/content`" mechanism. Scoped narrowly to the one field (professional title) that this change's own incident showed can drift silently.

## Decisions

### Decision 1 — Convert the new CV to PDF; do not serve `.docx`
The CV arrived as a Word document (12,926 bytes) against the previously-served PDF (247,647 bytes) — a ~19× size difference consistent with the `.docx` being the plain authoring source, not a designed, print-ready artifact. Serving `.docx` directly would have broken `one-click-resume-download`'s implicit contract in three ways: layout is not guaranteed identical across Word/Google Docs/Pages, most mobile browsers cannot preview it inline and require an office-suite app to open it, and unlike a PDF it is trivially editable after download. Converting preserves every existing guarantee unchanged.

*Alternative considered:* serve both formats from two CTAs. Rejected — `one-click-resume-download`'s "one click, no intermediate step" requirement is written against a single résumé artifact; branching the CTA is a larger, unrequested change.

### Decision 2 — Render via headless Chrome, not an installed office suite
No LibreOffice, Microsoft Word, or Pages was available in the environment doing the conversion. The `.docx` is text-only (no embedded images), so its content was extracted faithfully and laid out as HTML, then printed to PDF with headless Chrome (`--print-to-pdf`). This is not an arbitrary choice: the currently-served `public/resume.pdf`'s own PDF metadata already identifies `Producer: PDFium`/`Skia` — Chrome's print pipeline — so the new PDF is produced by the same rendering engine already in production for this asset, keeping font-embedding and output characteristics consistent with what shipped before.

*Verified, not assumed:* page count (2), byte size (259,572), and font embedding (all subset-tagged, no bare system-font references) were checked directly against the rendered file rather than trusted from the conversion step alone.

### Decision 3 — Keep the asset path and save-as filename unchanged
`public/resume.pdf` and the `download="Jose Munoz Elguezabal.pdf"` attribute in `HeroCtas.tsx` are untouched. This keeps any externally shared direct link working and avoids touching the CTA component or its test, at the cost of needing an explicit cache-behavior check on the deployed site (edge-cached static assets could otherwise serve a stale copy to a returning visitor).

*Alternative considered:* version the path (e.g. `/cv-2026-09.pdf`), which self-invalidates caches but breaks any previously shared link and orphans old versions in `public/`. Rejected as unnecessary churn for a same-format replacement.

### Decision 4 — Treat title consistency as a `one-click-resume-download` requirement, not a new capability
The drift this change fixes is specifically about the *content* of the one asset that capability already governs — its Purpose section already frames the résumé as "the single pre-approved, statically-hosted résumé PDF." Adding a requirement there keeps the invariant next to the artifact it protects, rather than inventing a new capability for a single cross-reference rule.

*Alternative considered:* a general content-consistency capability spanning all of `/content`. Rejected as broader than what this change's own incident demonstrated a need for — scope the fix to the proven gap.

### Decision 5 — Sync every surface the title reaches, not just the CTA's target
`positioning` in `profile.yaml` drives the hero and the page `<title>` directly. `content/faq.md`'s "Who is Jose?" answer is a separate, independently-authored string that happens to say the same thing today — it is not derived from `positioning` programmatically. Both were found and updated, along with the terminal easter-egg line (`hero.terminalLines`) and `docs/PRD.md`'s two title references, kept in sync as documentation rather than runtime content.

*Risk this decision manages directly:* `faq.md` feeds the chatbot's retrieval index. Updating only `profile.yaml` would have left Mar.IA asserting the superseded title in conversation even after the visible page was correct — a worse failure than the original bug, because it would look authoritative.

## Risks / Trade-offs

- **[Risk]** Edge-cached copies of the old PDF could be served to returning visitors under the unchanged path (Decision 3) → **Mitigation:** verified byte-identity between the deployed static asset and the source file locally; cache behavior on the actual deployed Cloudflare Worker is called out explicitly as a required post-deploy check, not assumed from local verification.
- **[Risk]** `content/faq.md`'s title string is manually kept in sync with `profile.yaml`, not derived from it — the same class of drift this change fixes could recur if a future edit touches one and not the other → **Mitigation:** the new spec requirement (this change's `specs/one-click-resume-download/spec.md` delta) makes that an explicit, checkable obligation rather than tribal knowledge.
- **[Risk]** Headless-Chrome HTML→PDF conversion is a one-off manual step, not an automated pipeline → **Mitigation:** the Word source is committed to `docs/cv/`, so the exact conversion can be reproduced or re-run if the CV needs another update; this is judged sufficient given résumé updates are infrequent, not a build-time concern like `lib/rag/embed.ts`'s content indexing.

## Open Questions

- Should `content/faq.md`'s title reference eventually be templated from `profile.yaml.positioning` at build time, closing the manual-sync gap in Decision 5 permanently rather than by convention? Deferred — no second FAQ answer currently duplicates profile data this way, so a templating mechanism would be built for a problem observed once, not a pattern.
- Personal mobile number `+52 33 1303 9642` appears on the world-readable PDF. Already public in the previous version, not a new exposure introduced by this change, but the owner has not explicitly confirmed it should stay — carried as an open item rather than resolved here.
