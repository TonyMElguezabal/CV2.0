// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroCtas } from "./HeroCtas";
import { ChatWidgetProvider, useChatWidget } from "./ChatWidgetContext";

function renderWithProvider() {
  return render(
    <ChatWidgetProvider>
      <HeroCtas />
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

  it("wires Contact to the #contact in-page anchor", () => {
    renderWithProvider();

    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toHaveAttribute("href", "#contact");
  });

  it("renders Ask AI as an enabled button that opens the chat widget", () => {
    function OpenState() {
      const { isOpen } = useChatWidget();
      return <p>chat isOpen: {String(isOpen)}</p>;
    }

    render(
      <ChatWidgetProvider>
        <HeroCtas />
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
