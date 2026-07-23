import { renderToStaticMarkup } from "react-dom/server";
import { ContactSection } from "./ContactSection";
import type { Profile } from "@/lib/content/types.ts";

const FIXTURE: Pick<Profile, "contact" | "links"> = {
  contact: {
    email: "fixture@example.com",
    scheduling: "https://cal.com/fixture",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/fixture",
    github: "https://github.com/fixture",
  },
};

describe("ContactSection — server-rendered (no-JS) output", () => {
  it("renders scheduling, mailto, and LinkedIn links from profile data", () => {
    const html = renderToStaticMarkup(<ContactSection {...FIXTURE} />);

    expect(html).toContain('href="https://cal.com/fixture"');
    expect(html).toContain('href="mailto:fixture@example.com"');
    expect(html).toContain('href="https://www.linkedin.com/in/fixture"');
  });

  it("opens the scheduling link in a new tab without exposing the originating page", () => {
    const html = renderToStaticMarkup(<ContactSection {...FIXTURE} />);

    const schedulingLinkMatch = html.match(
      /<a[^>]*href="https:\/\/cal\.com\/fixture"[^>]*>/
    );
    expect(schedulingLinkMatch).not.toBeNull();
    expect(schedulingLinkMatch![0]).toContain('target="_blank"');
    expect(schedulingLinkMatch![0]).toContain('rel="noopener noreferrer"');
  });

  it("contains no contact form", () => {
    const html = renderToStaticMarkup(<ContactSection {...FIXTURE} />);

    expect(html).not.toMatch(/<form/);
  });

  it("wraps the section with id=\"contact\" as a scroll target", () => {
    const html = renderToStaticMarkup(<ContactSection {...FIXTURE} />);

    expect(html).toMatch(/<section id="contact"/);
  });

  it("annotates each contact link with data-analytics-event and the right data-analytics-target", () => {
    const html = renderToStaticMarkup(<ContactSection {...FIXTURE} />);

    const schedulingLinkMatch = html.match(
      /<a[^>]*href="https:\/\/cal\.com\/fixture"[^>]*>/
    );
    expect(schedulingLinkMatch![0]).toContain('data-analytics-event="contact_click"');
    expect(schedulingLinkMatch![0]).toContain('data-analytics-target="scheduling"');

    const mailtoLinkMatch = html.match(
      /<a[^>]*href="mailto:fixture@example\.com"[^>]*>/
    );
    expect(mailtoLinkMatch![0]).toContain('data-analytics-event="contact_click"');
    expect(mailtoLinkMatch![0]).toContain('data-analytics-target="email"');

    const linkedinLinkMatch = html.match(
      /<a[^>]*href="https:\/\/www\.linkedin\.com\/in\/fixture"[^>]*>/
    );
    expect(linkedinLinkMatch![0]).toContain('data-analytics-event="contact_click"');
    expect(linkedinLinkMatch![0]).toContain('data-analytics-target="linkedin"');
  });
});
