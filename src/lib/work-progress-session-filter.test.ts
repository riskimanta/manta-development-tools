import { describe, expect, it } from "vitest";

import {
  buildWorkProgressSessionsListHref,
  deriveWorkProgressSessionBranchOptions,
  filterWorkProgressSessions,
  parseWorkProgressSessionFilters,
  resolveWorkProgressSessionFilters,
} from "@/lib/work-progress-session-filter";
import type { WorkProgressSessionListItem } from "@/services/work-progress";

function makeSession(
  overrides: Partial<WorkProgressSessionListItem> & Pick<WorkProgressSessionListItem, "id">,
): WorkProgressSessionListItem {
  return {
    projectId: "proj-1",
    branch: "main",
    startedAt: "2026-06-07T10:00:00.000Z",
    endedAt: "2026-06-07T11:00:00.000Z",
    durationMs: 60 * 60 * 1000,
    snapshotCount: 1,
    firstSnapshotId: "wp-1",
    latestSnapshotId: "wp-1",
    firstCommitHash: "abc1234",
    latestCommitHash: "abc1234",
    latestCommitMessage: "feat: add filters",
    changedFilesCount: 1,
    changedFiles: [{ status: "M", path: "src/lib/filter.ts" }],
    latestStatusLabel: "Dirty working tree",
    isClean: false,
    snapshots: [
      {
        id: "wp-1",
        projectId: "proj-1",
        branch: "main",
        latestCommitHash: "abc1234",
        latestCommitMessage: "feat: add filters",
        latestCommitAuthor: "Dev",
        latestCommitDate: "2026-06-07T10:00:00.000Z",
        changedFiles: [{ status: "M", path: "src/lib/filter.ts" }],
        changedFilesCount: 1,
        gitStatusText: " M src/lib/filter.ts",
        summary: "main @ abc1234",
        note: null,
        createdAt: "2026-06-07T10:00:00.000Z",
        updatedAt: "2026-06-07T10:00:00.000Z",
      },
    ],
    savedSummary: null,
    ...overrides,
  };
}

const sessions: WorkProgressSessionListItem[] = [
  makeSession({
    id: "session-main-dirty",
    branch: "main",
    latestCommitMessage: "feat: add filters",
    isClean: false,
    savedSummary: {
      id: "summary-1",
      summaryMarkdown: "Implemented search and filter controls.",
      preview: "Implemented search and filter controls.",
      updatedAt: "2026-06-08T05:00:00.000Z",
    },
  }),
  makeSession({
    id: "session-main-clean",
    branch: "main",
    startedAt: "2026-06-06T10:00:00.000Z",
    endedAt: "2026-06-06T11:00:00.000Z",
    latestCommitMessage: "chore: cleanup",
    latestCommitHash: "def5678",
    isClean: true,
    changedFilesCount: 0,
    changedFiles: [],
    latestStatusLabel: "Clean working tree",
    savedSummary: null,
  }),
  makeSession({
    id: "session-feature",
    branch: "feat/work-progress",
    startedAt: "2026-06-08T12:00:00.000Z",
    endedAt: "2026-06-08T13:00:00.000Z",
    latestCommitMessage: "docs: update work progress",
    latestCommitHash: "ghi9012",
    changedFiles: [{ status: "M", path: "docs/features/work-progress-snapshot.md" }],
    changedFilesCount: 1,
    isClean: false,
    savedSummary: null,
  }),
];

describe("filterWorkProgressSessions", () => {
  it("returns all sessions when filters are empty", () => {
    expect(filterWorkProgressSessions(sessions, {})).toEqual(sessions);
  });

  it("matches search by branch", () => {
    const result = filterWorkProgressSessions(sessions, { q: "feat/work" });
    expect(result.map((session) => session.id)).toEqual(["session-feature"]);
  });

  it("matches search by commit message", () => {
    const result = filterWorkProgressSessions(sessions, { q: "cleanup" });
    expect(result.map((session) => session.id)).toEqual(["session-main-clean"]);
  });

  it("matches search by changed file path", () => {
    const result = filterWorkProgressSessions(sessions, {
      q: "work-progress-snapshot.md",
    });
    expect(result.map((session) => session.id)).toEqual(["session-feature"]);
  });

  it("matches search by saved summary text", () => {
    const result = filterWorkProgressSessions(sessions, { q: "filter controls" });
    expect(result.map((session) => session.id)).toEqual(["session-main-dirty"]);
  });

  it("is case-insensitive for search", () => {
    const result = filterWorkProgressSessions(sessions, { q: "FILTER CONTROLS" });
    expect(result.map((session) => session.id)).toEqual(["session-main-dirty"]);
  });

  it("filters by exact branch", () => {
    const result = filterWorkProgressSessions(sessions, { branch: "main" });
    expect(result).toHaveLength(2);
    expect(result.every((session) => session.branch === "main")).toBe(true);
  });

  it("filters clean sessions", () => {
    const result = filterWorkProgressSessions(sessions, { status: "clean" });
    expect(result.map((session) => session.id)).toEqual(["session-main-clean"]);
  });

  it("filters dirty sessions", () => {
    const result = filterWorkProgressSessions(sessions, { status: "dirty" });
    expect(result.map((session) => session.id)).toEqual([
      "session-main-dirty",
      "session-feature",
    ]);
  });

  it("filters sessions with saved summaries", () => {
    const result = filterWorkProgressSessions(sessions, { summary: "has" });
    expect(result.map((session) => session.id)).toEqual(["session-main-dirty"]);
  });

  it("filters sessions without saved summaries", () => {
    const result = filterWorkProgressSessions(sessions, { summary: "none" });
    expect(result.map((session) => session.id)).toEqual([
      "session-main-clean",
      "session-feature",
    ]);
  });

  it("applies combined filters", () => {
    const result = filterWorkProgressSessions(sessions, {
      branch: "main",
      status: "dirty",
      summary: "has",
    });
    expect(result.map((session) => session.id)).toEqual(["session-main-dirty"]);
  });

  it("filters by startedAt date range", () => {
    const result = filterWorkProgressSessions(sessions, {
      from: "2026-06-07",
      to: "2026-06-07",
    });
    expect(result.map((session) => session.id)).toEqual(["session-main-dirty"]);
  });

  it("ignores invalid date filters safely", () => {
    const result = filterWorkProgressSessions(sessions, {
      from: "not-a-date",
      to: "2026-06-07",
    });
    expect(result.map((session) => session.id)).toEqual([
      "session-main-dirty",
      "session-main-clean",
    ]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(
      filterWorkProgressSessions(sessions, { q: "does-not-exist" }),
    ).toEqual([]);
  });
});

describe("parseWorkProgressSessionFilters", () => {
  it("returns safe defaults for missing params", () => {
    expect(parseWorkProgressSessionFilters()).toEqual({
      status: "all",
      summary: "all",
    });
  });

  it("normalizes unknown status to all", () => {
    expect(parseWorkProgressSessionFilters({ status: "unknown" }).status).toBe(
      "all",
    );
  });

  it("normalizes unknown summary to all", () => {
    expect(parseWorkProgressSessionFilters({ summary: "maybe" }).summary).toBe(
      "all",
    );
  });

  it("trims q and ignores empty search text", () => {
    expect(parseWorkProgressSessionFilters({ q: "  summary  " }).q).toBe(
      "summary",
    );
    expect(parseWorkProgressSessionFilters({ q: "   " }).q).toBeUndefined();
  });

  it("keeps valid date params and drops invalid ones", () => {
    expect(
      parseWorkProgressSessionFilters({
        from: "2026-06-01",
        to: "invalid",
      }),
    ).toEqual({
      status: "all",
      summary: "all",
      from: "2026-06-01",
    });
  });
});

describe("resolveWorkProgressSessionFilters", () => {
  it("returns filtered and total counts with branch options", () => {
    const result = resolveWorkProgressSessionFilters(sessions, {
      status: "dirty",
    });

    expect(result.totalSessionCount).toBe(3);
    expect(result.filteredCount).toBe(2);
    expect(result.sessions).toHaveLength(2);
    expect(result.branchOptions).toEqual(["feat/work-progress", "main"]);
  });
});

describe("deriveWorkProgressSessionBranchOptions", () => {
  it("returns sorted unique branches", () => {
    expect(deriveWorkProgressSessionBranchOptions(sessions)).toEqual([
      "feat/work-progress",
      "main",
    ]);
  });
});

describe("buildWorkProgressSessionsListHref", () => {
  it("builds base and filtered session list hrefs", () => {
    expect(buildWorkProgressSessionsListHref("proj-1")).toBe(
      "/projects/proj-1/work-progress",
    );
    expect(
      buildWorkProgressSessionsListHref("proj-1", {
        q: "filters",
        branch: "main",
        status: "dirty",
      }),
    ).toBe(
      "/projects/proj-1/work-progress?q=filters&branch=main&status=dirty",
    );
  });
});
