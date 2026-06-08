import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  upsertWorkProgressSessionSummary,
  WorkProgressSessionSummaryServiceError,
} from "@/services/work-progress-session-summaries";

import { saveWorkProgressSessionSummaryAction } from "./actions";

vi.mock("@/services/work-progress-session-summaries", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/services/work-progress-session-summaries")
    >();
  return {
    ...actual,
    upsertWorkProgressSessionSummary: vi.fn(),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function validSummaryForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("projectId", "proj-1");
  formData.set("sessionId", "session-wp-1-wp-1");
  formData.set("summaryMarkdown", "Saved AI summary");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("saveWorkProgressSessionSummaryAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns successful save result shape", async () => {
    vi.mocked(upsertWorkProgressSessionSummary).mockResolvedValue({
      id: "summary-1",
      projectId: "proj-1",
      sessionId: "session-wp-1-wp-1",
      summaryMarkdown: "Saved AI summary",
      firstSnapshotId: "wp-1",
      latestSnapshotId: "wp-1",
      branch: "main",
      sessionStartedAt: "2026-06-07T04:00:00.000Z",
      sessionEndedAt: "2026-06-07T04:00:00.000Z",
      createdAt: "2026-06-08T04:00:00.000Z",
      updatedAt: "2026-06-08T05:00:00.000Z",
    });

    const result = await saveWorkProgressSessionSummaryAction(
      undefined,
      validSummaryForm(),
    );

    expect(upsertWorkProgressSessionSummary).toHaveBeenCalledWith({
      projectId: "proj-1",
      sessionId: "session-wp-1-wp-1",
      summaryMarkdown: "Saved AI summary",
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/projects/proj-1/work-progress/sessions/session-wp-1-wp-1",
    );
    expect(result).toEqual({
      ok: true,
      message: "AI summary saved",
    });
  });

  it("returns invalid input result shape for empty summary", async () => {
    const result = await saveWorkProgressSessionSummaryAction(
      undefined,
      validSummaryForm({ summaryMarkdown: "   " }),
    );

    expect(result.fieldErrors?.summaryMarkdown).toBeDefined();
    expect(upsertWorkProgressSessionSummary).not.toHaveBeenCalled();
  });

  it("returns user-friendly message when session is missing", async () => {
    vi.mocked(upsertWorkProgressSessionSummary).mockRejectedValue(
      new WorkProgressSessionSummaryServiceError(
        "SESSION_NOT_FOUND",
        "Work progress session not found",
      ),
    );

    const result = await saveWorkProgressSessionSummaryAction(
      undefined,
      validSummaryForm(),
    );

    expect(result).toEqual({
      message: "Work progress session not found",
    });
  });
});
