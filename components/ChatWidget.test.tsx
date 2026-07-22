// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";
import { streamChat, ChatRequestError } from "../lib/chat/streamChat.ts";
import type { ChatStreamEvent } from "../lib/chat/streamChat.ts";

vi.mock("../lib/chat/streamChat.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/chat/streamChat.ts")>();
  return {
    ...actual,
    streamChat: vi.fn(),
  };
});

const mockStreamChat = vi.mocked(streamChat);

async function* eventsOf(events: ChatStreamEvent[]) {
  for (const event of events) {
    yield event;
  }
}

const FIRST_STARTER_QUESTION = "Who is Jose?";
const SECOND_STARTER_QUESTION = "What problems has he solved?";
const STARTER_QUESTIONS = [FIRST_STARTER_QUESTION, SECOND_STARTER_QUESTION];
const TEST_CONTACT = {
  email: "jose.elguezabal@gmail.com",
  scheduling: "https://cal.com/josemunoz",
};

function renderWidget() {
  render(
    <ChatWidgetProvider>
      <a href="#background">Background link</a>
      <ChatWidget starterQuestions={STARTER_QUESTIONS} contact={TEST_CONTACT} />
    </ChatWidgetProvider>,
  );
}

describe("ChatWidget", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
  });

  it("renders the trigger as a real button", () => {
    renderWidget();
    expect(
      screen.getByRole("button", { name: /ask about jose/i }),
    ).toBeInTheDocument();
  });

  it("shows a starter-question button for each configured question on open", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    for (const question of STARTER_QUESTIONS) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    }
  });

  it("submits a selected starter question as a visitor message and calls streamChat with its exact text", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(mockStreamChat).toHaveBeenCalledWith(FIRST_STARTER_QUESTION);
    expect(await screen.findByText(FIRST_STARTER_QUESTION)).toBeInTheDocument();
  });

  it("submits free-text input and enforces a 500 character max length", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const input = screen.getByRole("textbox", { name: /ask a question/i });
    expect(input).toHaveAttribute("maxLength", "500");

    fireEvent.change(input, { target: { value: "Has he led cloud migrations?" } });
    fireEvent.submit(input.closest("form")!);

    expect(mockStreamChat).toHaveBeenCalledWith("Has he led cloud migrations?");
    expect(
      await screen.findByText("Has he led cloud migrations?"),
    ).toBeInTheDocument();
  });

  it("appends streamed tokens to the assistant message as they arrive", async () => {
    mockStreamChat.mockReturnValue(
      eventsOf([
        { type: "token", value: "Jose " },
        { type: "token", value: "is a " },
        { type: "token", value: "Technical Delivery Manager." },
        { type: "done" },
      ]),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(
      await screen.findByText("Jose is a Technical Delivery Manager."),
    ).toBeInTheDocument();
  });

  it("renders the citation list once after the citations event", async () => {
    mockStreamChat.mockReturnValue(
      eventsOf([
        { type: "token", value: "Answer." },
        {
          type: "citations",
          value: [{ source: "faq", chapterId: "faq", anchor: "#faq" }],
        },
        { type: "done" },
      ]),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(await screen.findAllByText("#faq")).toHaveLength(1);
  });

  it("shows one generic inline error message and does not throw when streamChat fails", async () => {
    mockStreamChat.mockReturnValue(
      (async function* () {
        throw new Error("network down");
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION })),
    ).not.toThrow();

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
  });

  it("shows a specific rate-limit message with contact links when streamChat rejects with a 429 ChatRequestError", async () => {
    mockStreamChat.mockReturnValue(
      (async function* () {
        throw new ChatRequestError(429);
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(await screen.findByText(/usage limit/i)).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /email/i }),
    ).toHaveAttribute("href", `mailto:${TEST_CONTACT.email}`);
    expect(
      screen.getByRole("link", { name: /schedul/i }),
    ).toHaveAttribute("href", TEST_CONTACT.scheduling);
  });

  it("still shows the generic message (not the rate-limit or unavailable fallback) for a ChatRequestError with an unrelated status", async () => {
    mockStreamChat.mockReturnValue(
      (async function* () {
        throw new ChatRequestError(500);
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/usage limit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/temporarily unavailable/i)).not.toBeInTheDocument();
  });

  it("shows a specific unavailable message with contact links when streamChat rejects with a 503 ChatRequestError", async () => {
    mockStreamChat.mockReturnValue(
      (async function* () {
        throw new ChatRequestError(503);
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usage limit/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /email/i }),
    ).toHaveAttribute("href", `mailto:${TEST_CONTACT.email}`);
    expect(
      screen.getByRole("link", { name: /schedul/i }),
    ).toHaveAttribute("href", TEST_CONTACT.scheduling);
  });

  it("recovers without a reload: a successful send after a 503 failure works normally", async () => {
    mockStreamChat.mockReturnValueOnce(
      (async function* () {
        throw new ChatRequestError(503);
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();

    mockStreamChat.mockReturnValue(
      eventsOf([{ type: "token", value: "Recovered answer." }, { type: "done" }]),
    );
    const input = screen.getByRole("textbox", { name: /ask a question/i });
    fireEvent.change(input, { target: { value: "Try again?" } });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByText("Recovered answer.")).toBeInTheDocument();
  });

  it("keeps a sibling control usable while chat is failing", async () => {
    mockStreamChat.mockReturnValue(
      (async function* () {
        throw new ChatRequestError(503);
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));
    await screen.findByText(/temporarily unavailable/i);

    const link = screen.getByRole("link", { name: "Background link" });
    expect(link).toBeInTheDocument();
    link.focus();
    expect(link).toHaveFocus();
  });

  it("closes via the close button while a sibling control stays focusable and clickable", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(screen.getByRole("link", { name: "Background link" })).toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close chat/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: /ask about jose/i }),
      ).not.toBeInTheDocument(),
    );
    const link = screen.getByRole("link", { name: "Background link" });
    link.focus();
    expect(link).toHaveFocus();
  });

  it("closes on Escape while a sibling control stays focusable and clickable", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: /ask about jose/i }),
      ).not.toBeInTheDocument(),
    );
    const link = screen.getByRole("link", { name: "Background link" });
    link.focus();
    expect(link).toHaveFocus();
  });
});
