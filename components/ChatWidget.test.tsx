// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";
import { streamChat } from "../lib/chat/streamChat.ts";
import type { ChatStreamEvent } from "../lib/chat/streamChat.ts";
import { MIN_DELAY_MS, SESSION_STORAGE_KEY } from "./useIdleInvitation";

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

async function* eventsOf(events: ChatStreamEvent[]) {
  for (const event of events) {
    yield event;
  }
}

const STARTER_QUESTIONS = ["Who is Jose?"];
const TEST_CONTACT = {
  email: "jose.elguezabal@gmail.com",
  scheduling: "https://cal.com/josemunoz",
};
const TOOLTIP_LABEL = "chat with me";
const GREETING = "Hi! Test greeting.";
const IDLE_INVITATION = "Hi! I am Mar.IA";

// Mirrors ChatPanel.test.tsx's fake matchMedia harness — needed here too
// once the idle bubble's entrance uses useReducedMotion.
let currentMatches = false;
const changeListeners: Array<(event: { matches: boolean }) => void> = [];
const fakeMediaQueryList = {
  media: "(prefers-reduced-motion)",
  get matches() {
    return currentMatches;
  },
  addEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void,
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

function renderWidget() {
  render(
    <ChatWidgetProvider>
      <ChatWidget
        starterQuestions={STARTER_QUESTIONS}
        contact={TEST_CONTACT}
        tooltipLabel={TOOLTIP_LABEL}
        greeting={GREETING}
        idleInvitation={IDLE_INVITATION}
      />
    </ChatWidgetProvider>,
  );
}

describe("ChatWidget", () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    mockStreamChat.mockReturnValue(eventsOf([{ type: "done" }]));
  });

  it("renders the trigger as a real button", () => {
    renderWidget();
    expect(
      screen.getByRole("button", { name: /ask about jose/i }),
    ).toBeInTheDocument();
  });

  it("does not render the chat panel before it has ever been opened", () => {
    renderWidget();
    expect(
      screen.queryByRole("region", { name: /ask about jose/i }),
    ).not.toBeInTheDocument();
  });

  it("loads and shows the panel after the trigger is clicked (dynamic import)", async () => {
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));

    expect(
      await screen.findByRole("region", { name: /ask about jose/i }),
    ).toBeInTheDocument();
  });

  it("toggles aria-expanded on the trigger to reflect open state", async () => {
    renderWidget();
    const trigger = screen.getByRole("button", { name: /ask about jose/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    await screen.findByRole("region", { name: /ask about jose/i });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("returns focus to the trigger after the panel closes", async () => {
    renderWidget();
    const trigger = screen.getByRole("button", { name: /ask about jose/i });
    fireEvent.click(trigger);
    await screen.findByRole("region", { name: /ask about jose/i });

    fireEvent.click(screen.getByRole("button", { name: /close chat/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: /ask about jose/i }),
      ).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("renders a decorative tooltip (robot + label) revealed on hover/focus while the panel is closed", () => {
    renderWidget();

    const tooltip = screen.getByTestId("chat-tooltip");
    expect(tooltip).toHaveAttribute("aria-hidden", "true");
    expect(tooltip.textContent).toContain(TOOLTIP_LABEL);
    expect(tooltip.className).toEqual(
      expect.stringContaining("group-hover:opacity-100"),
    );
    expect(tooltip.className).toEqual(
      expect.stringContaining("group-focus-within:opacity-100"),
    );
  });

  it("keeps the trigger's accessible name unaffected by the tooltip", () => {
    renderWidget();
    expect(
      screen.getByRole("button", { name: /ask about jose/i }),
    ).toBeInTheDocument();
  });

  it("hides the tooltip while the panel is open", async () => {
    renderWidget();
    expect(screen.getByTestId("chat-tooltip")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    await screen.findByRole("region", { name: /ask about jose/i });

    expect(screen.queryByTestId("chat-tooltip")).not.toBeInTheDocument();
  });

  // chatbot-ui-restyle Task Group 3 — the trigger becomes icon-only (the
  // 3D bot render on a filled --accent disc) while keeping its accessible
  // name via an explicit aria-label, since removing the visible text
  // removes the button's implicit accessible name too (WCAG 4.1.2).
  it("renders no visible text on the trigger — the accessible name comes from aria-label alone", () => {
    renderWidget();
    const trigger = screen.getByRole("button", { name: /ask about jose/i });
    expect(trigger).toHaveAttribute("aria-label", "Ask about Jose");
    expect(trigger.textContent?.trim()).toBe("");
  });

  it("hides the trigger's bot artwork from assistive technology", () => {
    renderWidget();
    const trigger = screen.getByRole("button", { name: /ask about jose/i });
    const artwork = trigger.querySelector("img");
    expect(artwork).not.toBeNull();
    expect(artwork).toHaveAttribute("aria-hidden", "true");
  });

  // Regression guard, not new behaviour: the owner asked to keep the
  // tooltip's existing 🤖 emoji exactly as-is (design.md Decision 2's
  // correction) — this must stay true through the trigger restyle.
  it("keeps the tooltip's existing robot emoji unchanged by the trigger restyle", () => {
    renderWidget();
    const tooltip = screen.getByTestId("chat-tooltip");
    expect(tooltip.textContent).toContain("🤖");
    expect(tooltip.textContent).toContain(TOOLTIP_LABEL);
  });
});

// chatbot-ui-restyle Task Group 7 — the idle invitation bubble.
describe("ChatWidget idle invitation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    setPrefersReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the invitation bubble after the idle delay, with content-sourced copy", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderWidget();

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });

    expect(screen.getByTestId("chat-idle-bubble")).toHaveTextContent(
      "Hi! I am",
    );
  });

  it("never moves keyboard focus when the invitation appears", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderWidget();

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });

    expect(screen.getByTestId("chat-idle-bubble")).toBeInTheDocument();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("dismisses the invitation via its close control", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderWidget();

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    expect(screen.getByTestId("chat-idle-bubble")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /dismiss/i }),
    );
    expect(screen.queryByTestId("chat-idle-bubble")).not.toBeInTheDocument();
  });

  it("stops showing the invitation once the chat is opened, and records the interaction", async () => {
    // Real timers for the dynamic-import open (screen.findByRole polls
    // internally and deadlocks under fake timers); switch to fake timers
    // only for the idle-cadence assertion that follows.
    vi.useRealTimers();
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: /ask about jose/i }));
    await screen.findByRole("region", { name: /ask about jose/i });

    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS * 10);
    });

    expect(screen.queryByTestId("chat-idle-bubble")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe("true");
  });

  it("renders with no entrance animation under prefers-reduced-motion", () => {
    setPrefersReducedMotion(true);
    vi.spyOn(Math, "random").mockReturnValue(0);
    renderWidget();

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });

    const bubble = screen.getByTestId("chat-idle-bubble");
    expect(bubble.style.opacity).toBe("1");
  });
});
