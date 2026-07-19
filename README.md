# CareerDNA

Jose Muñoz's interactive professional profile. See [docs/PRD.md](docs/PRD.md)
for the full product spec.

## Content model

Profile content — the site's single source of truth, consumed by both the
rendered pages and the chatbot's retrieval corpus — lives under `/content`
as version-controlled structured files, kept separate from any UI
component (PRD §6):

```
/content
  profile.yaml            # name, positioning, summary, links, contact
  experience/
    <company>.yaml        # one file per career chapter
  projects/
    <project>.md          # frontmatter (title, company, skills, metrics)
                           # + a problem/approach/outcome narrative body
  skills.yaml              # skill -> evidence references
  faq.md                    # curated Q&A pairs
```

**ID convention:** an experience or project file's ID is its filename
without extension (e.g., `experience/oracle.yaml` has chapter ID
`oracle`). `skills.yaml` evidence entries reference these IDs directly.

Writing a new career chapter? See
[docs/content-authoring-guide.md](docs/content-authoring-guide.md) for the
template and a worked example.

The typed contract for this content — TypeScript interfaces and the tests
that prove the shape is valid — lives in `/lib/content`, not alongside the
data itself, keeping `/content` pure data.

`lib/content/read.ts`'s `getExperiences()` reads every file under
`content/experience/`, parses each through `ExperienceSchema`, and returns
them sorted by start date (most recent first). `components/CareerChapters.tsx`
renders the result as progressively-disclosed chapters using native
`<details>`/`<summary>` — chosen over a custom button + conditional render
for free keyboard operability, visible focus, and (as a side benefit) no-JS
readability, without hand-rolled ARIA state management. The collapsed
chapter's expand/collapse chevron is styled with Tailwind's `group-open:`
variant (see `components/CareerChaptersStyles.ts`) — pure CSS reacting to
the native `[open]` attribute, no JavaScript involved.

## Stack

Next.js (App Router) + Tailwind CSS + [Framer Motion](https://motion.dev)
for scroll/entrance animation — selected over GSAP ScrollTrigger via a
comparative spike (see `openspec/changes/motion-library-spike/reports/`).

## Development

```bash
npm install
npm run dev             # starts the Next.js dev server
npm run build            # production build
npm run start             # serves the production build
npm test                   # runs the Vitest suite
npx tsc --noEmit           # strict-mode type check
npm run validate:content   # build-time gate: fails non-zero on missing fields,
                            # dangling skill evidence references, or malformed dates
```

Content validation lives in `lib/content/validate.ts` (`validateContent()`), with a
thin CLI wrapper in `lib/content/cli.ts`. It scans every file under `/content`
against the Zod schemas in `lib/content/schemas.ts` — not just examples — so
broken or unevidenced content fails the build rather than shipping silently.

Component tests use `@testing-library/react` against a `jsdom` environment,
opted in per test file via a `// @vitest-environment jsdom` pragma (Vitest
4's `environmentMatchGlobs` config option is not available in the pinned
version) — content-model tests stay on Vitest's default `node` environment.

**Note**: this project pins `typescript@5.9.3` — Next.js 16.2.10's build
tooling is not yet compatible with TypeScript 7. See the motion-library-spike
change's design notes if considering an upgrade.

## Static assets

`public/resume.pdf` is the downloadable résumé served from the hero's
"Download résumé" CTA, via Next.js's static-file convention (no route or
build step needed).
