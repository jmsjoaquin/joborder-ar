import { describe, expect, it } from "vitest";
import { dailyFieldsFromWfhTasks, parseWfhAccomplishmentPaste, seedWfhTasks } from "./wfh-tasks";

describe("seedWfhTasks", () => {
  it("seeds one structured row from an existing daily entry", () => {
    expect(seedWfhTasks({ target: "Research Redis", output: "Researched Redis", perspective: "Excellent Process" })).toEqual([
      { perspective: "Excellent Process", target: "Research Redis", accomplished: "Researched Redis", notes: "", sortOrder: 0 },
    ]);
  });

  it("starts with a blank row when the daily entry is empty", () => {
    expect(seedWfhTasks({ target: "", output: "", perspective: "Excellent Process" })[0]).toMatchObject({ target: "", accomplished: "" });
  });
});

describe("dailyFieldsFromWfhTasks", () => {
  it("keeps one task unchanged for Annex C", () => {
    expect(dailyFieldsFromWfhTasks([{ perspective: "Excellent Process", target: "Research Redis", accomplished: "Researched Redis", notes: "" }])).toEqual({ target: "Research Redis", output: "Researched Redis" });
  });

  it("combines multiple rows without losing their pairing", () => {
    expect(dailyFieldsFromWfhTasks([
      { perspective: "Excellent Process", target: "Attend Scrum", accomplished: "Attended Scrum", notes: "" },
      { perspective: "Excellent Process", target: "Develop cache", accomplished: "Developed cache", notes: "" },
    ])).toEqual({ target: "Attend Scrum\nDevelop cache", output: "Attended Scrum\nDeveloped cache" });
  });
});

describe("parseWfhAccomplishmentPaste", () => {
  it("ignores the employee/date header and creates one task per bullet", () => {
    const pasted = `James Matthew B. Joaquin
WFH (11/06/26)

- Attended the FIST Scrum meeting to discuss ongoing development activities.

- Developed and prepared PAM Historical Beginning Balance preloading scripts.`;
    expect(parseWfhAccomplishmentPaste(pasted, "Excellent Process")).toEqual([
      { perspective: "Excellent Process", target: "Attend the FIST Scrum meeting to discuss ongoing development activities.", accomplished: "Attended the FIST Scrum meeting to discuss ongoing development activities.", notes: "" },
      { perspective: "Excellent Process", target: "Develop and prepare PAM Historical Beginning Balance preloading scripts.", accomplished: "Developed and prepared PAM Historical Beginning Balance preloading scripts.", notes: "" },
    ]);
  });

  it("preserves multiline bullet content", () => {
    const pasted = "- Developed a script.\n  Added validation details.";
    expect(parseWfhAccomplishmentPaste(pasted, "Excellent Process")[0].accomplished).toBe("Developed a script.\n  Added validation details.");
  });

  it("does not rewrite internal coordinated verbs when the opening verb is unsupported", () => {
    const pasted = "- Fixed a defect and prepared a report.";
    expect(parseWfhAccomplishmentPaste(pasted, "Excellent Process")[0].target).toBe("Fixed a defect and prepared a report.");
  });

  it("turns common past-tense accomplishment openings into target wording", () => {
    const pasted = `- Assessed TFI-provided SQL queries.\n- Researched Redis caching.\n- Completed validation.`;
    expect(parseWfhAccomplishmentPaste(pasted, "Excellent Process").map((task) => task.target)).toEqual([
      "Assess TFI-provided SQL queries.",
      "Research Redis caching.",
      "Complete validation.",
    ]);
  });
});
