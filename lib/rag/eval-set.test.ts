import { EVAL_SET } from "./eval-set.ts";

const CORE_QUESTIONS = [
  "Who is Jose?",
  "What problems has he solved?",
  "How does he lead teams?",
  "What technical depth does he possess?",
  "Why should someone hire him?",
];

const CHAPTER_AND_PROJECT_IDS = [
  "oracle",
  "envato",
  "tiempo",
  "tcs-banamex",
  "tcs-bcp",
  "tcs-ge",
  "ibm",
  "adehub",
  "ai-background-removal",
];

describe("EVAL_SET", () => {
  it("contains all 5 PRD §1 core questions verbatim", () => {
    const coreQuestions = EVAL_SET.filter((q) => q.category === "core").map(
      (q) => q.question,
    );
    for (const question of CORE_QUESTIONS) {
      expect(coreQuestions).toContain(question);
    }
  });

  it("has a factual question covering every experience chapter and project", () => {
    const factualSourceIds = EVAL_SET.filter(
      (q) => q.category === "factual",
    ).map((q) => q.sourceId);
    for (const id of CHAPTER_AND_PROJECT_IDS) {
      expect(factualSourceIds).toContain(id);
    }
  });

  it("has at least one trap and one injection question", () => {
    expect(EVAL_SET.some((q) => q.category === "trap")).toBe(true);
    expect(EVAL_SET.some((q) => q.category === "injection")).toBe(true);
  });

  it("gives every question a non-empty id, category, and question text", () => {
    for (const question of EVAL_SET) {
      expect(question.id.length).toBeGreaterThan(0);
      expect(question.category.length).toBeGreaterThan(0);
      expect(question.question.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ids", () => {
    const ids = EVAL_SET.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
