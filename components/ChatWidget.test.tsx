// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";
import { streamChat } from "../lib/chat/streamChat.ts";
import type { ChatStreamEvent } from "../lib/chat/streamChat.ts";

vi.mock("../lib/chat/streamChat.ts", () => ({
  streamChat: vi.fn(),
}));

const mockStreamChat = vi.mocked(streamChat);

async function* eventsOf(events: ChatStreamEvent[]) {
  for (const event of events) {
    yield event;
  }
}

const FIRST_STARTER_QUESTION = "Who is Jose?";
const SECOND_STARTER_QUESTION = "What problems has he solved?";
const STARTER_QUESTIONS = [FIRST_STARTER_QUESTION, SECOND_STARTER_QUESTION];

function renderWidget() {
  render(
    <ChatWidgetProvider>
      <a href="#background">Background link</a>
      <ChatWidget starterQuestions={STARTER_QUESTIONS} />
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
