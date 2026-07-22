import { formatSseEvent } from "./sse.ts";

describe("formatSseEvent", () => {
  it("formats an event name and JSON-encoded payload as an SSE frame", () => {
    expect(formatSseEvent("token", "Hello")).toBe(
      'event: token\ndata: "Hello"\n\n',
    );
  });

  it("JSON-encodes object payloads", () => {
    expect(formatSseEvent("citations", [{ anchor: "#envato" }])).toBe(
      'event: citations\ndata: [{"anchor":"#envato"}]\n\n',
    );
  });

  it("supports an empty object payload for a done event", () => {
    expect(formatSseEvent("done", {})).toBe("event: done\ndata: {}\n\n");
  });
});
