import { EVENT_TYPES, EventPayloadSchema } from "./schema.ts";

describe("EVENT_TYPES", () => {
  it("contains exactly the six event types from docs/data-model.md", () => {
    expect([...EVENT_TYPES].sort()).toEqual(
      [
        "page_view",
        "section_reach",
        "chat_open",
        "question_asked",
        "resume_download",
        "contact_click",
      ].sort()
    );
  });
});

describe("EventPayloadSchema", () => {
  it("accepts a minimal valid page_view event", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "page_view",
      pagePath: "/",
    });

    expect(result.success).toBe(true);
  });

  it("requires sectionId for a section_reach event", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      scrollDepthPercent: 40,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid section_reach event with sectionId and scrollDepthPercent", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "oracle",
      scrollDepthPercent: 40,
    });

    expect(result.success).toBe(true);
  });

  it("requires contactTarget to be one of scheduling, email, or linkedin for contact_click", () => {
    const invalid = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "contact_click",
      pagePath: "/",
      contactTarget: "phone",
    });
    expect(invalid.success).toBe(false);

    const missing = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "contact_click",
      pagePath: "/",
    });
    expect(missing.success).toBe(false);

    const valid = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "contact_click",
      pagePath: "/",
      contactTarget: "email",
    });
    expect(valid.success).toBe(true);
  });

  it("bounds scrollDepthPercent to an integer between 0 and 100", () => {
    const tooHigh = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "oracle",
      scrollDepthPercent: 101,
    });
    expect(tooHigh.success).toBe(false);

    const negative = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "oracle",
      scrollDepthPercent: -1,
    });
    expect(negative.success).toBe(false);

    const notInt = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "oracle",
      scrollDepthPercent: 40.5,
    });
    expect(notInt.success).toBe(false);
  });

  it("rejects an unknown eventType", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "page_click",
      pagePath: "/",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an over-long pagePath", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "page_view",
      pagePath: "/" + "a".repeat(2048),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an over-long sectionId", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "section_reach",
      pagePath: "/",
      sectionId: "a".repeat(300),
      scrollDepthPercent: 40,
    });

    expect(result.success).toBe(false);
  });

  it("has no field that accepts question or message text", () => {
    const result = EventPayloadSchema.safeParse({
      sessionId: "abc-123",
      eventType: "question_asked",
      pagePath: "/",
      text: "What is Jose's experience with Kubernetes?",
      question: "What is Jose's experience with Kubernetes?",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("text");
      expect(result.data).not.toHaveProperty("question");
    }
  });
});
