// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatWidgetProvider } from "./ChatWidgetContext";
import { ChatWidget } from "./ChatWidget";
import { streamChat } from "../lib/chat/streamChat.ts";
import type { ChatStreamEvent } from "../lib/chat/streamChat.ts";

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

function renderWidget() {
  render(
    <ChatWidgetProvider>
      <ChatWidget starterQuestions={STARTER_QUESTIONS} contact={TEST_CONTACT} />
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
});
