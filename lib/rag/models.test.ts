import { OPENAI_MODEL, EMBEDDING_MODEL } from "./models.ts";

// Single source of truth for model identifiers (PRD §8's provider-swap
// constraint) — see design.md in openspec/changes/chatbot-corpus-coverage.
describe("model constants", () => {
  it("exports a non-empty OPENAI_MODEL identifier", () => {
    expect(typeof OPENAI_MODEL).toBe("string");
    expect(OPENAI_MODEL.length).toBeGreaterThan(0);
  });

  it("exports a non-empty EMBEDDING_MODEL identifier", () => {
    expect(typeof EMBEDDING_MODEL).toBe("string");
    expect(EMBEDDING_MODEL.length).toBeGreaterThan(0);
  });
});
