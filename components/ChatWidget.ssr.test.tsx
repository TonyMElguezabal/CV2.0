import { renderToStaticMarkup } from "react-dom/server";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";

const TEST_CONTACT = {
  email: "jose.elguezabal@gmail.com",
  scheduling: "https://cal.com/josemunoz",
};

describe("ChatWidget — server-rendered output", () => {
  it("renders the trigger button, closed, without throwing", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget starterQuestions={["Who is Jose?"]} contact={TEST_CONTACT} />
      </ChatWidgetProvider>,
    );

    expect(html).toMatch(/<button[^>]*>Ask about Jose<\/button>/);
  });

  it("does not render the panel content when closed", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget starterQuestions={["Who is Jose?"]} contact={TEST_CONTACT} />
      </ChatWidgetProvider>,
    );

    expect(html).not.toContain("Close chat");
    expect(html).not.toContain("Who is Jose?");
  });
});
