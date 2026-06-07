import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import {
  captureWorkProgressSnapshot,
  listWorkProgressByProjectId,
  toWorkProgressRecord,
  WorkProgressServiceError,
} from "@/services/work-progress";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    workProgress: {
      create: vi.fn(),
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
