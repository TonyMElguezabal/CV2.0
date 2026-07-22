import { OpenAiProvider } from "./providers/openai.ts";
import { createActiveProvider } from "./active-provider.ts";
import type { LlmProvider } from "./adapter.ts";

// These tests only construct clients (no network calls happen until
// .generate() is invoked) — safe to run with a fake key, no API cost.
describe("LlmProvider implementations", () => {
  it("OpenAiProvider conforms to the LlmProvider interface", () => {
    const provider: LlmProvider = new OpenAiProvider("fake-key");
    expect(provider.name).toBe("gpt");
    expect(typeof provider.model).toBe("string");
    expect(typeof provider.generate).toBe("function");
  });
});

describe("createActiveProvider", () => {
  it("returns a provider conforming to the LlmProvider interface", () => {
    const provider = createActiveProvider("fake-key");
    expect(typeof provider.name).toBe("string");
    expect(typeof provider.generate).toBe("function");
  });
});
