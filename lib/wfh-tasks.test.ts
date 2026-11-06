import { describe, expect, it } from "vitest";
import { dailyFieldsFromWfhTasks, seedWfhTasks } from "./wfh-tasks";

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
