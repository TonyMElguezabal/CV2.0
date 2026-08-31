// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import {
  useIdleInvitation,
  MIN_DELAY_MS,
  MAX_DELAY_MS,
  SESSION_STORAGE_KEY,
} from "./useIdleInvitation";

function setVisibilityState(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    writable: true,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  setVisibilityState("visible");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useIdleInvitation", () => {
  it("schedules the first appearance within the 1-5 minute bound", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useIdleInvitation({ isOpen: false }));

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS - 1);
    });
    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.visible).toBe(true);

    randomSpy.mockRestore();
  });

  it("never schedules past the 5-minute upper bound", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(1);
    const { result } = renderHook(() => useIdleInvitation({ isOpen: false }));

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);

    randomSpy.mockRestore();
  });

  it("reappears on cadence while the chat stays unopened", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useIdleInvitation({ isOpen: false }));

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);
  });

  it("stops scheduling once the chat has been opened", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result, rerender } = renderHook(
      ({ isOpen }) => useIdleInvitation({ isOpen }),
      { initialProps: { isOpen: false } },
    );

    rerender({ isOpen: true });
    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS * 2);
    });
    expect(result.current.visible).toBe(false);
  });

  it("writes the interacted flag to sessionStorage when the chat opens", () => {
    const { rerender } = renderHook(
      ({ isOpen }) => useIdleInvitation({ isOpen }),
      { initialProps: { isOpen: false } },
    );

    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    rerender({ isOpen: true });
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe("true");
  });

  it("does not schedule any appearance on mount if the session already recorded an interaction", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useIdleInvitation({ isOpen: false }));

    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS * 2);
    });
    expect(result.current.visible).toBe(false);
  });

  it("clears the pending timer on unmount", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = renderHook(() => useIdleInvitation({ isOpen: false }));

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("does not show while the document is hidden, and resumes the cadence once visible again", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useIdleInvitation({ isOpen: false }));

    setVisibilityState("hidden");
    act(() => {
      vi.advanceTimersByTime(MAX_DELAY_MS * 2);
    });
    expect(result.current.visible).toBe(false);

    setVisibilityState("visible");
    act(() => {
      vi.advanceTimersByTime(MIN_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);
  });
});
