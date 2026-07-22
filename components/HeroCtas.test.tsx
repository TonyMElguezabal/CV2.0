// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroCtas } from "./HeroCtas";
import { ChatWidgetProvider, useChatWidget } from "./ChatWidgetContext";
import type { Profile } from "@/lib/content/types.ts";

const testProfile: Pick<Profile, "contact"> = {
  contact: {
    email: "jose.elguezabal@gmail.com",
    scheduling: "https://cal.com/josemunoz",
  },
};

function renderWithProvider(profile: Pick<Profile, "contact"> = testProfile) {
  return render(
    <ChatWidgetProvider>
      <HeroCtas profile={profile} />
    </ChatWidgetProvider>,
  );
}

describe("HeroCtas", () => {
  it("renders the primary scroll CTA and all three secondary CTAs", () => {
    renderWithProvider();

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
    renderWithProvider();

    const resumeLink = screen.getByRole("link", { name: /download résumé/i });
    expect(resumeLink).toHaveAttribute("href", "/resume.pdf");
    expect(resumeLink).toHaveAttribute("download");
  });

  it("wires Contact to a mailto link built from the profile's contact.email", () => {
    renderWithProvider();

    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute(
      "href",
      "mailto:jose.elguezabal@gmail.com"
    );
  });

  it("uses a different contact.email if the profile prop changes, proving it is not hardcoded", () => {
    renderWithProvider({
      contact: {
        email: "someone-else@example.com",
        scheduling: "https://cal.com/someone-else",
      },
    });

    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute(
      "href",
      "mailto:someone-else@example.com"
    );
  });

  it("renders Ask AI as an enabled button that opens the chat widget", () => {
    function OpenState() {
      const { isOpen } = useChatWidget();
      return <p>chat isOpen: {String(isOpen)}</p>;
    }

    render(
      <ChatWidgetProvider>
        <HeroCtas profile={testProfile} />
        <OpenState />
      </ChatWidgetProvider>,
    );

    const askAiButton = screen.getByRole("button", { name: /ask ai/i });
    expect(askAiButton).toBeEnabled();
    expect(askAiButton).not.toHaveTextContent(/coming soon/i);

    fireEvent.click(askAiButton);
    expect(screen.getByText("chat isOpen: true")).toBeInTheDocument();
  });

  it("wires the primary CTA to the #hero-next in-page anchor", () => {
    renderWithProvider();

    const primaryLink = screen.getByRole("link", { name: /scroll/i });
    expect(primaryLink).toHaveAttribute("href", "#hero-next");
  });
});
