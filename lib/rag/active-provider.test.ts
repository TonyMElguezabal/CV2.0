import { createActiveProvider, ACTIVE_LLM_MODEL } from "./active-provider.ts";

// ACTIVE_LLM_MODEL lets other modules (e.g. content chunking) name the live
// model without importing the provider or its SDK — see design.md in
// openspec/changes/chatbot-corpus-coverage.
describe("ACTIVE_LLM_MODEL", () => {
  it("matches the active provider's own model property", () => {
    const provider = createActiveProvider("fake-key");
    expect(ACTIVE_LLM_MODEL).toBe(provider.model);
  });
});
