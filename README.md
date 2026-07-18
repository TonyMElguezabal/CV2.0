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

## Development

```bash
npm install
npm test               # runs the Vitest suite
npx tsc --noEmit       # strict-mode type check
npm run validate:content # build-time gate: fails non-zero on missing fields,
                          # dangling skill evidence references, or malformed dates
```

Content validation lives in `lib/content/validate.ts` (`validateContent()`), with a
thin CLI wrapper in `lib/content/cli.ts`. It scans every file under `/content`
against the Zod schemas in `lib/content/schemas.ts` — not just examples — so
broken or unevidenced content fails the build rather than shipping silently.
