import { EVAL_SET } from "./eval-set.ts";
import { getExperiences, getProjects, getOrigins } from "../content/read.ts";
import { ACTIVE_LLM_MODEL } from "./active-provider.ts";

const CORE_QUESTIONS = [
  "Who is Jose?",
  "What problems has he solved?",
  "How does he lead teams?",
  "What technical depth does he possess?",
  "Why should someone hire him?",
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

  // Derived from content rather than a hardcoded list
  // (chatbot-era-collision-guard / JOS-116 design.md Decision 7): a
  // hardcoded list degrades silently — a chapter added without updating it
  // is simply never checked, and the gap is invisible in a passing suite.
  // Reading ids from content means a new chapter or project fails this
  // check until an eval question covers it.
  it("has a factual question covering every experience chapter and project", () => {
    const chapterAndProjectIds = [
      ...getExperiences().map((exp) => exp.id),
      ...getProjects().map((project) => project.id),
    ];
    const factualSourceIds = EVAL_SET.filter(
      (q) => q.category === "factual",
    ).map((q) => q.sourceId);
    const uncovered = chapterAndProjectIds.filter(
      (id) => !factualSourceIds.includes(id),
    );
    expect(uncovered, `uncovered chapter/project ids: ${uncovered.join(", ")}`).toEqual(
      [],
    );
  });

  // origins-earlier-career (JOS-115): a separate coverage check, since
  // JOS-116's gate above was scoped to chapters/projects only — origins
  // didn't exist as a content type yet when that gate was written. Same
  // content-derived principle: an origins entry added without an eval
  // question fails this check rather than silently going unchecked.
  it("has a factual question covering every origins entry", () => {
    const originsIds = getOrigins().entries.map((entry) => entry.id);
    const factualSourceIds = EVAL_SET.filter(
      (q) => q.category === "factual",
    ).map((q) => q.sourceId);
    const uncovered = originsIds.filter((id) => !factualSourceIds.includes(id));
    expect(uncovered, `uncovered origins entry ids: ${uncovered.join(", ")}`).toEqual(
      [],
    );
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

  // Corpus-coverage additions (JOS-101 / chatbot-corpus-coverage): proves
  // the tooling/tenure/site-meta gaps this change closes stay closed, per
  // chatbot-eval-and-ship-gate's added requirements.
  it("has a factual question whose expectedSubstrings include a real chapter's technology", () => {
    const experiences = getExperiences();
    const factualQuestions = EVAL_SET.filter((q) => q.category === "factual");
    const covered = factualQuestions.some((q) =>
      experiences.some((exp) =>
        exp.technologies.some((tech) => q.expectedSubstrings?.includes(tech)),
      ),
    );
    expect(covered).toBe(true);
  });

  it("has a factual question whose expectedSubstrings include a real chapter's date year", () => {
    const experiences = getExperiences();
    const factualQuestions = EVAL_SET.filter((q) => q.category === "factual");
    const covered = factualQuestions.some((q) =>
      experiences.some((exp) => {
        const startYear = exp.dates.start.slice(0, 4);
        const endYear = exp.dates.end?.slice(0, 4);
        return q.expectedSubstrings?.some(
          (substring) =>
            substring.includes(startYear) ||
            (endYear !== undefined && substring.includes(endYear)),
        );
      }),
    );
    expect(covered).toBe(true);
  });

  it("has a factual question whose expectedSubstrings include ACTIVE_LLM_MODEL resolved from code, not a hardcoded string", () => {
    const covered = EVAL_SET.some(
      (q) =>
        q.category === "factual" &&
        q.expectedSubstrings?.includes(ACTIVE_LLM_MODEL),
    );
    expect(covered).toBe(true);
  });
});
