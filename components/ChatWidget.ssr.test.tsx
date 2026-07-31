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
        />
      </ChatWidgetProvider>,
    );

    expect(html).toMatch(/<button[^>]*>Ask about Jose<\/button>/);
  });

  it("exposes a #chat anchor so meta-chunk citations can deep-link to it", () => {
    const html = renderToStaticMarkup(
      <ChatWidgetProvider>
        <ChatWidget
          starterQuestions={["Who is Jose?"]}
          contact={TEST_CONTACT}
          tooltipLabel="chat with me"
          greeting="Hi! Test greeting."
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
        />
      </ChatWidgetProvider>,
    );

    expect(html).not.toContain("Close chat");
    expect(html).not.toContain("Who is Jose?");
  });
});
