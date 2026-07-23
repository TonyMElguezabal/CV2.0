// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { ChatWidgetProvider, useChatWidget } from "./ChatWidgetContext";
import { track } from "../lib/analytics/track.ts";

vi.mock("../lib/analytics/track.ts", () => ({ track: vi.fn() }));

function TestConsumer() {
  const { isOpen, openChat, closeChat } = useChatWidget();
  return (
    <div>
      <p>isOpen: {String(isOpen)}</p>
      <button type="button" onClick={openChat}>
        open
      </button>
      <button type="button" onClick={closeChat}>
        close
      </button>
    </div>
  );
}

describe("ChatWidgetContext", () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it("fires a chat_open tracking event when openChat is called", () => {
    render(
      <ChatWidgetProvider>
        <TestConsumer />
      </ChatWidgetProvider>,
    );

    fireEvent.click(screen.getByText("open"));

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "chat_open" }),
    );
  });

  it("starts closed and toggles via openChat/closeChat", () => {
    render(
      <ChatWidgetProvider>
        <TestConsumer />
      </ChatWidgetProvider>,
    );

    expect(screen.getByText("isOpen: false")).toBeInTheDocument();

    fireEvent.click(screen.getByText("open"));
    expect(screen.getByText("isOpen: true")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close"));
    expect(screen.getByText("isOpen: false")).toBeInTheDocument();
  });

  it("throws a clear error when used without a provider", () => {
    const { result } = renderHook(() => {
      try {
        return useChatWidget();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/ChatWidgetProvider/);
  });
});
