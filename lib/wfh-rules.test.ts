import { describe, expect, it } from "vitest";
import { automaticDayStatus, formatHours, isCertificationEligible } from "./wfh-rules";

describe("automaticDayStatus", () => {
  it("marks Friday as WFH by default when automatic WFH is enabled", () => {
    expect(automaticDayStatus(new Date("2026-11-06T00:00:00Z"), "NORMAL", { enabled: true, weekday: 5 })).toBe("WFH");
  });

  it("supports a configurable WFH weekday", () => {
    expect(automaticDayStatus(new Date("2026-11-05T00:00:00Z"), "NORMAL", { enabled: true, weekday: 4 })).toBe("WFH");
  });

  it("uses the normal workweek status when automatic WFH is disabled", () => {
    expect(automaticDayStatus(new Date("2026-11-06T00:00:00Z"), "NORMAL", { enabled: false, weekday: 5 })).toBe("WORKING");
  });

  it("lets explicit WFH override a compressed-workweek Friday", () => {
    expect(automaticDayStatus(new Date("2026-11-06T00:00:00Z"), "COMPRESSED", { enabled: true, weekday: 5 })).toBe("WFH");
  });
});

describe("isCertificationEligible", () => {
  const base = { dayStatus: "WFH", includeInServiceCertification: true, wfhHours: 8, output: "Completed deliverables" };

  it("includes completed WFH service", () => expect(isCertificationEligible(base)).toBe(true));
  it("excludes non-WFH service", () => expect(isCertificationEligible({ ...base, dayStatus: "WORKING" })).toBe(false));
  it("excludes unchecked service", () => expect(isCertificationEligible({ ...base, includeInServiceCertification: false })).toBe(false));
  it("excludes zero-hour service", () => expect(isCertificationEligible({ ...base, wfhHours: 0 })).toBe(false));
  it("excludes blank accomplishments", () => expect(isCertificationEligible({ ...base, output: "  " })).toBe(false));
});

describe("formatHours", () => {
  it("omits unnecessary decimal zeroes", () => expect(formatHours(8)).toBe("8"));
  it("keeps fractional hours", () => expect(formatHours(4.5)).toBe("4.5"));
});
