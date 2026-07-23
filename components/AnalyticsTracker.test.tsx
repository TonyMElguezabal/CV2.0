// @vitest-environment jsdom
import { render, cleanup, fireEvent } from "@testing-library/react";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { track } from "../lib/analytics/track.ts";

vi.mock("../lib/analytics/track.ts", () => ({ track: vi.fn() }));

type ObserverCallback = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: ObserverCallback;
  observed: Element[] = [];

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve() {}
  disconnect() {}

  trigger(el: Element, isIntersecting: boolean) {
    this.callback([{ isIntersecting, target: el }]);
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.mocked(track).mockClear();
});

afterEach(() => {
  cleanup();
});

describe("AnalyticsTracker", () => {
  it("fires a page_view event once on mount", () => {
    render(<AnalyticsTracker />);

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "page_view" })
    );
  });

  it("renders nothing visible", () => {
    const { container } = render(<AnalyticsTracker />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fires section_reach with the section id when a section intersects", () => {
    const section = document.createElement("section");
    section.id = "oracle";
    document.body.appendChild(section);

    render(<AnalyticsTracker />);
    const observer = FakeIntersectionObserver.instances[0]!;
    observer.trigger(section, true);

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "section_reach",
        sectionId: "oracle",
      })
    );

    document.body.removeChild(section);
  });

  it("does not fire a duplicate section_reach for the same section", () => {
    const section = document.createElement("section");
    section.id = "contact";
    document.body.appendChild(section);

    render(<AnalyticsTracker />);
    const observer = FakeIntersectionObserver.instances[0]!;
    observer.trigger(section, true);
    observer.trigger(section, true);

    const sectionReachCalls = vi
      .mocked(track)
      .mock.calls.filter(([event]) => event.eventType === "section_reach");
    expect(sectionReachCalls).toHaveLength(1);

    document.body.removeChild(section);
  });

  it("fires a resume_download event when an annotated link is clicked", () => {
    const link = document.createElement("a");
    link.setAttribute("data-analytics-event", "resume_download");
    document.body.appendChild(link);

    render(<AnalyticsTracker />);
    fireEvent.click(link);

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "resume_download" })
    );

    document.body.removeChild(link);
  });

  it("fires a contact_click event with contactTarget when an annotated contact link is clicked", () => {
    const link = document.createElement("a");
    link.setAttribute("data-analytics-event", "contact_click");
    link.setAttribute("data-analytics-target", "email");
    document.body.appendChild(link);

    render(<AnalyticsTracker />);
    fireEvent.click(link);

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "contact_click",
        contactTarget: "email",
      })
    );

    document.body.removeChild(link);
  });

  it("resolves a click on a child node inside an annotated link to the link itself", () => {
    const link = document.createElement("a");
    link.setAttribute("data-analytics-event", "resume_download");
    const icon = document.createElement("span");
    link.appendChild(icon);
    document.body.appendChild(link);

    render(<AnalyticsTracker />);
    fireEvent.click(icon);

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "resume_download" })
    );

    document.body.removeChild(link);
  });

  it("fires nothing for a click on an unannotated element", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);

    render(<AnalyticsTracker />);
    vi.mocked(track).mockClear();
    fireEvent.click(button);

    expect(track).not.toHaveBeenCalled();

    document.body.removeChild(button);
  });
});
