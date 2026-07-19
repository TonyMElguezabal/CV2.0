// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { HeroCtas } from "./HeroCtas";
import type { Profile } from "@/lib/content/types.ts";

const testProfile: Pick<Profile, "contact"> = {
  contact: {
    email: "jose.elguezabal@gmail.com",
    scheduling: "https://cal.com/josemunoz",
  },
};

describe("HeroCtas", () => {
  it("renders the primary scroll CTA and all three secondary CTAs", () => {
    render(<HeroCtas profile={testProfile} />);

    expect(screen.getByRole("link", { name: /scroll/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ask ai/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /download résumé/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  it("wires Download résumé to the real static PDF with a download attribute", () => {
    render(<HeroCtas profile={testProfile} />);

    const resumeLink = screen.getByRole("link", { name: /download résumé/i });
    expect(resumeLink).toHaveAttribute("href", "/resume.pdf");
    expect(resumeLink).toHaveAttribute("download");
  });

  it("wires Contact to a mailto link built from the profile's contact.email", () => {
    render(<HeroCtas profile={testProfile} />);

    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute(
      "href",
      "mailto:jose.elguezabal@gmail.com"
    );
  });

  it("uses a different contact.email if the profile prop changes, proving it is not hardcoded", () => {
    render(
      <HeroCtas
        profile={{
          contact: {
            email: "someone-else@example.com",
            scheduling: "https://cal.com/someone-else",
          },
        }}
      />
    );

    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute(
      "href",
      "mailto:someone-else@example.com"
    );
  });

  it("renders Ask AI as a disabled button indicating it is not yet available", () => {
    render(<HeroCtas profile={testProfile} />);

    const askAiButton = screen.getByRole("button", { name: /ask ai/i });
    expect(askAiButton).toBeDisabled();
    expect(askAiButton).toHaveTextContent(/coming soon/i);
  });

  it("wires the primary CTA to the #hero-next in-page anchor", () => {
    render(<HeroCtas profile={testProfile} />);

    const primaryLink = screen.getByRole("link", { name: /scroll/i });
    expect(primaryLink).toHaveAttribute("href", "#hero-next");
  });
});
