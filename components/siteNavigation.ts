// Single source of truth for the header's section links (SiteHeader.tsx,
// Task Group 2) and the anchor-resolution test that gates it
// (siteNavigation.test.tsx) — the header consumes this array rather than
// hardcoding hrefs, so the two can never drift. Contact is deliberately
// excluded: the header renders it as its own dedicated pill (SiteHeader.tsx
// / design.md Decision 7), not as a fourth nav item — otherwise the header
// would contain two identically-named "Contact" links in the same
// landmark.
export interface SiteNavItem {
  readonly label: string;
  readonly href: string;
}

export const siteNavItems: readonly SiteNavItem[] = [
  { label: "Career", href: "#career" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
];
