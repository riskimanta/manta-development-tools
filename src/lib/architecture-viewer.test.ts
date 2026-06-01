import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_SUMMARY_MAX_LINES,
  isArchitectureSummaryLong,
} from "./architecture-viewer";

describe("isArchitectureSummaryLong", () => {
  it("returns false for empty or short summaries", () => {
    expect(isArchitectureSummaryLong("")).toBe(false);
    expect(isArchitectureSummaryLong("Short overview.")).toBe(false);
  });

  it("returns true when explicit line count exceeds the limit", () => {
    const lines = Array.from(
      { length: ARCHITECTURE_SUMMARY_MAX_LINES + 1 },
      (_, i) => `Line ${i + 1}`,
    ).join("\n");
    expect(isArchitectureSummaryLong(lines)).toBe(true);
  });

  it("returns true for long single-paragraph text", () => {
    const paragraph = "word ".repeat(80);
    expect(isArchitectureSummaryLong(paragraph)).toBe(true);
  });

  it("respects a custom max line threshold", () => {
    expect(isArchitectureSummaryLong("a\nb\nc", 2)).toBe(true);
    expect(isArchitectureSummaryLong("a\nb", 2)).toBe(false);
  });
});
