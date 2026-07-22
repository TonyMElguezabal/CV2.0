import { POST } from "./route.ts";

// These tests only exercise the request-validation path, which fails before
// any client is constructed or any network call is made — safe to run with
// no OPENAI_API_KEY present, no real API cost. The streaming success path is
// verified live via curl (see this change's tasks.md §4), not here.
describe("POST /api/chat validation", () => {
  it("returns 400 for a malformed JSON body, without constructing any client", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for a missing question field", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for an empty question", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for an over-length question", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: "a".repeat(501) }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
