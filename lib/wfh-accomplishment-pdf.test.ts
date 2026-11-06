import { describe, expect, it } from "vitest";
import { groupPerspectiveRows } from "./wfh-accomplishment-pdf";

describe("groupPerspectiveRows", () => {
  it("merges consecutive rows with the same BSC perspective", () => {
    expect(groupPerspectiveRows([
      { perspective: "Excellent Process", height: 40 },
      { perspective: "Excellent Process", height: 55 },
      { perspective: "Excellent Process", height: 30 },
    ])).toEqual([{ perspective: "Excellent Process", startIndex: 0, rowCount: 3, height: 125 }]);
  });

  it("starts a new merged cell when the perspective changes", () => {
    expect(groupPerspectiveRows([
      { perspective: "Excellent Process", height: 40 },
      { perspective: "Customer", height: 50 },
      { perspective: "Customer", height: 30 },
    ])).toEqual([
      { perspective: "Excellent Process", startIndex: 0, rowCount: 1, height: 40 },
      { perspective: "Customer", startIndex: 1, rowCount: 2, height: 80 },
    ]);
  });
});
