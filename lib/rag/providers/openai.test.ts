import { OpenAiProvider } from "./openai.ts";

const createMock = vi.fn();

vi.mock("openai", () => ({
  default: class FakeOpenAI {
    chat = { completions: { create: createMock } };
  },
}));

const REQUEST = {
  systemPrompt: "You are a helpful assistant.",
  context: "Some retrieved context.",
  question: "Who is Jose?",
};

describe("OpenAiProvider — output token cap (PRD §7 guardrail)", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("caps generate() at max_completion_tokens: 400", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: "An answer." } }],
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });
    const provider = new OpenAiProvider("fake-key");

    await provider.generate(REQUEST);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 400 }),
    );
  });

  it("caps generateStream() at max_completion_tokens: 400", async () => {
    createMock.mockResolvedValue((async function* () {})());
    const provider = new OpenAiProvider("fake-key");

    const iterator = provider.generateStream(REQUEST);
    // Drain the generator so the underlying create() call is actually made.
    for await (const _ of iterator) {
      // no-op
    }

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ max_completion_tokens: 400 }),
    );
  });
});
