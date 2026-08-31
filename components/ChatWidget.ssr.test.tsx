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
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={TEST_CONTACT}
          tooltipLabel="chat with me"
          greeting="Hi! Test greeting."
          idleInvitation="Hi! I am Mar.IA"
        />
      </ChatWidgetProvider>,
    );

    // chatbot-ui-restyle Task Group 3: the trigger is icon-only now — its
    // accessible name comes from aria-label rather than visible text.
    expect(html).toMatch(/<button[^>]*aria-label="Ask about Jose"[^>]*>/);
  });

  it("exposes a #chat anchor so meta-chunk citations can deep-link to it", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={TEST_CONTACT}
          tooltipLabel="chat with me"
          greeting="Hi! Test greeting."
          idleInvitation="Hi! I am Mar.IA"
        />
      </ChatWidgetProvider>,
    );

    expect(html).toMatch(/<div[^>]*\bid="chat"/);
  });

  it("does not render the panel content when closed", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={TEST_CONTACT}
          tooltipLabel="chat with me"
          greeting="Hi! Test greeting."
          idleInvitation="Hi! I am Mar.IA"
        />
      </ChatWidgetProvider>,
    );

    expect(html).not.toContain("Close chat");
    expect(html).not.toContain("Who is Jose?");
  });
});
