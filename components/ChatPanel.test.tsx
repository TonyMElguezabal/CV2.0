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
    expect(
      screen.queryByTestId("chat-thinking-indicator"),
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByTestId("chat-thinking-indicator"),
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByTestId("chat-thinking-indicator"),
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByTestId("chat-thinking-indicator"),
    ).not.toBeInTheDocument();
  });

  it("shows a thinking indicator after submit while awaiting the first token, then replaces it on first token", async () => {
    let releaseFirstToken: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseFirstToken = resolve;
    });
    mockStreamChat.mockReturnValue(
      (async function* () {
        await gate;
        yield { type: "token", value: "Answer." } as const;
        yield { type: "done" } as const;
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    expect(
      await screen.findByTestId("chat-thinking-indicator"),
    ).toBeInTheDocument();

    releaseFirstToken();

    await screen.findByText("Answer.");
    expect(
      screen.queryByTestId("chat-thinking-indicator"),
    ).not.toBeInTheDocument();
  });

  it("disables the Send control while a request is in flight and re-enables it once the request completes", async () => {
    let releaseDone: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseDone = resolve;
    });
    mockStreamChat.mockReturnValue(
      (async function* () {
        await gate;
        yield { type: "done" } as const;
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const input = screen.getByRole("textbox", { name: /ask a question/i });
    fireEvent.change(input, { target: { value: "Has he led cloud migrations?" } });
    fireEvent.submit(input.closest("form")!);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();

    fireEvent.submit(input.closest("form")!);
    expect(mockStreamChat).toHaveBeenCalledTimes(1);

    releaseDone();

    await waitFor(() => expect(sendButton).not.toBeDisabled());
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

// chatbot-ui-restyle Task Group 4 — the panel's 3D bot render, ported
// from the owner's mockup as a static asset (not inline base64) with its
// saluting-arm animation. jsdom applies framer-motion's `initial`/`animate`
// state synchronously as inline styles even without real animation
// timing (see "ChatPanel reduced motion" below, which relies on the same
// behaviour), so these assertions read `.style` directly rather than
// waiting for any animation frame.
// chatbot-ui-restyle Task Group 5 — the panel title stays task-oriented
// ("Ask about Jose") rather than being replaced by the assistant's name;
// the name is introduced in the greeting instead (design.md Decision 3).
describe("ChatPanel identity", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
  });

  it("keeps the panel title as 'Ask about Jose', not the assistant's name", () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const panel = screen.getByRole("region", { name: /ask about jose/i });
    expect(panel).toHaveTextContent("Ask about Jose");
  });

  // The pronunciation-split construction itself (aria-hidden animated
  // layer + sr-only complete spoken string) is covered by
  // ChatGreetingText.test.tsx — this just confirms ChatPanel actually
  // wires the greeting prop into that component rather than rendering it
  // some other way.
  it("renders the greeting via ChatGreetingText, with the assistant's name announced correctly", () => {
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
    render(
      <ChatWidgetProvider>
        <TestTrigger />
        <ChatPanel
          starterQuestions={STARTER_QUESTIONS}
          contact={TEST_CONTACT}
          greeting="Hi! I'm Mar.IA, nice to meet you."
        />
      </ChatWidgetProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const greeting = screen.getByTestId("chat-greeting");
    expect(greeting.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(greeting.querySelector(".sr-only")?.textContent).toBe(
      "Hi! I'm Maria, nice to meet you.",
    );
  });
});

describe("ChatPanel bot artwork", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
  });

  it("renders the bot body as a static asset, not an inline data: URI", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const body = screen.getByTestId("chat-bot-body");
    expect(body).toHaveAttribute("src", expect.stringMatching(/^\//));
    expect(body.getAttribute("src")).not.toMatch(/^data:/);
  });

  // The arm's rotation is a keyframe array driven over real time by
  // framer-motion; jsdom advances no animation frames, so both motion
  // states legitimately render the same rotate:0 first frame ("none") —
  // there is nothing at t=0 to distinguish them by inline style, the same
  // limitation documented elsewhere for CSS/motion assertions in this
  // codebase (e.g. ImpactSurfaceStyles.ts's className-pinning tests).
  // `data-salute` is our own conditional prop-passing logic, not
  // framer-motion's runtime state, so it is what these two tests actually
  // exercise: whether the looping keyframe animation is wired up at all.
  it("wires up the looping salute animation under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const arm = screen.getByTestId("chat-bot-arm");
    expect(arm).toHaveAttribute("data-salute", "on");
  });

  it("renders the arm at rest with the salute animation disabled under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const arm = screen.getByTestId("chat-bot-arm");
    expect(arm).toHaveAttribute("data-salute", "off");
    expect(arm.style.transform).not.toContain("rotate(115deg)");
  });

  it("hides both bot layers from assistive technology", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(screen.getByTestId("chat-bot-body")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByTestId("chat-bot-arm")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
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

  // The greeting's fade+slide paragraph-level entrance was replaced by a
  // letter-by-letter typing animation (chatbot-ui-restyle Task Group 8,
  // chat-widget-entry-point's MODIFIED "Panel shows an animated greeting
  // on open"). The per-character construction itself is covered by
  // ChatGreetingText.test.tsx; these two just confirm ChatPanel threads
  // its own `useReducedMotion()` result into that component correctly.
  it("starts the greeting's first character unrevealed under default motion settings", () => {
    setPrefersReducedMotion(false);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const greeting = screen.getByTestId("chat-greeting");
    const hiddenLayer = greeting.querySelector('[aria-hidden="true"]');
    const firstChar = hiddenLayer?.firstElementChild as HTMLElement;
    expect(firstChar.style.opacity).toBe("0");
  });

  it("renders the greeting's characters already fully revealed under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    const greeting = screen.getByTestId("chat-greeting");
    const hiddenLayer = greeting.querySelector('[aria-hidden="true"]');
    const firstChar = hiddenLayer?.firstElementChild as HTMLElement;
    expect(firstChar.style.opacity).toBe("1");
  });

  it("renders the thinking indicator's dots in a static form with no looping animation under prefers-reduced-motion", async () => {
    let releaseDone: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseDone = resolve;
    });
    setPrefersReducedMotion(true);
    mockStreamChat.mockReturnValue(
      (async function* () {
        await gate;
        yield { type: "done" } as const;
      })(),
    );
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    fireEvent.click(screen.getByRole("button", { name: FIRST_STARTER_QUESTION }));

    const indicator = await screen.findByTestId("chat-thinking-indicator");
    const dots = indicator.querySelectorAll<HTMLElement>("[aria-hidden] > span");
    expect(dots.length).toBeGreaterThan(0);
    dots.forEach((dot) => {
      expect(dot.className).not.toContain("animate-bounce");
    });

    releaseDone();
  });
});