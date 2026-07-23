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
the native `[open]` attribute, no JavaScript involved. Each chapter's
Technologies list links to that same chapter's Projects section
(`#{chapterId}-projects`) — the content model has no per-project technology
data, so this links to the chapter's evidence as a whole rather than a
fabricated per-technology mapping.

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

## Chatbot operations

`POST /api/chat` (`app/api/chat/route.ts`) enforces per-IP (10 msgs / 5 min)
and best-effort per-session (20 msgs) rate limits, backed by Upstash Redis
(`lib/chat/rateLimit.ts`). This requires two one-time manual setup steps
that are **not** application code and have no automated test:

1. **Upstash Redis** — create a free database at
   [console.upstash.com](https://console.upstash.com) and set
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` in `.env.local`
   (local) and the Vercel project's environment variables (production).
   Without these, the rate limiter fails open (allows all requests) rather
   than breaking chat — see `lib/chat/rateLimit.ts`'s `checkRateLimit`.
2. **Monthly provider spend alarm** (PRD §7 guardrails table) — set a hard
   usage limit/alert on the OpenAI account console. This is the last line
   of defense against runaway cost and must be configured directly in the
   provider's billing settings; there is no code path for it.

**Eval set / ship gate** (PRD §7 quality bar): run `npm run eval:chat`
against the live model before merging any prompt or content change. It
runs the ~32-question set in `lib/rag/eval-set.ts` (5 core questions, a
factual per career chapter and project, off-topic traps, injection
attempts, plausible-but-uncovered questions), grades the factual/trap/
injection results automatically (`lib/rag/eval-grade.ts`), and prints a
`shipReady` verdict plus a per-category summary. Core and uncovered
results are flagged for manual review instead — read those answers by
hand. This makes real API calls (cost + `OPENAI_API_KEY`), so it's a
manual, owner-executed gate, not part of `npm test`/CI.

## Analytics store

`POST /api/events` (`app/api/events/route.ts`) persists anonymized
first-party engagement events (page views, section reach, chat opens,
question counts, résumé downloads, contact clicks) to Neon Postgres, per
`docs/data-model.md`. It reuses the chat endpoint's per-IP rate limiter
(`lib/chat/rateLimit.ts`) and fails open on limiter errors. Requires one
one-time manual setup step that is **not** application code and has no
automated test:

1. **Neon database** — provision one via the
   [Vercel Marketplace's Neon integration](https://vercel.com/marketplace/neon)
   (or directly at [console.neon.tech](https://console.neon.tech)), apply
   `lib/analytics/schema.sql` once against it, and set `DATABASE_URL` in
   `.env.local` (local) and the Vercel project's environment variables
   (production). Without this, `POST /api/events` fails cleanly (5xx)
   rather than crashing the site — analytics is fire-and-forget, so a
   failed beacon never affects the page.

**Retention**: events are intended to be kept for 180 days. A retention
cleanup job is not built yet — this is a future story, not part of JOS-72.

## SEO / site URL

The site's metadata (canonical link, OpenGraph, Twitter card, sitemap,
JSON-LD `@id`s) all derive from one configured origin, resolved by
`lib/seo/siteUrl.ts`:

1. **`NEXT_PUBLIC_SITE_URL`** — the real production domain. Set it in
   `.env.local` (local) and the Vercel project's environment variables
   (production). Without it, absolute URLs fall back to Vercel's
   auto-provided production URL, then to `http://localhost:3000` in dev —
   so nothing breaks locally, but production needs the real value for
   correct share cards and a correct sitemap.

The OpenGraph share image (`app/opengraph-image.tsx`) is **generated from
content** via `next/og`'s `ImageResponse` — it renders the profile's name
and positioning from `content/profile.yaml`, so it can never drift from
the site's actual content.

**Manual verification (owner, post-deploy)**: once a real domain is live,
paste the site URL into a share-link debugger (e.g. Facebook's Sharing
Debugger, or just share it in Slack/iMessage) to confirm the OpenGraph
card renders as designed, and run the landing page through
[Google's Rich Results Test](https://search.google.com/test/rich-results)
to confirm the `Person`/`ProfilePage` structured data validates. These
external validators are the test per the SEO story's acceptance criteria
— they can't be run from `npm test`.

## Performance budget

The landing route's **First Load JS is ~128 KB gzip** (measured 2026-07-23
from a `next build --webpack` production build — Next 16's build output no
longer prints the classic per-route size table, so this is computed
directly from `.next/static/chunks` via `gzip -c <chunk> | wc -c`, summing
the root framework chunks + the route's own `page`/`layout` chunks).
**Treat a future First Load JS above ~160 KB gzip as a regression** worth
investigating before merge.

Two lazy boundaries keep the heavy client-only cost out of that number —
confirmed via `.next/react-loadable-manifest.json`:

- `components/MotionProvider.tsx -> framer-motion` (~51 KB gzip) — the
  `LazyMotion` `domAnimation` feature bundle, loaded via dynamic import
  instead of eagerly importing `motion`'s full API.
- `components/ChatWidget.tsx -> ./ChatPanel` (~20 KB gzip) — the chat
  panel (streaming, citations, `AnimatePresence`), loaded on first open;
  only the lightweight trigger button ships in the initial bundle.

**Lighthouse + LCP gate** (against a production build, `next build &&
next start`, run `npx lighthouse <url> --preset=desktop` and a mobile
run — this doesn't run in `npm test`, matching the `eval:chat`/Upstash
manual-gate convention). Measured 2026-07-23:

| | Performance | Accessibility | Best Practices | SEO | LCP |
|---|---|---|---|---|---|
| **Desktop** | 100 | 100 | 100 | 100 | 0.6s |
| **Mobile** (throttled) | 86–87 | — | — | — | 4.1s |

Desktop clears every target comfortably. **Mobile performance and LCP are
a near-miss** against the ≥90 / <4s targets — root-caused to the
`framer-motion` `domAnimation` feature bundle's fetch/parse cost landing
inside the LCP window under Lighthouse's simulated mobile network+CPU
throttling (confirmed via the `unused-javascript` audit, which flags a
large fraction of that chunk as uncovered on this simple page — expected
for a general-purpose animation library exercising only a fade/slide).
`components/MotionProvider.tsx` already defers the `import()` to browser
idle time (`requestIdleCallback`, with a `setTimeout` fallback for
Safari) to deprioritize it behind LCP-critical requests; this measurably
did not move the score, since the resource still has to load within the
audited trace window regardless of scheduling priority. Removing
`framer-motion` from the hero would close this gap but reopens a locked
decision (`motion-library-decision` / `hero-signature-motion` — the
signature entrance animation is an accepted design, not up for revision
in this story). **Flagged as an owner follow-up**: accept the mobile
trade-off as-is, or revisit the motion-library decision in a future
story.

**60fps**: verified at the code level — every `initial`/`animate`/`exit`
value across both animated surfaces (`HeroFramer.tsx`, `ChatPanel.tsx`)
sets only `opacity`/`y` (a `transform: translateY`), never a
layout-triggering property (width/height/top/left/margin), so all
animation stays compositor-only by construction. A live DevTools
Performance recording could not be captured in this environment — the
browser automation tab reports `document.visibilityState: "hidden"`,
which throttles the animation frame loop entirely (the same tab-visibility
limitation found and documented during the accessibility story's manual
verification), not a reflection of real device behavior.

## Static assets

`public/resume.pdf` is the downloadable résumé served from the hero's
"Download résumé" CTA, via Next.js's static-file convention (no route or
build step needed).
