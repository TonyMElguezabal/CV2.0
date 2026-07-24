// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatWidgetProvider, useChatWidget } from "./ChatWidgetContext";
import { ChatPanel } from "./ChatPanel";
import { streamChat, ChatRequestError } from "../lib/chat/streamChat.ts";
import type { ChatStreamEvent } from "../lib/chat/streamChat.ts";
import { track } from "../lib/analytics/track.ts";

vi.mock("../lib/chat/streamChat.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/chat/streamChat.ts")>();
  return {
    ...actual,
    streamChat: vi.fn(),
  };
});

vi.mock("../lib/analytics/track.ts", () => ({ track: vi.fn() }));

const mockStreamChat = vi.mocked(streamChat);

// Mirrors HeroFramer.test.tsx's fake matchMedia harness — see that file's
// comment for why this shape is needed to drive useReducedMotion in tests.
let currentMatches = false;
const changeListeners: Array<(event: { matches: boolean }) => void> = [];
const fakeMediaQueryList = {
  media: "(prefers-reduced-motion)",
  get matches() {
    return currentMatches;
  },
  addEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void
  ) => {
    changeListeners.push(listener);
  },
  removeEventListener: () => {},
  dispatchEvent: () => true,
  onchange: null,
} as unknown as MediaQueryList;

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => fakeMediaQueryList,
  });
});

function setPrefersReducedMotion(matches: boolean) {
  currentMatches = matches;
  changeListeners.forEach((listener) => listener({ matches }));
}

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
const GREETING = "Hi! Test greeting.";

// ChatPanel reads isOpen/closeChat from context itself (no longer via
// props from ChatWidget, which now dynamically imports it — see
// design.md Decision 2). This trigger stands in for ChatWidget's real
// trigger button so these tests can drive isOpen without going through
// the async next/dynamic boundary, keeping every assertion below
// synchronous exactly as before the split.
function TestTrigger() {
  const { openChat } = useChatWidget();
  return (
    <button type="button" onClick={openChat}>
      Ask about Jose
    </button>
  );
}

function renderWidget() {
  render(
    <ChatWidgetProvider>
      <a href="#background">Background link</a>
      <TestTrigger />
      <ChatPanel
        starterQuestions={STARTER_QUESTIONS}
        contact={TEST_CONTACT}
        greeting={GREETING}
      />
    </ChatWidgetProvider>,
  );
}

describe("ChatPanel", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    vi.mocked(track).mockClear();
  });

  it("fires a question_asked tracking event with no argument containing the question text when a question is submitted", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "question_asked" }),
    );
    for (const call of vi.mocked(track).mock.calls) {
      expect(JSON.stringify(call)).not.toContain(FIRST_STARTER_QUESTION);
    }
  });

  it("shows a starter-question button for each configured question on open", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    for (const question of STARTER_QUESTIONS) {
      expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    }
  });

  it("shows the greeting above the starter questions when opened with no messages", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(screen.getByText(GREETING)).toBeInTheDocument();
  });

  it("no longer shows the greeting after the first message is sent", async () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    expect(screen.getByText(GREETING)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    await screen.findByText(FIRST_STARTER_QUESTION);
    expect(screen.queryByText(GREETING)).not.toBeInTheDocument();
  });

  it("still gives the close button focus on open alongside the greeting", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(screen.getByRole("button", { name: /close chat/i })).toHaveFocus();
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

describe("ChatPanel reduced motion", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    vi.mocked(track).mockClear();
  });

  it("applies a y-offset to the panel's entrance animation under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const panel = screen.getByRole("region", { name: /ask about jose/i });
    expect(panel.style.transform).toContain("px");
  });

  it("uses an opacity-only fade with no y-offset under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const panel = screen.getByRole("region", { name: /ask about jose/i });
    expect(panel.style.transform).not.toContain("px");
  });

  it("applies a y-offset to the greeting's entrance under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const greeting = screen.getByTestId("chat-greeting");
    expect(greeting.style.transform).toContain("px");
  });

  it("renders the greeting with no motion (final state) under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const greeting = screen.getByTestId("chat-greeting");
    expect(greeting.style.transform).not.toContain("px");
    expect(greeting.style.opacity).toBe("1");
  });
});
