import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./SiteFooter";
import type { Profile } from "@/lib/content/types.ts";

type FooterProps = Pick<Profile, "footer" | "links" | "contact">;

const FIXTURE_FOOTER: FooterProps["footer"] = {
  headline: "Fixture headline for the footer.",
  subline: "Fixture subline for the footer.",
  ctaLabel: "Fixture call to action",
  ctaSubLabel: "Fixture sub-label",
};

const FIXTURE_LINKS: FooterProps["links"] = {
  linkedin: "https://www.linkedin.com/in/fixture",
  github: "https://github.com/fixture",
};

const FIXTURE_CONTACT: FooterProps["contact"] = {
  email: "fixture@example.com",
  scheduling: "https://cal.com/fixture",
};

function renderFooter(overrides: Partial<FooterProps> = {}): string {
  return renderToStaticMarkup(
    <SiteFooter
      footer={FIXTURE_FOOTER}
      links={FIXTURE_LINKS}
      contact={FIXTURE_CONTACT}
      {...overrides}
    />,
  );
}

// Every <a>…</a> in the markup, as its opening tag and its inner HTML.
function anchors(html: string): { open: string; inner: string }[] {
  return [...html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)].map((m) => ({
    open: m[1] ?? "",
    inner: m[2] ?? "",
  }));
}

// The opening tag of the anchor with a given accessible name, or "".
function anchorNamed(html: string, name: string): string {
  const match = anchors(html).find(({ open }) =>
    open.includes(`aria-label="${name}"`),
  );
  return match?.open ?? "";
}

// The opening tag of the anchor carrying a given analytics target, or "".
function anchorWithTarget(html: string, target: string): string {
  const match = anchors(html).find(({ open }) =>
    open.includes(`data-analytics-target="${target}"`),
  );
  return match?.open ?? "";
}

describe("SiteFooter — structure and order (spec site-footer)", () => {
  it("renders exactly one footer landmark", () => {
    const html = renderFooter();

    expect(html.match(/<footer[\s>]/g)).toHaveLength(1);
  });

  it("orders headline, subline, call-to-action, icon row, then disclosure", () => {
    const html = renderFooter();

    const at = (text: string) => html.indexOf(text);
    expect(at("<h2")).toBeGreaterThan(-1);
    expect(at(FIXTURE_FOOTER.headline)).toBeLessThan(at(FIXTURE_FOOTER.subline));
    expect(at(FIXTURE_FOOTER.subline)).toBeLessThan(at(FIXTURE_FOOTER.ctaLabel));
    expect(at(FIXTURE_FOOTER.ctaLabel)).toBeLessThan(at('aria-label="LinkedIn"'));
    expect(at('aria-label="LinkedIn"')).toBeLessThan(at("cookieless"));
  });

  it("renders the headline as an h2 and the subline as body text", () => {
    const html = renderFooter();

    expect(html).toMatch(new RegExp(`<h2[^>]*>${FIXTURE_FOOTER.headline}</h2>`));
    expect(html).toContain(FIXTURE_FOOTER.subline);
  });
});

describe("SiteFooter — analytics disclosure (cookieless-analytics-baseline)", () => {
  it("discloses cookieless analytics and the 180-day retention period", () => {
    const html = renderFooter();

    expect(html).toMatch(/cookieless/i);
    expect(html).toMatch(/no personal data/i);
    expect(html).toMatch(/no cookies/i);
    expect(html).toMatch(/180.day/i);
  });

  it("contains no cookie-consent banner", () => {
    const html = renderFooter();

    expect(html).not.toMatch(/consent/i);
    expect(html).not.toMatch(/accept cookies/i);
  });
});

describe("SiteFooter — primary call-to-action", () => {
  it("is one link to the scheduling page, opened safely, with both labels", () => {
    const html = renderFooter();
    const cta = anchors(html).find(
      ({ open, inner }) =>
        open.includes('href="https://cal.com/fixture"') &&
        inner.includes(FIXTURE_FOOTER.ctaLabel),
    );

    expect(cta).toBeDefined();
    expect(cta!.open).toMatch(/target="_blank"/);
    expect(cta!.open).toMatch(/rel="[^"]*noopener[^"]*noreferrer[^"]*"/);
    expect(cta!.inner).toContain(FIXTURE_FOOTER.ctaSubLabel);
  });

  it("records a scheduling contact_click when activated", () => {
    const cta = anchorWithTarget(renderFooter(), "scheduling");

    expect(cta).toContain('data-analytics-event="contact_click"');
  });
});

describe("SiteFooter — icon links (spec: each channel is a named link)", () => {
  it.each([
    ["linkedin", "LinkedIn", "https://www.linkedin.com/in/fixture"],
    ["github", "GitHub", "https://github.com/fixture"],
    ["scheduling", "Book a meeting", "https://cal.com/fixture"],
  ])("%s link is named %s and points to its destination", (target, name, href) => {
    const link = anchorNamed(renderFooter(), name);
    expect(link).toContain(`data-analytics-target="${target}"`);

    expect(link).toContain(`href="${href}"`);
    expect(link).toContain(`aria-label="${name}"`);
    expect(link).toContain('data-analytics-event="contact_click"');
    expect(link).toMatch(/target="_blank"/);
    expect(link).toMatch(/rel="[^"]*noopener[^"]*noreferrer/);
  });

  it("offers email as a named mailto link", () => {
    const link = anchorWithTarget(renderFooter(), "email");

    expect(link).toContain('href="mailto:fixture@example.com"');
    expect(link).toContain('aria-label="Email Jose"');
  });

  it("links WhatsApp to the server redirect, never to wa.me, nofollow", () => {
    const html = renderFooter();
    const link = anchorWithTarget(html, "whatsapp");

    expect(link).toContain('href="/go/whatsapp"');
    expect(link).toMatch(/rel="[^"]*nofollow[^"]*"/);
    expect(link).toContain('aria-label="WhatsApp"');
    expect(html).not.toMatch(/wa\.me/);
  });

  it("exposes no phone number anywhere in the markup", () => {
    const html = renderFooter();

    expect(html).not.toMatch(/\+\d/);
    expect(html).not.toMatch(/\b\d{8,}\b/);
  });

  it("omits the GitHub icon when no GitHub link is configured", () => {
    const html = renderFooter({ links: { linkedin: FIXTURE_LINKS.linkedin } });

    expect(anchorWithTarget(html, "github")).toBe("");
    expect(html).not.toMatch(/href=""/);
  });

  it("marks every icon glyph decorative, so the link owns the name", () => {
    const html = renderFooter();
    const svgTags = html.match(/<svg[^>]*>/g) ?? [];

    expect(svgTags.length).toBeGreaterThanOrEqual(5);
    for (const svg of svgTags) {
      expect(svg).toMatch(/aria-hidden="true"/);
    }
  });
});
