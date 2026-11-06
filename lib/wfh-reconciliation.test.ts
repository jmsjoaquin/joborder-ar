import { describe, expect, it } from "vitest";
import { shouldApplyAutomaticWfh } from "./wfh-rules";

describe("shouldApplyAutomaticWfh", () => {
  const friday = new Date("2026-11-06T00:00:00Z");

  it("converts an existing blank Friday weekend to WFH", () => {
    expect(shouldApplyAutomaticWfh({ date: friday, dayStatus: "WEEKEND", target: "", output: "" }, { enabled: true, weekday: 5 })).toBe(true);
  });

  it("converts an existing blank Friday working day to WFH", () => {
    expect(shouldApplyAutomaticWfh({ date: friday, dayStatus: "WORKING", target: "", output: "" }, { enabled: true, weekday: 5 })).toBe(true);
  });

  it("does not replace a manual non-work status", () => {
    expect(shouldApplyAutomaticWfh({ date: friday, dayStatus: "LEAVE", target: "", output: "" }, { enabled: true, weekday: 5 })).toBe(false);
  });

  it("does not apply when automatic WFH is disabled", () => {
    expect(shouldApplyAutomaticWfh({ date: friday, dayStatus: "WEEKEND", target: "", output: "" }, { enabled: false, weekday: 5 })).toBe(false);
  });
});
