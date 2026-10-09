import { renderToStaticMarkup } from "react-dom/server";
import { SocialIcon, SOCIAL_ICON_NAMES } from "./SocialIcons";

describe("SocialIcon — server-rendered output", () => {
  it.each(SOCIAL_ICON_NAMES)("renders %s as a decorative inline SVG", (name) => {
    const html = renderToStaticMarkup(<SocialIcon name={name} />);

    expect(html).toMatch(/^<svg[^>]*>/);
    expect(html).toMatch(/aria-hidden="true"/);
    expect(html).toMatch(/fill="currentColor"/);
    expect(html).toMatch(/<path /);
  });

  it.each(SOCIAL_ICON_NAMES)("gives %s no <title>, so the link owns the accessible name", (name) => {
    const html = renderToStaticMarkup(<SocialIcon name={name} />);

    expect(html).not.toMatch(/<title/);
  });

  it("covers exactly the five footer channels", () => {
    expect([...SOCIAL_ICON_NAMES].sort()).toEqual(
      ["calendar", "envelope", "github", "linkedin", "whatsapp"],
    );
  });
});
