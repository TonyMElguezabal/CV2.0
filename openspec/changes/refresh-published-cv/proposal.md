Linear-Issue: JOS-123

## Why

The downloadable résumé PDF and the site's own copy can silently disagree about who Jose is. That is not hypothetical: this change was triggered by exactly that drift — a new CV version arrived stating "Director of Delivery & Engineering," while the site's hero, page title, terminal easter egg, and the chatbot's own "Who is Jose?" answer still said "Technical Delivery Manager." Nothing in the spec protected against a recruiter reading one title on the page and downloading a résumé with another. This change fixes the immediate drift and closes the gap that let it happen.

## What Changes

- The static résumé served at `/resume.pdf` is replaced with a new, up-to-date version. The source was delivered as `.docx`; it is converted to PDF rather than served as `.docx`, preserving `one-click-resume-download`'s existing "single pre-approved PDF" guarantee — layout fidelity across viewers, inline browser preview, and no office-suite dependency on mobile.
- The Word source is committed to the repo (`docs/cv/`) alongside the rendered PDF, since Linear's attachment URLs expire minutes after upload and this repo has already lost design assets that way once.
- Site copy is synced to the new CV's stated title in every place it appears: `content/profile.yaml`'s `positioning` field (drives the hero and the page `<title>`), its terminal easter-egg line, and `content/faq.md`'s "Who is Jose?" answer (indexed into the chatbot's retrieval corpus).
- **New capability requirement**: the published résumé's stated professional title must match the site's own positioning claim, so this class of drift is a spec violation next time, not a silent regression caught by chance.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `one-click-resume-download`: adds a requirement that the pre-approved résumé PDF's stated professional title stays consistent with `profile.yaml`'s `positioning`, and that replacing the résumé with a version carrying a different title updates that site copy in the same change.

## Impact

**Assets** — `public/resume.pdf` (replaced), `docs/cv/Jose_Munoz_Elguezabal_CV_EN.docx` and `.pdf` (new, provenance).

**Content** — `content/profile.yaml` (`positioning`, terminal line), `content/faq.md` (title reference). All experience dates/roles/companies in `content/experience/*.yaml` were checked against the new CV and already matched — no change needed there.

**Docs** — `docs/PRD.md` (product line + Positioning statement, kept in sync with `profile.yaml`).

**Not affected** — `components/HeroCtas.tsx` and its test (href/filename unchanged, format stayed PDF), `lib/analytics/*`, `docs/api-spec.yml`, `docs/data-model.md`, `README.md` — none of these state a format or make a title claim, so none needed editing.

**Risk** — none of the content changes are structural; the main risk this change manages is the one it exists to close (drift between the résumé and the site).
