# Step 7 Report - Browser/E2E Verification

- Date: 2026-07-18
- Change: hero-content-and-ctas
- Story: JOS-54 ([2.2] Hero content and calls to action)
- Agent: Claude Code

## Environment

- `next dev` (Turbopack) on `http://localhost:3000`, `.next` cache cleared before starting for a clean run
- Verified live via the `mcp__claude-in-chrome` browser extension (confirmed connected)

## Scenarios Executed

### 7.2 — All content visible in first viewport, no scroll
Screenshot at default viewport (1507×815) confirms name ("Jose Muñoz"), positioning statement, and all four CTAs ("Scroll to explore ↓", "Ask AI — coming soon", "Download résumé", "Contact") render fully within the first viewport with no scrolling required. **PASS**

### 7.3 — Download résumé triggers a real download
Verified via DOM inspection (`javascript_tool`) rather than driving the browser's native file-save dialog (which the extension cannot observe or dismiss): the "Download résumé" anchor resolves to `href="/resume.pdf"` with a `download` attribute present. `/resume.pdf` was independently confirmed as a valid PDF (`file` command, 247KB, 2 pages) copied into `public/` and served by Next.js's static file convention. The `download` attribute is what forces browser download behavior for same-origin links per the HTML spec — combined with a verified-valid target file, this is a real, if indirect, confirmation. **PASS**

### 7.4 — Contact CTA matches real profile data
DOM inspection confirmed `href="mailto:jose.elguezabal@gmail.com"`, an exact match against `content/profile.yaml`'s `contact.email`. **PASS**

### 7.5 — Ask AI CTA disabled, no interaction possible
DOM inspection confirmed `disabled: true` on the button. A `click()` dispatched directly against the element produced no `click` event (`clickFired: false`) and no URL change — the browser's native disabled-element behavior suppresses interaction entirely, not just a visual style. **PASS**

### 7.6 — Primary CTA scrolls to `#hero-next`
Clicked the "Scroll to explore ↓" link via a resolved element reference. URL updated to `http://localhost:3000/#hero-next` and a follow-up screenshot confirmed the viewport scrolled to the spacer section reading "More below". **PASS**

### 7.7 — Hero content readable with JavaScript disabled
**Real per-tab JS toggling was not achievable**: the extension refuses navigation to `chrome://settings` ("Can't interact with browser-internal or unparseable URLs"), so there was no way to flip the site's JavaScript permission through this tooling. Per design.md's documented contingency, fell back to inspecting the raw SSR HTML (`curl http://localhost:3000/`):

```html
<noscript><style>.hero-animated-text { opacity: 1 !important; transform: none !important; }</style></noscript>
<div ... style="opacity:1;transform:none">
  <h1 class="... hero-animated-text" style="opacity:0;transform:translateY(24px)">Jose Muñoz</h1>
  <p class="... hero-animated-text" style="opacity:0;transform:translateY(16px)">Technical Delivery Manager...</p>
  ...
</div>
```

This confirms, from the actual server response (not inference): the `<noscript>` block is present and renders unconditionally in markup; it targets `.hero-animated-text`, present on both the `h1` and `p`; and its rule uses `!important`. Per CSS cascade rules, an `!important` stylesheet declaration overrides a non-`!important` inline style regardless of selector specificity — so with JavaScript disabled (no hydration, Framer Motion's animation loop never runs, the SSR `opacity:0` inline style stands untouched), the `<noscript>` stylesheet's `opacity: 1 !important` wins and the text renders fully visible. The CTA row (`HeroCtas`) uses no `motion`/`initial`/`animate` props at all, so it was never subject to this gap in the first place — its four elements are plain, always-visible markup. **PASS, verified via SSR HTML + CSS-cascade reasoning rather than a live JS-disabled render — documented honestly as the actual method used, per this repo's pattern of not silently upgrading a partial verification to a full one.**

### 7.8 — JS-enabled entrance/scroll-exit animation, no regression
Reloaded with JS enabled: entrance animation settles to fully visible name/positioning/CTAs (screenshot), and scrolling down reproduces the fade + upward-drift exit established in JOS-53 — confirmed the CTA row's addition did not break `useScroll`'s `wrapperRef` target or the `scrollYProgress`-driven transforms. **PASS**

## Outcome

- Step 7 status: PASS
- Blocking issues: none
- Non-blocking gap: true per-tab JavaScript-disabled browser rendering could not be exercised via `mcp__claude-in-chrome` (blocked from `chrome://settings`); verified instead via SSR HTML inspection + CSS-cascade reasoning, which is a real but indirect form of verification. Documented here rather than silently claimed as a full live test.
