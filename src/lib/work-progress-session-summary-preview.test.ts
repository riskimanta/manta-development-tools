import { describe, expect, it } from "vitest";

import {
  buildWorkProgressSessionSummaryPreview,
  WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH,
} from "@/lib/work-progress-session-summary-preview";

describe("buildWorkProgressSessionSummaryPreview", () => {
  it("trims whitespace", () => {
    expect(buildWorkProgressSessionSummaryPreview("  hello world  ")).toBe(
      "hello world",
    );
  });

  it("collapses newlines and repeated whitespace", () => {
    expect(
      buildWorkProgressSessionSummaryPreview("line one\n\nline two\t\tline three"),
    ).toBe("line one line two line three");
  });

  it("truncates long text with an ellipsis", () => {
    const longText = "a".repeat(WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH + 20);
    const preview = buildWorkProgressSessionSummaryPreview(longText);

    expect(preview).toHaveLength(WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH + 1);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.startsWith("a".repeat(WORK_PROGRESS_SESSION_SUMMARY_PREVIEW_MAX_LENGTH))).toBe(
      true,
    );
  });

  it("does not truncate short text", () => {
    const text = "Implemented and verified Work Progress session summary save flow.";
    expect(buildWorkProgressSessionSummaryPreview(text)).toBe(text);
  });

  it("handles empty and null input safely", () => {
    expect(buildWorkProgressSessionSummaryPreview("")).toBe("");
    expect(buildWorkProgressSessionSummaryPreview("   \n\t  ")).toBe("");
    expect(buildWorkProgressSessionSummaryPreview(null)).toBe("");
    expect(buildWorkProgressSessionSummaryPreview(undefined)).toBe("");
  });

  it("returns deterministic output", () => {
    const input = "  What changed:\n\nAdded manual AI summary persistence.  ";
    const first = buildWorkProgressSessionSummaryPreview(input);
    const second = buildWorkProgressSessionSummaryPreview(input);

    expect(first).toBe("What changed: Added manual AI summary persistence.");
    expect(second).toBe(first);
  });
});
