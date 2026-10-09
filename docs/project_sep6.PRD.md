# CareerDNA — Product & System Description (As-Built)

**Product:** Interactive professional profile for Jose Muñoz, Technical Delivery Manager
**Document type:** As-built PRD / system description
**Snapshot date:** September 6, 2026
**Owner:** Jose Muñoz
**Status:** Live product description, reflecting shipped functionality

---

## 0. Purpose and relationship to `docs/PRD.md`

`docs/PRD.md` ("CareerDNA — Lean PRD", v1.1, July 2026) is the **planning
document** — the original intent, drafted before implementation began. It is
still the canonical reference for *why* the product exists and its guiding
principles, and this document does not replace it.

This document is different in kind: it describes **what has actually been
built and shipped**, as verified against the current codebase, as of
2026-09-06. Where the two disagree (a feature scoped differently than
planned, a technical decision the plan left open and implementation
resolved), this document reflects reality and calls out the divergence
explicitly. Every feature and decision below is traceable to a component,
module, spec, or OpenSpec change in this repository.

---

## 1. Vision (unchanged from the plan)

Create the most memorable professional profile a recruiter, hiring manager,
or technical interviewer has ever experienced. Not a résumé — a premium
interactive web application that tells the story of a career through
motion, storytelling, and AI. The site itself is the portfolio piece: it
demonstrates product thinking, architecture, front-end craft, and AI
integration by existing.

**Positioning:** Technical Delivery Manager specializing in complex
software programs, engineering organizations, cloud initiatives,
AI-enabled products, and cross-functional delivery.

**The five questions every feature must serve:**

1. Who is Jose?
2. What problems has he solved?
3. How does he lead teams?
4. What technical depth does he possess?
5. Why should someone hire him?

**Emotional journey:** Curiosity → Interest → Credibility → Confidence →
Trust → Action (download résumé, ask the AI, book a meeting, reach out).

---

## 2. What the system is, today

CareerDNA is a **statically-generated Next.js 16 (App Router) site**,
deployed as a **Cloudflare Worker** via `@opennextjs/cloudflare`, with two
genuinely dynamic server surfaces (a streaming chat API and an owner-only
admin dashboard) and a small first-party Postgres store used exclusively
for anonymized visitor analytics. There is no CMS and no general-purpose
backend — content is version-controlled data in the repository, and the
database exists for one narrow purpose only.

At a glance:

| Layer | What it is |
|---|---|
| Public site | Statically rendered marketing/story pages under `app/(marketing)` |
| Content | `/content` YAML + Markdown, validated at build time |
| Chatbot ("Mar.IA") | `POST /api/chat` — RAG pipeline over the content corpus, streamed response |
| Analytics | `POST /api/events` — anonymized event beacons → Neon Postgres |
| Admin | `/admin` — owner-only, cookie-session-gated insights dashboard reading the analytics store |
| Hosting | Cloudflare Workers (free tier, by deliberate owner decision) |

---

## 3. Audience and design principles (unchanged from the plan)

Recruiters, hiring managers, directors, CTOs, engineering managers,
technical interviewers, potential clients. One consistent experience for
all — no audience-specific variants. Fully responsive across mobile,
tablet, and desktop — mobile is not a degraded variant (see §6.9).

Design principles guiding every shipped feature: story over résumé, motion
with purpose (and full `prefers-reduced-motion` support), progressive
disclosure, evidence over buzzwords, a premium feel benchmarked against
Apple/Stripe/Linear/Vercel, AI as an accelerator that never invents facts,
and a dark theme by default with a small, deliberately bounded color
palette.

---

## 4. Content model (as built)

`/content` is the single source of truth for both the rendered site and
the chatbot's retrieval corpus, kept strictly separate from `/components`:

```
/content
  profile.yaml          # name, positioning, summary, links, contact, hero terminal lines, chat copy
  origins.yaml           # pre-résumé record (1994–2006): narrative-only, no dates precision required
  experience/
    envato.yaml           # Project Delivery Manager — Envato (Placeit.net)
    ibm.yaml               # L2 Support / DB2 Analyst — IBM (Bluehorizon)
    oracle.yaml             # Senior Software Development Manager — Oracle Corporation
    tcs-banamex.yaml         # Business Relationship Manager — TCS (Citibanamex account)
    tcs-bcp.yaml              # ACMA Project Manager — TCS (Banco de Crédito del Perú account)
    tcs-ge.yaml                # Project/Account Manager — TCS (General Electric account)
    tiempo.yaml                 # Director of Software Delivery — Tiempo Development (now 3Pillar Global)
  projects/
    adehub.md
    ai-background-removal.md
  skills.yaml             # skill -> prose summary + evidence[] (chapter IDs), validated for dangling references
  faq.md                    # curated Q&A pairs strengthening chatbot answers
  meta.md                     # the site/chatbot describing itself, model names injected at build time
```

Key rules, enforced by `lib/content/validate.ts` (`npm run validate:content`)
and Zod schemas in `lib/content/schemas.ts`:

- Every skill's `evidence[]` must reference a real experience/project ID —
  dangling references fail the build.
- **Legacy/pre-résumé tooling never becomes a claimed current skill.**
  `origins.yaml` entries are never wired into `skills.yaml` evidence — a
  current-capability list is exactly where decades-old tooling (DOS,
  Novell, Clipper, Oracle 8i, ...) would dilute the cloud/AI signal.
- **No birth date or current age anywhere in `/content`.** The origins
  narrative may say "in technology since 1994" or "started at 13" (both
  intentional), but never a machine-readable age/birth-year field.
- `origins.yaml` content is authored in narrative order (no chronological
  sort), unlike `getExperiences()`'s date-sorted output — it's an arc, not
  a list.

Writing a new career chapter follows a documented template:
`docs/content-authoring-guide.md`.

---

## 5. Functional capabilities (as built)

### F1 — Hero experience

- Terminal-style animated hero (`components/Terminal.tsx`) typing out
  identity/positioning lines sourced from `profile.yaml.hero.terminalLines`
  — never hardcoded copy.
- A whole-page **animated hero laptop** (`HeroLaptop.tsx`) with
  scroll-driven 3D rotation and cinematic lighting, rendered at every
  viewport width (mobile included — see §6.9).
- An **ambient particle field** (`AmbientSparkleLayer.tsx`) layered above
  the laptop and its scrim, with pointer-attraction and constellation
  links between nearby particles, density-scaled to container area.
- A choreographed **arrival sequence** (`ArrivalSequenceProvider.tsx`)
  orders the hero's first ~2 seconds of entrances; deep-linked loads skip
  the choreography and render final state directly.
- Primary/secondary CTAs (`HeroCtas.tsx`): scroll to explore, ask the AI,
  download résumé, contact.
- Fully readable with JavaScript disabled and under
  `prefers-reduced-motion` (fade-only fallback, enforced by a shared
  `noscript` override).

### F2 — Career timeline

- `CareerTimeline.tsx` — the site's **one and only scroll-position
  indicator** (enforced in spec; the header never introduces a second
  one). Renders one node per experience chapter plus the origins entry,
  via a shared `TimelineEntry` view-model so a non-experience node needs
  no special-casing.
- Active node tracked via `IntersectionObserver` with a scroll-listener
  fallback; clicking a node navigates to that chapter.

### F3 — Career chapters

- One chapter per role, rendered by `CareerChapters.tsx` as native
  `<details>`/`<summary>` elements — chosen for free keyboard operability,
  visible focus, and no-JS readability over a hand-rolled ARIA
  disclosure widget.
- Each chapter: company/role/dates/mission, business context, actions
  taken, 2–4 projects with outcomes, a leadership story, technologies
  (linked to that chapter's project evidence), and lessons learned.
- Chunks fed to the chatbot are **self-describing in time and
  attribution** — every chapter chunk is prefixed with
  `"{role} at {company} ({dateRange})"` so retrieval can't collide a
  legacy-era chunk with a current one, and no chunk is orphaned from its
  source chapter.
- A separate, narratively-distinct **origins section** (`OriginsSection.tsx`)
  covers the pre-résumé record (1994–2006) without pretending to be a
  formal experience entry (see §4).

### F4 — Evidence layer

- `SkillsSection.tsx` renders every skill with links to the chapters/
  projects that demonstrate it — no unlinked skill claims are permitted
  by the content schema.
- `ProjectsSection.tsx` — project cards following problem → approach →
  outcome → metrics.

### F5 — RAG chatbot ("Mar.IA")

Fully shipped, not just an entry point — see §7 for the full pipeline.
Branded and named (JOS-121): the assistant identifies itself as **Mar.IA**
when asked, as a defined role rather than a persona. Every "Mar.IA"
rendering pairs a styled visual form with a pronounceable screen-reader
label (the period in "Mar.IA" would otherwise read as "dot").

### F6 — Résumé download

- Single static `public/resume.pdf`, served via Next.js's static-file
  convention. Download tracked as a `resume_download` analytics event.

### F7 — Contact

- `ContactSection.tsx` — scheduling link (Cal.com), `mailto:`, LinkedIn.
  No contact form (avoids spam handling and a backend). Each click is
  tracked as a `contact_click` event with its target.

### F8 — Analytics (shipped)

- `POST /api/events` persists anonymized first-party engagement events to
  Neon Postgres: `page_view`, `section_reach` (+ scroll depth),
  `chat_open`, `question_asked` (**count only, never text — no field
  exists to hold it**), `resume_download`, `contact_click`.
- Session grouping via a client-generated, in-memory, per-tab
  `crypto.randomUUID()` (`lib/session.ts`) — cookieless, no fingerprinting,
  a page reload starts a new session by design.
- Server-derived, non-identifying dimensions only: `countryOrRegion`,
  `referrerDomain`, `deviceClass` — raw IP/user-agent values are never
  stored.
- Fire-and-forget: a failed beacon (e.g., `DATABASE_URL` unset) never
  affects the page. 180-day retention is the documented intent; a cleanup
  job is not yet built.

### F9 — Admin insights dashboard (shipped)

- `/admin`, under its own independent root layout with no marketing
  chrome, gated by a cookie-session login (`ADMIN_USER`/`ADMIN_PASSWORD`,
  HMAC-signed 7-day session cookie, `HttpOnly`/`Secure`/`SameSite=Strict`,
  scoped to `Path=/admin`). Unconfigured credentials fail the gate
  **closed**. Excluded from search indexing.
- Four aggregate report families, all reading the same `AnalyticsEvent`
  fact table, doubling as a scorecard against the plan's launch metrics
  (§10 below): **Traffic** (views, unique sessions, daily trend, device/
  country/referrer breakdowns), **Engagement depth** (median session
  duration, % reaching the second chapter, scroll-depth distribution),
  **Chat usage** (% of sessions opening chat, question count), and
  **Conversions** (résumé downloads, contact clicks by target).
- Every report is an aggregate — never a raw per-session row — so no PII
  can leak through the dashboard by construction.

---

## 6. Non-functional characteristics (as built)

### 6.1 Performance

**The original Lighthouse/LCP/bundle-size merge gates were retired by
owner decision (2026-08-13)** — the site is distributed by direct link
and printed résumé, not search discovery, so those numbers are recorded
historically (`README.md` "Performance budget") but no longer block
merges. What **is** still enforced:

- **60fps, compositor-only animation.** Every animated surface sets only
  `opacity`/`transform` properties — verified at the code level, never a
  layout-triggering property.
- **Cloudflare Worker gzipped script size**, against the platform's
  3072 KiB free-tier ceiling. Last measured 2026-08-14 at **1520.08 KiB
  gzip (49.5% of the limit, 1551.92 KiB headroom)** — down from ~2.86 MiB
  after moving the RAG embedding index and the OpenGraph image generator
  out of the Worker's own script (see §8).

### 6.2 Accessibility

WCAG 2.1 AA intent: keyboard navigable, visible focus, contrast-checked
dark theme (every color measured against the real background, tested in
`components/palette.test.tsx`), full `prefers-reduced-motion` fade-only
alternative, semantic HTML throughout.

### 6.3 SEO

SSG pages with metadata, OpenGraph card (**generated from content at
build time**, `lib/seo/generate-og-image.ts`, so it can never drift from
actual site content), Twitter card, sitemap, and `Person`/`ProfilePage`
JSON-LD structured data — all derived from one configured origin
(`lib/seo/siteUrl.ts`).

### 6.4 Resilience

The site is fully functional with chat unavailable. The rate limiter
fails **open** if Upstash is unconfigured (never blocks chat entirely);
the analytics beacon fails silently if the database is unreachable.

### 6.5 Privacy

No cookies on the public site (the admin session cookie is scoped to
`/admin` only), no PII collection, no consent banner required by design.
Chat conversations are **never persisted server-side** — the chat route
has no database or analytics-store collaborator at all, regression-guarded
by a dedicated no-persistence test. The footer discloses first-party
analytics and its retention window.

### 6.6 Security

- Secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`,
  `UPSTASH_REDIS_*`, `ADMIN_PASSWORD`) are read only in server code —
  regression-guarded by a test that scans every client-bundled file for
  these names.
- Both public POST endpoints validate/bound their body with Zod and are
  rate-limited.
- A Content-Security-Policy and hardening headers (`X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`,
  `Strict-Transport-Security`) apply to every response. `script-src`/
  `style-src` deliberately allow `'unsafe-inline'` — a nonce-based CSP was
  evaluated and declined, since it would require giving up static
  generation for a marginal gain against this threat model (no
  third-party scripts, all dynamic content rendered as text by React).
- Admin login credentials are compared in constant time and rate-limited
  per IP.

### 6.7 Cost

Deliberately minimal spend surface: static-first rendering, free-tier
Cloudflare Workers (by explicit owner decision, with headroom actively
managed — see §6.1), a cost-efficient LLM tier (`gpt-5.4-mini`, not a
flagship reasoning model), and hard guardrails on the one metered
endpoint (chat — see §7).

### 6.8 Motion library

Framer Motion was selected over GSAP ScrollTrigger via a documented
comparative spike (`openspec/changes/archive/2026-07-19-motion-library-spike/`).
Two lazy-loading boundaries (the `LazyMotion` feature bundle and the chat
panel) keep the heavy client-only cost out of the initial page load.

### 6.9 Mobile parity

As of `mobile-motion-parity` (2026-09-01), the hero laptop and the ambient
particle layer render at **every** viewport width, including mobile — a
prior `sm:`-and-above CSS gate was removed outright on the premise that
current mobile hardware can sustain both. This is a deliberate reversal of
an earlier mobile-perf tradeoff; it is not to be reflexively re-added if a
mobile performance concern surfaces later (existing viewport-derived
levers — the particle-count clamp, thinning the lighting rig — are the
documented first response instead).

---

## 7. RAG chatbot — architecture (as built)

```
Browser widget (ChatWidget / ChatPanel)
   → POST /api/chat
       1. Rate-limit check: 10 msgs / 5 min per IP, 20 msgs per session (Upstash Redis; fails open if unconfigured)
       2. Input validation: 1–500 chars (Zod)
       3. Retrieve: embed query (text-embedding-3-small) → top-7 chunks
          from the static content-derived index (k raised from 5 to 7 after
          a live eval found a relevant chunk crowded out just past k=5)
       4. Generate: gpt-5.4-mini, system prompt + retrieved chunks
       5. Stream tokens back to the browser — nothing persisted server-side
```

- **Retrieval index**: built at `npm run build`'s `prebuild` step
  (`lib/rag/embed.ts` → `lib/rag/index.json`), published as a static asset
  (`public/rag-index.json`) and fetched at request time via the Cloudflare
  Workers Static Assets binding — not bundled into the Worker's own
  script, because the embeddings index (~30% of what the Worker's script
  size would otherwise be) compresses far worse than ordinary JS.
- **Chunking**: content files are split by semantic unit (chapter section,
  project, leadership story, FAQ pair, meta description) with metadata
  (source entity, chapter, URL anchor) enabling citation deep-links.
  Career-chapter chunks carry a generated time/attribution prefix (see §5,
  F3) so retrieval scoring can't collide different eras or lose track of
  which chapter a chunk belongs to.
- **Generation rules**: answer only from provided context; say so and
  suggest an alternative question if the context doesn't cover it; never
  infer or embellish; third-person, warm-professional tone, concise
  (~150 words) with an offer to go deeper; self-identify as **Mar.IA**
  when asked (a defined role); refuse to adopt any other persona
  (including "speak as Jose himself"); treat all user input as untrusted
  data, never as instructions.
- **Guardrails**: per-IP and per-session limits above; max 500-char input;
  bounded output length; conversation memory limited to recent turns,
  in-browser only; a monthly provider-spend alarm is a manual, owner-side
  setup step (not code).
- **Quality gate**: `npm run eval:chat` runs a ~32-question set (5 core
  questions, per-chapter/per-project factuals, off-topic traps, injection
  attempts, plausible-but-uncovered questions) against the live model,
  auto-grading factual/trap/injection results and printing a `shipReady`
  verdict. This is a manual, owner-executed gate before merging any
  prompt or content change — it makes real, billed API calls, so it is
  not part of `npm test`/CI.

---

## 8. Technical architecture (as built)

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), static-first rendering |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` (free tier, by deliberate owner decision) |
| Styling | Tailwind CSS 4 |
| Motion | Framer Motion 12 (`LazyMotion` domAnimation, lazy-loaded) |
| Content | Structured YAML/Markdown files in `/content`, Zod-validated at build time |
| Database | Neon Postgres (serverless driver, no ORM) — analytics events only |
| LLM | OpenAI `gpt-5.4-mini` (generation), `text-embedding-3-small` (embeddings) — model identifiers centralized in `lib/rag/models.ts` |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`), shared by chat, analytics, and admin login |
| Analytics | First-party, cookieless, custom event store (no third-party analytics provider) |
| Language/runtime pinning | TypeScript 5.9.3 (Next 16.2.x build tooling not yet compatible with TS 7) |
| Testing | Vitest 4 (`jsdom` opt-in per component test file), `vitest-axe` for accessibility assertions |

**Two Cloudflare-adapter-specific decisions worth carrying forward:**

1. The static-assets incremental cache must be populated (`npm run
   preview`, or the deploy pipeline's cache-population step) or even
   fully static routes fall through to a live re-render and crash on
   unsupported `node:fs` calls.
2. Next 16's Proxy (`middleware.ts`) is unsupported under this adapter
   (a tracked upstream gap), so `/admin`'s access control is a
   cookie-session Route Handler + Server Component layout, not
   Proxy-based Basic Auth.

**Explicitly not built:** visitor-facing auth/accounts, a CMS, queues, a
multi-provider LLM abstraction beyond the one thin adapter, microservices.
The only auth in the system is owner access to `/admin`; the only database
is the anonymized analytics store.

---

## 9. Data model summary

The database's sole purpose is anonymized visitor analytics — profile
content never lives there. Full detail: `docs/data-model.md`.

- **`VisitSession`** — opaque session id, `startedAt`, `lastEventAt`. No
  identifying data.
- **`AnalyticsEvent`** — the system's single fact table; every dashboard
  report is an aggregation over it. `eventType` enum: `page_view`,
  `section_reach`, `chat_open`, `question_asked`, `resume_download`,
  `contact_click`. `question_asked` has structurally no field for message
  text — anonymity is enforced by schema, not by policy.

---

## 10. Success criteria (as defined in the plan; dashboard now measures them)

1. First impression: unsolicited "best professional site I've seen"
   reactions from ≥3 of 5 test recruiters/peers.
2. Engagement: median session > 2 minutes; ≥40% of visitors reach the
   second career chapter. *(Now directly measurable via `/admin`'s
   Engagement depth report.)*
3. Chatbot: ≥25% of visitors open it; eval set passes at 100% (0
   hallucinations). *(Chat-usage share measurable via `/admin`; the eval
   gate is `npm run eval:chat`.)*
4. Action: résumé downloads + contact clicks + meetings booked
   measurably occur within the first month of sharing. *(Measurable via
   `/admin`'s Conversions report.)*
5. Craft: the accessibility and 60fps/bundle-size budgets in §6 met at
   launch.
6. Cost: total monthly run cost < $50 under normal traffic.

---

## 11. Explicitly out of scope (still true today)

Multi-tenancy and framework generality, dynamic résumé/cover-letter
generation, a job-description analyzer, a blog, multi-language support,
recruiter-facing dashboards, AI interview simulation, persistent chat
history, a CMS, and provider-abstraction layers beyond the one thin LLM
adapter. Nothing from this list is built until it's explicitly re-scoped.

---

## 12. Where to look for more detail

- `docs/PRD.md` — the original planning document and design-principle
  rationale.
- `docs/data-model.md` — full analytics schema and ER diagram.
- `docs/content-authoring-guide.md` — how to add a new career chapter.
- `README.md` — the living engineering log: performance measurements,
  security posture, admin access setup, Cloudflare deployment notes.
- `CLAUDE.md` — architecture decisions and the specific reasoning behind
  each shipped feature, keyed to the OpenSpec change that introduced it.
- `openspec/specs/` — current accepted requirements, one directory per
  capability (e.g. `chat-assistant-identity`, `analytics-event-store`,
  `admin-reports`, `site-ambient-motion`).
- `openspec/changes/archive/` — the full history of how each capability
  was proposed, designed, and verified.
