import { describe, expect, it } from "vitest";
import { certificationPeriodLabel, formatPositionLabel } from "./services-certification-pdf";

describe("certificationPeriodLabel", () => {
  it("formats a first-half cutoff", () => {
    expect(certificationPeriodLabel({ start: new Date("2026-10-01T00:00:00Z"), end: new Date("2026-10-15T00:00:00Z") })).toBe("October 1-15, 2026");
  });

  it("formats a second-half cutoff", () => {
    expect(certificationPeriodLabel({ start: new Date("2026-10-16T00:00:00Z"), end: new Date("2026-10-31T00:00:00Z") })).toBe("October 16-31, 2026");
  });
});

describe("formatPositionLabel", () => {
  it("uses title case while preserving Roman numerals", () => {
    expect(formatPositionLabel("COMPUTER PROGRAMMER III")).toBe("Computer Programmer III");
  });
});
