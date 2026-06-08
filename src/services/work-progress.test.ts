import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import {
  captureWorkProgressForCwd,
  captureWorkProgressSnapshot,
  findProjectForWorkProgressCwd,
  getWorkProgressSessionsPageData,
  listWorkProgressByProjectId,
  listWorkProgressSessionsByProjectId,
  toWorkProgressRecord,
  WorkProgressServiceError,
} from "@/services/work-progress";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    workProgress: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    workProgressSessionSummary: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/git-work-progress-capture", () => ({
  buildWorkProgressSummary: vi.fn(
    (snapshot: {
      branch: string;
      latestCommitHash: string;
      latestCommitMessage: string;
      changedFiles: unknown[];
    }) =>
      `${snapshot.branch} @ ${snapshot.latestCommitHash}: ${snapshot.latestCommitMessage} (${snapshot.changedFiles.length} changed files)`,
  ),
  captureGitWorkProgressSnapshot: vi.fn(),
}));

import { captureGitWorkProgressSnapshot } from "@/lib/git-work-progress-capture";

const mockProject = {
  id: "proj-1",
  name: "ManDev",
  slug: "mandev",
  localPath: "/Users/dev/mandev",
};

const gitSnapshot = {
  branch: "main",
  latestCommitHash: "1a97f41",
  latestCommitMessage: "feat: add run detail page",
  latestCommitAuthor: "Dev User",
  latestCommitDate: "2026-06-07T10:00:00+07:00",
  changedFiles: [{ status: "M", path: "RESULT.md" }],
  gitStatusText: " M RESULT.md",
};

const mockRow = {
  id: "wp-1",
  projectId: "proj-1",
  branch: "main",
  latestCommitHash: "1a97f41",
  latestCommitMessage: "feat: add run detail page",
  latestCommitAuthor: "Dev User",
  latestCommitDate: new Date("2026-06-07T03:00:00.000Z"),
  changedFilesJson: JSON.stringify([{ status: "M", path: "RESULT.md" }]),
  changedFilesCount: 1,
  gitStatusText: " M RESULT.md",
  summary: "main @ 1a97f41: feat: add run detail page (1 changed file)",
  note: null,
  createdAt: new Date("2026-06-07T04:00:00.000Z"),
  updatedAt: new Date("2026-06-07T04:00:00.000Z"),
};

describe("toWorkProgressRecord", () => {
  it("maps prisma row to serializable record", () => {
    expect(toWorkProgressRecord(mockRow)).toEqual({
      id: "wp-1",
      projectId: "proj-1",
      branch: "main",
      latestCommitHash: "1a97f41",
      latestCommitMessage: "feat: add run detail page",
      latestCommitAuthor: "Dev User",
      latestCommitDate: "2026-06-07T03:00:00.000Z",
      changedFiles: [{ status: "M", path: "RESULT.md" }],
      changedFilesCount: 1,
      gitStatusText: " M RESULT.md",
      summary: "main @ 1a97f41: feat: add run detail page (1 changed file)",
      note: null,
      createdAt: "2026-06-07T04:00:00.000Z",
      updatedAt: "2026-06-07T04:00:00.000Z",
    });
  });
});

describe("captureWorkProgressSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a work progress entry from git snapshot", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: true,
      snapshot: gitSnapshot,
    });
    vi.mocked(db.workProgress.create).mockResolvedValue(mockRow);

    const result = await captureWorkProgressSnapshot("proj-1");

    expect(captureGitWorkProgressSnapshot).toHaveBeenCalledWith(
      "/Users/dev/mandev",
    );
    expect(db.workProgress.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "proj-1",
        branch: "main",
        latestCommitHash: "1a97f41",
        changedFilesCount: 1,
        changedFilesJson: JSON.stringify(gitSnapshot.changedFiles),
        gitStatusText: " M RESULT.md",
      }),
    });
    expect(result.id).toBe("wp-1");
  });

  it("throws when project is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(captureWorkProgressSnapshot("missing")).rejects.toThrow(
      WorkProgressServiceError,
    );
  });

  it("throws when local path is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      ...mockProject,
      localPath: null,
    } as never);

    await expect(captureWorkProgressSnapshot("proj-1")).rejects.toMatchObject({
      code: "LOCAL_PATH_MISSING",
    });
  });

  it("throws when git capture fails", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: false,
      code: "NOT_GIT_REPOSITORY",
      message: "Local path is not a Git repository",
    });

    await expect(captureWorkProgressSnapshot("proj-1")).rejects.toMatchObject({
      code: "NOT_GIT_REPOSITORY",
    });
  });
});

describe("findProjectForWorkProgressCwd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the longest matching registered project", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([
      {
        id: "proj-parent",
        name: "Parent",
        slug: "parent",
        localPath: "/Users/dev",
      },
      {
        id: "proj-1",
        name: "ManDev",
        slug: "mandev",
        localPath: "/Users/dev/mandev",
      },
    ] as never);

    const result = await findProjectForWorkProgressCwd("/Users/dev/mandev/src");

    expect(result).toEqual({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    });
  });

  it("returns null when cwd does not match any registered project", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([
      {
        id: "proj-1",
        name: "ManDev",
        slug: "mandev",
        localPath: "/Users/dev/mandev",
      },
    ] as never);

    const result = await findProjectForWorkProgressCwd("/tmp/other");

    expect(result).toBeNull();
  });
});

describe("captureWorkProgressForCwd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures work progress for a matching cwd", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: true,
      snapshot: gitSnapshot,
    });
    vi.mocked(db.workProgress.create).mockResolvedValue(mockRow);

    const result = await captureWorkProgressForCwd({
      cwd: "/Users/dev/mandev",
      note: "CLI capture",
    });

    expect(result.project).toEqual({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    });
    expect(result.snapshot.id).toBe("wp-1");
    expect(result.created).toBe(true);
    expect(result.skipped).toBe(false);
    expect(db.workProgress.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        note: "CLI capture",
      }),
    });
  });

  it("skips create when dedupe is true and latest snapshot is unchanged", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: true,
      snapshot: gitSnapshot,
    });
    vi.mocked(db.workProgress.findFirst).mockResolvedValue(mockRow);

    const result = await captureWorkProgressForCwd({
      cwd: "/Users/dev/mandev",
      dedupe: true,
    });

    expect(result.created).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("UNCHANGED");
    expect(result.snapshot.id).toBe("wp-1");
    expect(db.workProgress.create).not.toHaveBeenCalled();
  });

  it("creates snapshot when dedupe is true and git state changed", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: true,
      snapshot: {
        ...gitSnapshot,
        gitStatusText: "?? temp.txt",
        changedFiles: [{ status: "??", path: "temp.txt" }],
      },
    });
    vi.mocked(db.workProgress.findFirst).mockResolvedValue(mockRow);
    vi.mocked(db.workProgress.create).mockResolvedValue({
      ...mockRow,
      id: "wp-2",
      changedFilesCount: 1,
      changedFilesJson: JSON.stringify([{ status: "??", path: "temp.txt" }]),
      gitStatusText: "?? temp.txt",
    });

    const result = await captureWorkProgressForCwd({
      cwd: "/Users/dev/mandev",
      dedupe: true,
    });

    expect(result.created).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.snapshot.id).toBe("wp-2");
    expect(db.workProgress.create).toHaveBeenCalled();
  });

  it("throws when no project matches cwd", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);

    await expect(
      captureWorkProgressForCwd({ cwd: "/tmp/unregistered" }),
    ).rejects.toMatchObject({
      code: "PROJECT_NOT_FOUND",
    });
  });

  it("throws when matched project has missing localPath during capture", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(db.project.findUnique).mockResolvedValue({
      ...mockProject,
      localPath: null,
    } as never);

    await expect(
      captureWorkProgressForCwd({ cwd: "/Users/dev/mandev" }),
    ).rejects.toMatchObject({
      code: "LOCAL_PATH_MISSING",
    });
  });

  it("throws when git capture fails", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([mockProject] as never);
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(captureGitWorkProgressSnapshot).mockResolvedValue({
      ok: false,
      code: "NOT_GIT_REPOSITORY",
      message: "Local path is not a Git repository",
    });

    await expect(
      captureWorkProgressForCwd({ cwd: "/Users/dev/mandev" }),
    ).rejects.toMatchObject({
      code: "NOT_GIT_REPOSITORY",
    });
  });

});

describe("listWorkProgressByProjectId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent entries newest first", async () => {
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);

    const result = await listWorkProgressByProjectId("proj-1", 5);

    expect(db.workProgress.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("wp-1");
  });
});

describe("listWorkProgressSessionsByProjectId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns grouped sessions for existing snapshots", async () => {
    vi.mocked(db.workProgress.findMany).mockResolvedValue([
      mockRow,
      {
        ...mockRow,
        id: "wp-2",
        createdAt: new Date("2026-06-07T05:00:00.000Z"),
      },
    ]);

    const sessions = await listWorkProgressSessionsByProjectId("proj-1");

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.snapshotCount).toBe(2);
  });

  it("returns empty sessions when project has no snapshots", async () => {
    vi.mocked(db.workProgress.findMany).mockResolvedValue([]);

    const sessions = await listWorkProgressSessionsByProjectId("proj-1");

    expect(sessions).toEqual([]);
  });
});

describe("getWorkProgressSessionsPageData", () => {
  const sessionId = "session-wp-1-wp-1";

  const mockSummaryRow = {
    id: "summary-1",
    projectId: "proj-1",
    sessionId,
    summaryMarkdown: "Implemented and verified Work Progress session summary save flow.",
    firstSnapshotId: "wp-1",
    latestSnapshotId: "wp-1",
    branch: "main",
    sessionStartedAt: new Date("2026-06-07T04:00:00.000Z"),
    sessionEndedAt: new Date("2026-06-07T04:00:00.000Z"),
    createdAt: new Date("2026-06-08T04:00:00.000Z"),
    updatedAt: new Date("2026-06-08T05:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.workProgressSessionSummary.findMany).mockResolvedValue([]);
  });

  it("returns null when project is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    const data = await getWorkProgressSessionsPageData("missing");

    expect(data).toBeNull();
  });

  it("returns project and sessions for existing project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);

    const data = await getWorkProgressSessionsPageData("proj-1");

    expect(data?.project.name).toBe("ManDev");
    expect(data?.entryCount).toBe(1);
    expect(data?.sessions).toHaveLength(1);
    expect(data?.sessions[0]?.savedSummary).toBeNull();
  });

  it("includes saved summary preview when summary exists", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.findMany).mockResolvedValue([
      mockSummaryRow,
    ]);

    const data = await getWorkProgressSessionsPageData("proj-1");

    expect(data?.sessions[0]?.savedSummary).toEqual({
      id: "summary-1",
      summaryMarkdown:
        "Implemented and verified Work Progress session summary save flow.",
      preview:
        "Implemented and verified Work Progress session summary save flow.",
      updatedAt: "2026-06-08T05:00:00.000Z",
    });
    expect(db.workProgressSessionSummary.findMany).toHaveBeenCalledWith({
      where: {
        projectId: "proj-1",
        sessionId: {
          in: [sessionId],
        },
      },
    });
  });

  it("matches multiple summaries to the correct session IDs", async () => {
    const olderSnapshot = {
      ...mockRow,
      id: "wp-0",
      createdAt: new Date("2026-06-06T04:00:00.000Z"),
    };
    const newerSnapshot = {
      ...mockRow,
      id: "wp-2",
      createdAt: new Date("2026-06-08T04:00:00.000Z"),
    };
    const olderSessionId = "session-wp-0-wp-0";
    const newerSessionId = "session-wp-2-wp-2";

    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([
      newerSnapshot,
      mockRow,
      olderSnapshot,
    ]);
    vi.mocked(db.workProgressSessionSummary.findMany).mockResolvedValue([
      {
        ...mockSummaryRow,
        id: "summary-old",
        sessionId: olderSessionId,
        summaryMarkdown: "Older session summary",
      },
      {
        ...mockSummaryRow,
        id: "summary-new",
        sessionId: newerSessionId,
        summaryMarkdown: "Newer session summary",
      },
    ]);

    const data = await getWorkProgressSessionsPageData("proj-1");

    expect(data?.sessions).toHaveLength(3);
    expect(
      data?.sessions.find((session) => session.id === olderSessionId)?.savedSummary
        ?.preview,
    ).toBe("Older session summary");
    expect(
      data?.sessions.find((session) => session.id === newerSessionId)?.savedSummary
        ?.preview,
    ).toBe("Newer session summary");
    expect(
      data?.sessions.find((session) => session.id === sessionId)?.savedSummary,
    ).toBeNull();
  });

  it("works when project has no saved summaries", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.findMany).mockResolvedValue([]);

    const data = await getWorkProgressSessionsPageData("proj-1");

    expect(data?.sessions[0]?.savedSummary).toBeNull();
    expect(db.workProgressSessionSummary.findMany).toHaveBeenCalled();
  });

  it("treats empty saved summary as null without crashing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
      slug: "mandev",
      localPath: "/Users/dev/mandev",
    } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.findMany).mockResolvedValue([
      {
        ...mockSummaryRow,
        summaryMarkdown: "   \n  ",
      },
    ]);

    const data = await getWorkProgressSessionsPageData("proj-1");

    expect(data?.sessions[0]?.savedSummary).toBeNull();
  });
});
