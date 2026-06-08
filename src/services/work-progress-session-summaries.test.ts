import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import {
  getWorkProgressSessionDetailPageData,
  getWorkProgressSessionSummary,
  upsertWorkProgressSessionSummary,
  WorkProgressSessionSummaryServiceError,
} from "@/services/work-progress-session-summaries";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    workProgress: {
      findMany: vi.fn(),
    },
    workProgressSessionSummary: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

const mockProject = {
  id: "proj-1",
  name: "ManDev",
  slug: "mandev",
  localPath: "/Users/dev/mandev",
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

const sessionId = "session-wp-1-wp-1";

const mockSummaryRow = {
  id: "summary-1",
  projectId: "proj-1",
  sessionId,
  summaryMarkdown: "Saved AI summary",
  firstSnapshotId: "wp-1",
  latestSnapshotId: "wp-1",
  branch: "main",
  sessionStartedAt: new Date("2026-06-07T04:00:00.000Z"),
  sessionEndedAt: new Date("2026-06-07T04:00:00.000Z"),
  createdAt: new Date("2026-06-08T04:00:00.000Z"),
  updatedAt: new Date("2026-06-08T05:00:00.000Z"),
};

describe("upsertWorkProgressSessionSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves new summary for valid project/session", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({ id: "proj-1" } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.upsert).mockResolvedValue(
      mockSummaryRow,
    );

    const result = await upsertWorkProgressSessionSummary({
      projectId: "proj-1",
      sessionId,
      summaryMarkdown: "Saved AI summary",
    });

    expect(db.workProgressSessionSummary.upsert).toHaveBeenCalledWith({
      where: {
        projectId_sessionId: {
          projectId: "proj-1",
          sessionId,
        },
      },
      create: expect.objectContaining({
        projectId: "proj-1",
        sessionId,
        summaryMarkdown: "Saved AI summary",
        firstSnapshotId: "wp-1",
        latestSnapshotId: "wp-1",
        branch: "main",
      }),
      update: expect.objectContaining({
        summaryMarkdown: "Saved AI summary",
        firstSnapshotId: "wp-1",
        latestSnapshotId: "wp-1",
        branch: "main",
      }),
    });
    expect(result.summaryMarkdown).toBe("Saved AI summary");
    expect(result.firstSnapshotId).toBe("wp-1");
    expect(result.latestSnapshotId).toBe("wp-1");
  });

  it("updates existing summary for same project/session", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({ id: "proj-1" } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.upsert).mockResolvedValue({
      ...mockSummaryRow,
      summaryMarkdown: "Updated AI summary",
      updatedAt: new Date("2026-06-08T06:00:00.000Z"),
    });

    const result = await upsertWorkProgressSessionSummary({
      projectId: "proj-1",
      sessionId,
      summaryMarkdown: "Updated AI summary",
    });

    expect(result.summaryMarkdown).toBe("Updated AI summary");
    expect(db.workProgressSessionSummary.upsert).toHaveBeenCalled();
  });

  it("rejects invalid/missing session ID", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({ id: "proj-1" } as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);

    await expect(
      upsertWorkProgressSessionSummary({
        projectId: "proj-1",
        sessionId: "session-missing",
        summaryMarkdown: "Saved AI summary",
      }),
    ).rejects.toMatchObject({
      code: "SESSION_NOT_FOUND",
    });
  });

  it("rejects missing project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(
      upsertWorkProgressSessionSummary({
        projectId: "missing",
        sessionId,
        summaryMarkdown: "Saved AI summary",
      }),
    ).rejects.toMatchObject({
      code: "PROJECT_NOT_FOUND",
    });
  });
});

describe("getWorkProgressSessionSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns saved summary when present", async () => {
    vi.mocked(db.workProgressSessionSummary.findUnique).mockResolvedValue(
      mockSummaryRow,
    );

    const result = await getWorkProgressSessionSummary("proj-1", sessionId);

    expect(result?.summaryMarkdown).toBe("Saved AI summary");
    expect(result?.updatedAt).toBe("2026-06-08T05:00:00.000Z");
  });

  it("returns null when summary is missing", async () => {
    vi.mocked(db.workProgressSessionSummary.findUnique).mockResolvedValue(null);

    const result = await getWorkProgressSessionSummary("proj-1", sessionId);

    expect(result).toBeNull();
  });
});

describe("getWorkProgressSessionDetailPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes summary in session detail page data", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.findUnique).mockResolvedValue(
      mockSummaryRow,
    );

    const data = await getWorkProgressSessionDetailPageData("proj-1", sessionId);

    expect(data?.project.name).toBe("ManDev");
    expect(data?.session.id).toBe(sessionId);
    expect(data?.summary?.summaryMarkdown).toBe("Saved AI summary");
  });

  it("returns null summary when none saved", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);
    vi.mocked(db.workProgressSessionSummary.findUnique).mockResolvedValue(null);

    const data = await getWorkProgressSessionDetailPageData("proj-1", sessionId);

    expect(data?.summary).toBeNull();
  });

  it("returns null when session ID is invalid", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([mockRow]);

    const data = await getWorkProgressSessionDetailPageData(
      "proj-1",
      "session-missing",
    );

    expect(data).toBeNull();
  });

  it("returns null when project is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    const data = await getWorkProgressSessionDetailPageData(
      "missing",
      sessionId,
    );

    expect(data).toBeNull();
  });

  it("handles invalid changedFilesJson safely", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(db.workProgress.findMany).mockResolvedValue([
      { ...mockRow, changedFilesJson: "not-json", changedFilesCount: 0 },
    ]);
    vi.mocked(db.workProgressSessionSummary.findUnique).mockResolvedValue(null);

    const data = await getWorkProgressSessionDetailPageData("proj-1", sessionId);

    expect(data?.session.changedFiles).toEqual([]);
  });
});

describe("WorkProgressSessionSummaryServiceError", () => {
  it("exposes safe error messages", () => {
    const error = new WorkProgressSessionSummaryServiceError(
      "SESSION_NOT_FOUND",
      "Work progress session not found",
    );

    expect(error.message).toBe("Work progress session not found");
    expect(error.code).toBe("SESSION_NOT_FOUND");
  });
});
