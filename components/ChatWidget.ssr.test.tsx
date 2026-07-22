import { renderToStaticMarkup } from "react-dom/server";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";

describe("ChatWidget — server-rendered output", () => {
  it("renders the trigger button, closed, without throwing", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget starterQuestions={["Who is Jose?"]} />
      </ChatWidgetProvider>,
    );

    expect(html).toMatch(/<button[^>]*>Ask about Jose<\/button>/);
  });

  it("does not render the panel content when closed", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget starterQuestions={["Who is Jose?"]} />
      </ChatWidgetProvider>,
    );

    expect(html).not.toContain("Close chat");
    expect(html).not.toContain("Who is Jose?");
  });
});
