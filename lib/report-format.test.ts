import { describe, expect, it } from "vitest";
import { isMeetingReportItem, outputAsBulletedList, splitReportItems } from "./report-format";

describe("splitReportItems", () => {
  it("separates newline-delimited tasks and removes existing markers", () => {
    expect(splitReportItems("Attend scrum\n- Assess SQL\n3. Develop scripts")).toEqual([
      "Attend scrum",
      "Assess SQL",
      "Develop scripts",
    ]);
  });

  it("ignores blank lines", () => {
    expect(splitReportItems("First task\n\nSecond task\n")).toEqual(["First task", "Second task"]);
  });
});

describe("outputAsBulletedList", () => {
  it("adds exactly one bullet to every output item", () => {
    expect(outputAsBulletedList("- Completed one\n• Completed two")).toBe("• Completed one\n• Completed two");
  });
});

describe("isMeetingReportItem", () => {
  it("identifies meeting, scrum, and stand-up rows", () => {
    expect(isMeetingReportItem("Attend the FIST Scrum meeting")).toBe(true);
    expect(isMeetingReportItem("Daily stand-up with the team")).toBe(true);
  });

  it("keeps development rows eligible for a status", () => {
    expect(isMeetingReportItem("Developed the preloading scripts")).toBe(false);
  });
});
