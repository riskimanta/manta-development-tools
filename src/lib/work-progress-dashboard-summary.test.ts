import { describe, expect, it } from "vitest";

import { buildWorkProgressDashboardSummary } from "@/lib/work-progress-dashboard-summary";
import type { WorkProgressRecord } from "@/services/work-progress";
import type { WorkProgressSessionSummaryRecord } from "@/services/work-progress-session-summaries";

function makeSnapshot(
  overrides: Partial<WorkProgressRecord> & Pick<WorkProgressRecord, "id" | "createdAt">,
): WorkProgressRecord {
  return {
    projectId: "proj-1",
    branch: "main",
    latestCommitHash: "abc1234",
    latestCommitMessage: "feat: example",
    latestCommitAuthor: "Dev",
    latestCommitDate: "2026-06-08T10:00:00.000Z",
    changedFiles: [],
    changedFilesCount: 0,
    gitStatusText: "",
    summary: "main @ abc1234: feat: example (0 changed files)",
    note: null,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

function makeSummary(
  overrides: Partial<WorkProgressSessionSummaryRecord> &
    Pick<WorkProgressSessionSummaryRecord, "sessionId" | "updatedAt">,
): WorkProgressSessionSummaryRecord {
  return {
    id: "summary-1",
    projectId: "proj-1",
    summaryMarkdown: "Saved summary text",
    firstSnapshotId: "wp-1",
    latestSnapshotId: "wp-1",
    branch: "main",
    sessionStartedAt: "2026-06-08T10:00:00.000Z",
    sessionEndedAt: "2026-06-08T10:00:00.000Z",
    createdAt: overrides.updatedAt,
    ...overrides,
  };
}

describe("buildWorkProgressDashboardSummary", () => {
  it("returns zero counts and null latest items when no snapshots exist", () => {
    const summary = buildWorkProgressDashboardSummary([], []);

    expect(summary).toEqual({
      snapshotCount: 0,
      sessionCount: 0,
      sessionsWithSummariesCount: 0,
      latestSnapshotAt: null,
      latestBranch: null,
      latestCommitHash: null,
      latestCommitMessage: null,
      latestChangedFilesCount: 0,
      latestIsClean: true,
      latestSession: null,
      latestSavedSummary: null,
    });
  });

  it("counts snapshots correctly", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
      makeSnapshot({ id: "wp-2", createdAt: "2026-06-08T11:00:00.000Z" }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries);

    expect(summary.snapshotCount).toBe(2);
  });

  it("counts derived sessions correctly", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
      makeSnapshot({ id: "wp-2", createdAt: "2026-06-08T11:00:00.000Z" }),
      makeSnapshot({
        id: "wp-3",
        createdAt: "2026-06-09T10:00:00.000Z",
        branch: "feature/x",
      }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries);

    expect(summary.sessionCount).toBe(2);
  });

  it("counts sessions with saved summaries", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-09T10:00:00.000Z",
        branch: "feature/x",
      }),
    ];
    const sessionOneId = "session-wp-1-wp-1";
    const sessionTwoId = "session-wp-2-wp-2";

    const summary = buildWorkProgressDashboardSummary(entries, [
      makeSummary({
        id: "s-1",
        sessionId: sessionOneId,
        updatedAt: "2026-06-08T12:00:00.000Z",
      }),
      makeSummary({
        id: "s-2",
        sessionId: sessionTwoId,
        updatedAt: "2026-06-09T12:00:00.000Z",
        summaryMarkdown: "Second session summary",
      }),
    ]);

    expect(summary.sessionsWithSummariesCount).toBe(2);
  });

  it("selects the latest snapshot by createdAt", () => {
    const entries = [
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
        branch: "main",
        latestCommitHash: "older",
        latestCommitMessage: "older commit",
      }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-08T12:00:00.000Z",
        branch: "feature/x",
        latestCommitHash: "newer",
        latestCommitMessage: "newer commit",
        changedFilesCount: 2,
        changedFiles: [
          { status: "M", path: "a.ts" },
          { status: "M", path: "b.ts" },
        ],
      }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries);

    expect(summary.latestSnapshotAt).toBe("2026-06-08T12:00:00.000Z");
    expect(summary.latestBranch).toBe("feature/x");
    expect(summary.latestCommitHash).toBe("newer");
    expect(summary.latestCommitMessage).toBe("newer commit");
    expect(summary.latestChangedFilesCount).toBe(2);
    expect(summary.latestIsClean).toBe(false);
  });

  it("selects the latest derived session", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-09T10:00:00.000Z",
        branch: "feature/x",
      }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries);

    expect(summary.latestSession).toMatchObject({
      id: "session-wp-2-wp-2",
      branch: "feature/x",
      snapshotCount: 1,
    });
  });

  it("selects the latest saved summary by updatedAt", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-09T10:00:00.000Z",
        branch: "feature/x",
      }),
    ];
    const olderSessionId = "session-wp-1-wp-1";
    const newerSessionId = "session-wp-2-wp-2";

    const summary = buildWorkProgressDashboardSummary(entries, [
      makeSummary({
        id: "s-1",
        sessionId: olderSessionId,
        updatedAt: "2026-06-08T12:00:00.000Z",
        summaryMarkdown: "Older summary",
      }),
      makeSummary({
        id: "s-2",
        sessionId: newerSessionId,
        updatedAt: "2026-06-09T14:00:00.000Z",
        summaryMarkdown: "Newer summary",
      }),
    ]);

    expect(summary.latestSavedSummary).toEqual({
      sessionId: newerSessionId,
      preview: "Newer summary",
      updatedAt: "2026-06-09T14:00:00.000Z",
    });
  });

  it("does not crash when changed files JSON is invalid", () => {
    const entries = [
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
        changedFiles: [],
        changedFilesCount: 3,
      }),
    ];

    expect(() => buildWorkProgressDashboardSummary(entries)).not.toThrow();
    expect(buildWorkProgressDashboardSummary(entries).latestSession?.isClean).toBe(
      false,
    );
  });

  it("works when snapshots exist but no summaries are saved", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries, []);

    expect(summary.snapshotCount).toBe(1);
    expect(summary.sessionsWithSummariesCount).toBe(0);
    expect(summary.latestSavedSummary).toBeNull();
  });

  it("matches summaries attached to derived session IDs", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
    ];
    const sessionId = "session-wp-1-wp-1";

    const summary = buildWorkProgressDashboardSummary(entries, [
      makeSummary({
        sessionId,
        updatedAt: "2026-06-08T12:00:00.000Z",
        summaryMarkdown: "Attached summary",
      }),
      makeSummary({
        sessionId: "session-missing-missing",
        updatedAt: "2026-06-08T13:00:00.000Z",
        summaryMarkdown: "Orphan summary",
      }),
    ]);

    expect(summary.sessionsWithSummariesCount).toBe(1);
    expect(summary.latestSavedSummary).toEqual({
      sessionId,
      preview: "Attached summary",
      updatedAt: "2026-06-08T12:00:00.000Z",
    });
  });

  it("ignores empty saved summaries", () => {
    const entries = [
      makeSnapshot({ id: "wp-1", createdAt: "2026-06-08T10:00:00.000Z" }),
    ];

    const summary = buildWorkProgressDashboardSummary(entries, [
      makeSummary({
        sessionId: "session-wp-1-wp-1",
        updatedAt: "2026-06-08T12:00:00.000Z",
        summaryMarkdown: "   \n  ",
      }),
    ]);

    expect(summary.sessionsWithSummariesCount).toBe(0);
    expect(summary.latestSavedSummary).toBeNull();
  });
});
