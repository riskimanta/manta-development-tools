import { describe, expect, it } from "vitest";

import {
  WORK_PROGRESS_SESSION_SUMMARY_MAX_LENGTH,
  workProgressSessionSummarySaveSchema,
} from "@/lib/validations/work-progress-session-summary";

describe("workProgressSessionSummarySaveSchema", () => {
  it("trims summary text", () => {
    const result = workProgressSessionSummarySaveSchema.safeParse({
      projectId: "proj-1",
      sessionId: "session-a-b",
      summaryMarkdown: "  Saved summary  \n",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summaryMarkdown).toBe("Saved summary");
    }
  });

  it("rejects empty summary after trim", () => {
    const result = workProgressSessionSummarySaveSchema.safeParse({
      projectId: "proj-1",
      sessionId: "session-a-b",
      summaryMarkdown: "   ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.summaryMarkdown).toContain(
        "Summary is required",
      );
    }
  });

  it("rejects overly long summary", () => {
    const result = workProgressSessionSummarySaveSchema.safeParse({
      projectId: "proj-1",
      sessionId: "session-a-b",
      summaryMarkdown: "x".repeat(WORK_PROGRESS_SESSION_SUMMARY_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.summaryMarkdown?.[0]).toMatch(
        /at most/i,
      );
    }
  });

  it("requires project and session identifiers", () => {
    const result = workProgressSessionSummarySaveSchema.safeParse({
      projectId: "",
      sessionId: "",
      summaryMarkdown: "Summary text",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.projectId).toBeDefined();
      expect(fieldErrors.sessionId).toBeDefined();
    }
  });
});
