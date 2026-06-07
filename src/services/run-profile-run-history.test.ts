import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import type { RunProfileManagedProcessSnapshot } from "@/lib/run-profile-process-manager";

import {
  createRunProfileRunForManagedStart,
  finalizeRunProfileRunFromSnapshot,
  getLatestRunProfileRun,
  listRunProfileRuns,
  markActiveRunProfileRunsStaleOnBoot,
  toRunProfileRunRecord,
  updateRunProfileRunOnSpawn,
} from "@/services/run-profile-run-history";

vi.mock("@/lib/db", () => ({
  db: {
    projectRunProfileRun: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const baseSnapshot: RunProfileManagedProcessSnapshot = {
  runProfileId: "rp-1",
  status: "starting",
  pid: null,
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  startedAt: "2026-01-01T00:00:00.000Z",
  stoppedAt: null,
  exitedAt: null,
  exitCode: null,
  signal: null,
  message: "Process is starting.",
  logs: {
    stdout: "ready",
    stderr: "warn",
    stdoutTruncated: false,
    stderrTruncated: false,
  },
};

const mockRunRow = {
  id: "run-1",
  runProfileId: "rp-1",
  status: "starting",
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  pid: null,
  startedAt: new Date("2026-01-01T00:00:00.000Z"),
  endedAt: null,
  exitCode: null,
  signal: null,
  durationMs: null,
  stdoutPreview: null,
  stderrPreview: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("toRunProfileRunRecord", () => {
  it("maps prisma row to serializable record", () => {
    expect(toRunProfileRunRecord(mockRunRow)).toEqual({
      id: "run-1",
      runProfileId: "rp-1",
      status: "starting",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
      pid: null,
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: null,
      exitCode: null,
      signal: null,
      durationMs: null,
      stdoutPreview: null,
      stderrPreview: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("createRunProfileRunForManagedStart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a run history row from managed start snapshot", async () => {
    await createRunProfileRunForManagedStart(baseSnapshot);

    expect(db.projectRunProfileRun.create).toHaveBeenCalledWith({
      data: {
        runProfileId: "rp-1",
        status: "starting",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
        pid: null,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  });

  it("does not throw when create fails", async () => {
    vi.mocked(db.projectRunProfileRun.create).mockRejectedValue(
      new Error("db down"),
    );

    await expect(
      createRunProfileRunForManagedStart(baseSnapshot),
    ).resolves.toBeUndefined();
  });
});

describe("updateRunProfileRunOnSpawn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the open run with pid and running status", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(mockRunRow);

    await updateRunProfileRunOnSpawn({
      ...baseSnapshot,
      status: "running",
      pid: 1234,
      message: "Process is running.",
    });

    expect(db.projectRunProfileRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: {
        status: "running",
        pid: 1234,
      },
    });
  });

  it("no-ops when no open run exists", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(null);

    await updateRunProfileRunOnSpawn({
      ...baseSnapshot,
      status: "running",
      pid: 1234,
    });

    expect(db.projectRunProfileRun.update).not.toHaveBeenCalled();
  });
});

describe("finalizeRunProfileRunFromSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finalizes the open run with terminal metadata and log previews", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(mockRunRow);

    await finalizeRunProfileRunFromSnapshot({
      ...baseSnapshot,
      status: "exited",
      pid: 1234,
      exitCode: 0,
      exitedAt: "2026-01-01T00:00:10.000Z",
      message: "Process exited with code 0.",
    });

    expect(db.projectRunProfileRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: expect.objectContaining({
        status: "exited",
        pid: 1234,
        exitCode: 0,
        durationMs: 10_000,
        stdoutPreview: "ready",
        stderrPreview: "warn",
      }),
    });
  });

  it("ignores non-terminal managed statuses", async () => {
    await finalizeRunProfileRunFromSnapshot({
      ...baseSnapshot,
      status: "running",
    });

    expect(db.projectRunProfileRun.findFirst).not.toHaveBeenCalled();
  });

  it("no-ops when open run is missing", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(null);

    await finalizeRunProfileRunFromSnapshot({
      ...baseSnapshot,
      status: "stopped",
      exitedAt: "2026-01-01T00:00:05.000Z",
    });

    expect(db.projectRunProfileRun.update).not.toHaveBeenCalled();
  });
});

describe("listRunProfileRuns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recent runs newest first", async () => {
    vi.mocked(db.projectRunProfileRun.findMany).mockResolvedValue([mockRunRow]);

    const result = await listRunProfileRuns("rp-1", 5);

    expect(db.projectRunProfileRun.findMany).toHaveBeenCalledWith({
      where: { runProfileId: "rp-1" },
      orderBy: { startedAt: "desc" },
      take: 5,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("run-1");
  });
});

describe("getLatestRunProfileRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest run record", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(mockRunRow);

    const result = await getLatestRunProfileRun("rp-1");

    expect(db.projectRunProfileRun.findFirst).toHaveBeenCalledWith({
      where: { runProfileId: "rp-1" },
      orderBy: { startedAt: "desc" },
    });
    expect(result?.id).toBe("run-1");
  });

  it("returns null when no runs exist", async () => {
    vi.mocked(db.projectRunProfileRun.findFirst).mockResolvedValue(null);

    await expect(getLatestRunProfileRun("rp-1")).resolves.toBeNull();
  });
});

describe("markActiveRunProfileRunsStaleOnBoot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const activeStatusesWhere = {
    where: { status: { in: ["starting", "running", "stopping"] } },
    select: { id: true, startedAt: true },
  };

  const staleUpdate = (id: string, durationMs: number) =>
    db.projectRunProfileRun.update({
      where: { id },
      data: {
        status: "stale",
        endedAt: new Date("2026-06-07T12:00:00.000Z"),
        durationMs,
        signal: "APP_RESTART",
      },
    });

  it("marks running rows stale with restart signal and duration", async () => {
    const runningRow = {
      id: "run-running",
      startedAt: new Date("2026-06-07T11:59:00.000Z"),
    };

    vi.mocked(db.projectRunProfileRun.findMany).mockResolvedValue([
      runningRow,
    ] as never);
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const count = await markActiveRunProfileRunsStaleOnBoot();

    expect(db.projectRunProfileRun.findMany).toHaveBeenCalledWith(
      activeStatusesWhere,
    );
    expect(db.$transaction).toHaveBeenCalledWith([
      staleUpdate("run-running", 60_000),
    ]);
    expect(count).toBe(1);
  });

  it("marks starting rows stale with restart signal and duration", async () => {
    const startingRow = {
      id: "run-starting",
      startedAt: new Date("2026-06-07T11:58:30.000Z"),
    };

    vi.mocked(db.projectRunProfileRun.findMany).mockResolvedValue([
      startingRow,
    ] as never);
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const count = await markActiveRunProfileRunsStaleOnBoot();

    expect(db.projectRunProfileRun.findMany).toHaveBeenCalledWith(
      activeStatusesWhere,
    );
    expect(db.$transaction).toHaveBeenCalledWith([
      staleUpdate("run-starting", 90_000),
    ]);
    expect(count).toBe(1);
  });

  it("marks stopping rows stale with restart signal and duration", async () => {
    const stoppingRow = {
      id: "run-stopping",
      startedAt: new Date("2026-06-07T11:57:00.000Z"),
    };

    vi.mocked(db.projectRunProfileRun.findMany).mockResolvedValue([
      stoppingRow,
    ] as never);
    vi.mocked(db.$transaction).mockResolvedValue([]);

    const count = await markActiveRunProfileRunsStaleOnBoot();

    expect(db.$transaction).toHaveBeenCalledWith([
      staleUpdate("run-stopping", 180_000),
    ]);
    expect(count).toBe(1);
  });

  it("does not change terminal rows", async () => {
    vi.mocked(db.projectRunProfileRun.findMany).mockResolvedValue([]);

    const count = await markActiveRunProfileRunsStaleOnBoot();

    expect(db.projectRunProfileRun.findMany).toHaveBeenCalledWith(
      activeStatusesWhere,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(count).toBe(0);
  });

  it("logs and returns zero when db fails without throwing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.mocked(db.projectRunProfileRun.findMany).mockRejectedValue(
      new Error("db down"),
    );

    await expect(markActiveRunProfileRunsStaleOnBoot()).resolves.toBe(0);
    expect(consoleError).toHaveBeenCalledWith(
      "[run-profile-run-history] markActiveRunProfileRunsStaleOnBoot: db down",
    );

    consoleError.mockRestore();
  });
});
