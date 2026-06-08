import { describe, expect, it } from "vitest";

import {
  aggregateSessionChangedFiles,
  getLatestWorkProgressSession,
  groupWorkProgressIntoSessions,
  isWorkProgressSnapshotClean,
  parseWorkProgressChangedFilesJson,
  workProgressStatusLabel,
} from "@/lib/work-progress-session";
import type { WorkProgressRecord } from "@/services/work-progress";

function makeSnapshot(
  overrides: Partial<WorkProgressRecord> & Pick<WorkProgressRecord, "id" | "createdAt">,
): WorkProgressRecord {
  return {
    projectId: "proj-1",
    branch: "main",
    latestCommitHash: "abc1234",
    latestCommitMessage: "feat: example",
    latestCommitAuthor: "Dev",
    latestCommitDate: overrides.createdAt,
    changedFiles: [],
    changedFilesCount: 0,
    gitStatusText: "",
    summary: "main @ abc1234: feat: example (clean working tree)",
    note: null,
    updatedAt: overrides.createdAt,
    ...overrides,
  };
}

describe("groupWorkProgressIntoSessions", () => {
  it("returns empty sessions for empty entries", () => {
    expect(groupWorkProgressIntoSessions([])).toEqual([]);
  });

  it("creates one session for a single snapshot", () => {
    const snapshot = makeSnapshot({
      id: "wp-1",
      createdAt: "2026-06-08T10:00:00.000Z",
    });

    const sessions = groupWorkProgressIntoSessions([snapshot]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.snapshotCount).toBe(1);
    expect(sessions[0]?.id).toBe("session-wp-1-wp-1");
    expect(sessions[0]?.durationMs).toBe(0);
  });

  it("groups snapshots within the gap threshold on the same branch", () => {
    const sessions = groupWorkProgressIntoSessions([
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
      }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-08T10:30:00.000Z",
      }),
    ]);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.snapshotCount).toBe(2);
    expect(sessions[0]?.durationMs).toBe(30 * 60 * 1000);
  });

  it("starts a new session when the time gap exceeds the threshold", () => {
    const sessions = groupWorkProgressIntoSessions([
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
      }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-08T12:00:00.000Z",
      }),
    ]);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.firstSnapshotId).toBe("wp-2");
    expect(sessions[1]?.firstSnapshotId).toBe("wp-1");
  });

  it("starts a new session when the branch changes", () => {
    const sessions = groupWorkProgressIntoSessions([
      makeSnapshot({
        id: "wp-1",
        branch: "main",
        createdAt: "2026-06-08T10:00:00.000Z",
      }),
      makeSnapshot({
        id: "wp-2",
        branch: "feat/session-view",
        createdAt: "2026-06-08T10:15:00.000Z",
      }),
    ]);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.branch).toBe("feat/session-view");
    expect(sessions[1]?.branch).toBe("main");
  });
});

describe("aggregateSessionChangedFiles", () => {
  it("dedupes changed files by path and keeps the latest status", () => {
    const files = aggregateSessionChangedFiles([
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
        changedFiles: [{ status: "M", path: "RESULT.md" }],
        changedFilesCount: 1,
      }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-08T10:30:00.000Z",
        changedFiles: [
          { status: "M", path: "RESULT.md" },
          { status: "??", path: "temp.txt" },
        ],
        changedFilesCount: 2,
      }),
    ]);

    expect(files).toEqual([
      { status: "M", path: "RESULT.md" },
      { status: "??", path: "temp.txt" },
    ]);
  });
});

describe("parseWorkProgressChangedFilesJson", () => {
  it("returns empty array for invalid JSON", () => {
    expect(parseWorkProgressChangedFilesJson("not-json")).toEqual([]);
  });

  it("parses valid changed file JSON", () => {
    expect(
      parseWorkProgressChangedFilesJson(
        JSON.stringify([{ status: "M", path: "src/app/page.tsx" }]),
      ),
    ).toEqual([{ status: "M", path: "src/app/page.tsx" }]);
  });
});

describe("status helpers", () => {
  it("detects clean snapshots", () => {
    expect(
      isWorkProgressSnapshotClean({
        changedFilesCount: 0,
        gitStatusText: "",
      }),
    ).toBe(true);
  });

  it("labels clean and dirty status", () => {
    expect(workProgressStatusLabel(true)).toBe("Clean working tree");
    expect(workProgressStatusLabel(false)).toBe("Dirty working tree");
  });
});

describe("getLatestWorkProgressSession", () => {
  it("returns the newest grouped session", () => {
    const latest = getLatestWorkProgressSession([
      makeSnapshot({
        id: "wp-1",
        createdAt: "2026-06-08T10:00:00.000Z",
      }),
      makeSnapshot({
        id: "wp-2",
        createdAt: "2026-06-08T12:00:00.000Z",
      }),
    ]);

    expect(latest?.latestSnapshotId).toBe("wp-2");
  });
});
