import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import { readRunProfilesImportFromLocalPath } from "@/lib/local-run-profiles-import";

import * as runProfileExecution from "@/lib/run-profile-execution";
import { runProfileProcessManager } from "@/lib/run-profile-process-manager";

import {
  createRunProfileRecord,
  executeRunProfileCommand,
  getManagedRunProfileSnapshot,
  importProjectRunProfilesFromLocalFile,
  listManagedRunProfileSnapshots,
  getRunProfileRunHistoryPageData,
  getRunProfileRunDetailPageData,
  listRunProfilesWithRecentRunsByProjectId,
  previewProjectRunProfilesImportFromLocalFile,
  resolveRunProfileWorkingDirectory,
  restartManagedRunProfile,
  startManagedRunProfile,
  stopManagedRunProfile,
  updateRunProfileRecord,
} from "@/services/run-profiles";
import {
  createRunProfileRunForManagedStart,
  getRunProfileRunById,
  listRunProfileRuns,
} from "@/services/run-profile-run-history";

vi.mock("@/lib/mandev-command-execution", () => ({
  isCommandExecutionEnabled: vi.fn(),
  COMMAND_EXECUTION_DISABLED_MESSAGE:
    "Command execution is disabled. Set MANDEV_ENABLE_COMMAND_EXECUTION=true to enable local run actions.",
}));

vi.mock("@/lib/run-profile-execution", async (importOriginal) => {
  const actual = await importOriginal<typeof runProfileExecution>();
  return {
    ...actual,
    executeSavedRunProfileCommand: vi.fn(),
  };
});

import { isCommandExecutionEnabled } from "@/lib/mandev-command-execution";
import { executeSavedRunProfileCommand } from "@/lib/run-profile-execution";

vi.mock("@/lib/local-run-profiles-import", () => ({
  readRunProfilesImportFromLocalPath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    projectRunProfile: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/run-profile-process-manager", () => ({
  runProfileProcessManager: {
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    getSnapshot: vi.fn(),
    listSnapshots: vi.fn(),
    setLifecycleHandler: vi.fn(),
  },
  getRunProfileProcessManagerBootSessionId: () => "test-boot-session-id",
  isManagedProcessStartAccepted: vi.fn(
    (snapshot: { message: string }) =>
      !snapshot.message.startsWith("Process is already"),
  ),
}));

vi.mock("@/services/run-profile-run-history", () => ({
  createRunProfileRunForManagedStart: vi.fn(),
  finalizeRunProfileRunFromSnapshot: vi.fn(),
  updateRunProfileRunOnSpawn: vi.fn(),
  listRunProfileRuns: vi.fn(),
  getLatestRunProfileRun: vi.fn(),
  getRunProfileRunById: vi.fn(),
  markActiveRunProfileRunsStaleOnBoot: vi.fn().mockResolvedValue(0),
}));

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

const mockProfile = {
  id: "rp-1",
  projectId: "proj-1",
  name: "Dev",
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  description: null,
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("resolveRunProfileWorkingDirectory", () => {
  it("uses explicit working directory when provided", () => {
    expect(
      resolveRunProfileWorkingDirectory("/custom", "/Users/dev/app"),
    ).toBe("/custom");
  });

  it("falls back to project local path when working directory is empty", () => {
    expect(resolveRunProfileWorkingDirectory(null, "/Users/dev/app")).toBe(
      "/Users/dev/app",
    );
    expect(resolveRunProfileWorkingDirectory("  ", "/Users/dev/app")).toBe(
      "/Users/dev/app",
    );
  });

  it("returns null when neither path is available", () => {
    expect(resolveRunProfileWorkingDirectory(null, null)).toBeNull();
  });
});

describe("createRunProfileRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when project is not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(
      createRunProfileRecord(
        {
          projectId: "missing",
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
        null,
      ),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" });
  });

  it("creates profile with resolved working directory and clears other defaults", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
    } as never);

    const tx = {
      projectRunProfile: {
        updateMany: vi.fn(),
        create: vi.fn().mockResolvedValue(mockProfile),
      },
    };

    vi.mocked(db.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    await createRunProfileRecord(
      {
        projectId: "proj-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: null,
        description: null,
        isDefault: true,
      },
      "/Users/dev/app",
    );

    expect(tx.projectRunProfile.updateMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1", isDefault: true },
      data: { isDefault: false },
    });
    expect(tx.projectRunProfile.create).toHaveBeenCalledWith({
      data: {
        projectId: "proj-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
        description: null,
        isDefault: true,
      },
    });
  });
});

describe("previewProjectRunProfilesImportFromLocalFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when project is not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(
      previewProjectRunProfilesImportFromLocalFile("missing"),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" });
  });

  it("throws when local path is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      localPath: null,
    } as never);

    await expect(
      previewProjectRunProfilesImportFromLocalFile("proj-1"),
    ).rejects.toMatchObject({ code: "LOCAL_PATH_MISSING" });
  });

  it("throws validation errors from import file read", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
    vi.mocked(readRunProfilesImportFromLocalPath).mockResolvedValue({
      ok: false,
      code: "VALIDATION_FAILED",
      message:
        "Only one profile may have isDefault: true in the import file",
    });

    await expect(
      previewProjectRunProfilesImportFromLocalFile("proj-1"),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: expect.stringContaining("isDefault"),
    });
    expect(db.projectRunProfile.findMany).not.toHaveBeenCalled();
  });

  it("returns import preview without writing profiles", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
    vi.mocked(readRunProfilesImportFromLocalPath).mockResolvedValue({
      ok: true,
      data: {
        profiles: [
          {
            name: "Dev",
            command: "pnpm dev",
            workingDirectory: ".",
            description: null,
            isDefault: true,
          },
          {
            name: "Build",
            command: "pnpm build",
            workingDirectory: null,
            description: null,
            isDefault: false,
          },
        ],
      },
    });
    vi.mocked(db.projectRunProfile.findMany).mockResolvedValue([
      {
        ...mockProfile,
        name: "Dev",
        command: "pnpm start",
      },
      {
        ...mockProfile,
        id: "rp-2",
        name: "Legacy",
        command: "npm start",
        isDefault: false,
      },
    ]);

    const preview = await previewProjectRunProfilesImportFromLocalFile("proj-1");

    expect(readRunProfilesImportFromLocalPath).toHaveBeenCalledWith(
      "/Users/dev/app",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(preview.totalInFile).toBe(2);
    expect(preview.create).toEqual([
      expect.objectContaining({ name: "Build" }),
    ]);
    expect(preview.update).toEqual([
      expect.objectContaining({
        name: "Dev",
        changes: [
          {
            field: "command",
            before: "pnpm start",
            after: "pnpm dev",
          },
        ],
      }),
    ]);
    expect(preview.kept).toEqual([{ name: "Legacy", isDefault: false }]);
  });
});

describe("importProjectRunProfilesFromLocalFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when project is not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(
      importProjectRunProfilesFromLocalFile("missing"),
    ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" });
  });

  it("throws when local path is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "App",
      slug: "app",
      description: null,
      repoUrl: null,
      localPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      importProjectRunProfilesFromLocalFile("proj-1"),
    ).rejects.toMatchObject({
      code: "LOCAL_PATH_MISSING",
      message: expect.stringContaining("Set a local path"),
    });
  });

  it("creates and updates profiles from validated import file", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "App",
      slug: "app",
      description: null,
      repoUrl: null,
      localPath: "/Users/dev/app",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(readRunProfilesImportFromLocalPath).mockResolvedValue({
      ok: true,
      data: {
        profiles: [
          {
            name: "Dev",
            command: "pnpm dev",
            workingDirectory: ".",
            description: null,
            isDefault: true,
          },
          {
            name: "Tests",
            command: "pnpm test",
            workingDirectory: null,
            description: "Suite",
            isDefault: false,
          },
        ],
      },
    });

    const existingProfile = {
      ...mockProfile,
      id: "rp-existing",
      name: "Tests",
      isDefault: false,
    };

    const tx = {
      projectRunProfile: {
        findMany: vi.fn().mockResolvedValue([existingProfile]),
        updateMany: vi.fn(),
        create: vi.fn().mockResolvedValue({
          ...mockProfile,
          id: "rp-new",
          name: "Dev",
        }),
        update: vi.fn().mockResolvedValue(existingProfile),
      },
    };

    vi.mocked(db.$transaction).mockImplementation(async (fn) =>
      fn(tx as never),
    );

    const result = await importProjectRunProfilesFromLocalFile("proj-1");

    expect(readRunProfilesImportFromLocalPath).toHaveBeenCalledWith(
      "/Users/dev/app",
    );
    expect(tx.projectRunProfile.updateMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1", isDefault: true },
      data: { isDefault: false },
    });
    expect(tx.projectRunProfile.create).toHaveBeenCalledWith({
      data: {
        projectId: "proj-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
        description: null,
        isDefault: true,
      },
    });
    expect(tx.projectRunProfile.update).toHaveBeenCalledWith({
      where: { id: "rp-existing" },
      data: {
        command: "pnpm test",
        workingDirectory: "/Users/dev/app",
        description: "Suite",
        isDefault: false,
      },
    });
    expect(result).toEqual({ created: 1, updated: 1 });
  });
});

describe("updateRunProfileRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when profile is not found", async () => {
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(null);

    await expect(
      updateRunProfileRecord(
        {
          id: "missing",
          projectId: "proj-1",
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
        null,
      ),
    ).rejects.toMatchObject({ code: "RUN_PROFILE_NOT_FOUND" });
  });
});

describe("executeRunProfileCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns disabled when command execution env flag is off", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(false);

    const result = await executeRunProfileCommand("rp-1");

    expect(result).toEqual({
      status: "disabled",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message:
        "Command execution is disabled. Set MANDEV_ENABLE_COMMAND_EXECUTION=true to enable local run actions.",
    });
    expect(db.projectRunProfile.findUnique).not.toHaveBeenCalled();
  });

  it("blocks when working directory is missing on saved profile", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      workingDirectory: null,
    });

    const result = await executeRunProfileCommand("rp-1");

    expect(result.status).toBe("blocked");
    expect(result.message).toMatch(/working directory/i);
    expect(executeSavedRunProfileCommand).not.toHaveBeenCalled();
  });

  it("delegates to execution helper for saved profile records", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(executeSavedRunProfileCommand).mockResolvedValue({
      status: "success",
      exitCode: 0,
      stdoutPreview: "ok",
      stderrPreview: "",
      message: "Command finished with exit code 0.",
    });

    const result = await executeRunProfileCommand("rp-1");

    expect(executeSavedRunProfileCommand).toHaveBeenCalledWith({
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
    });
    expect(result.status).toBe("success");
  });

  it("throws when profile is not found", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(null);

    await expect(executeRunProfileCommand("missing")).rejects.toMatchObject({
      code: "RUN_PROFILE_NOT_FOUND",
    });
  });

  it("still blocks long-running commands on the Phase 2A path", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);

    const actual = await vi.importActual<typeof runProfileExecution>(
      "@/lib/run-profile-execution",
    );
    vi.mocked(executeSavedRunProfileCommand).mockImplementation((profile) =>
      actual.executeSavedRunProfileCommand(profile, {
        fsAccess: {
          exists: () => true,
          isDirectory: () => true,
        },
      }),
    );

    const result = await executeRunProfileCommand("rp-1");

    expect(result.status).toBe("blocked");
    expect(result.message).toMatch(/long-running/i);
  });
});

const managedSnapshot = {
  runProfileId: "rp-1",
  status: "starting" as const,
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
    stdout: "",
    stderr: "",
    stdoutTruncated: false,
    stderrTruncated: false,
  },
};

function mockValidWorkingDirectory() {
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as never);
}

describe("startManagedRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidWorkingDirectory();
  });

  it("returns disabled when command execution env flag is off", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(false);

    const result = await startManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "disabled",
    });
    expect(db.projectRunProfile.findUnique).not.toHaveBeenCalled();
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("returns not_found when profile does not exist", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(null);

    const result = await startManagedRunProfile("missing");

    expect(result).toMatchObject({
      ok: false,
      reason: "not_found",
      message: "Run profile not found",
    });
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("returns missing_working_directory when profile cwd is empty", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      workingDirectory: null,
    });

    const result = await startManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "missing_working_directory",
    });
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("returns invalid_working_directory when cwd does not exist", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await startManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_working_directory",
    });
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("returns not_directory when cwd is not a directory", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as never);

    const result = await startManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "not_directory",
    });
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("returns invalid_command when profile command is empty", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      command: "   ",
    });

    const result = await startManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_command",
    });
    expect(runProfileProcessManager.start).not.toHaveBeenCalled();
  });

  it("starts managed process using saved profile command and cwd", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(runProfileProcessManager.start).mockReturnValue(managedSnapshot);

    const result = await startManagedRunProfile("rp-1");

    expect(runProfileProcessManager.start).toHaveBeenCalledWith({
      runProfileId: "rp-1",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
    });
    expect(createRunProfileRunForManagedStart).toHaveBeenCalledWith(
      managedSnapshot,
    );
    expect(result).toEqual({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is starting.",
      processManagerBootSessionId: "test-boot-session-id",
    });
  });
});

describe("stopManagedRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns disabled when command execution env flag is off", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(false);

    const result = await stopManagedRunProfile("rp-1");

    expect(result).toMatchObject({
      ok: false,
      reason: "disabled",
    });
    expect(runProfileProcessManager.stop).not.toHaveBeenCalled();
  });

  it("returns manager_error when no managed process exists", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(runProfileProcessManager.stop).mockReturnValue(null);

    const result = await stopManagedRunProfile("rp-unknown");

    expect(result).toMatchObject({
      ok: false,
      reason: "manager_error",
      message: "No managed process found for this run profile.",
    });
  });

  it("returns snapshot when stop succeeds", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(runProfileProcessManager.stop).mockReturnValue({
      ...managedSnapshot,
      status: "stopping",
      message: "Stop requested; sending SIGTERM.",
    });

    const result = await stopManagedRunProfile("rp-1");

    expect(runProfileProcessManager.stop).toHaveBeenCalledWith("rp-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot?.status).toBe("stopping");
    }
  });
});

describe("restartManagedRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidWorkingDirectory();
  });

  it("restarts managed process using saved profile command and cwd", async () => {
    vi.mocked(isCommandExecutionEnabled).mockReturnValue(true);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(runProfileProcessManager.restart).mockReturnValue(managedSnapshot);

    const result = await restartManagedRunProfile("rp-1");

    expect(runProfileProcessManager.restart).toHaveBeenCalledWith({
      runProfileId: "rp-1",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
    });
    expect(createRunProfileRunForManagedStart).toHaveBeenCalledWith(
      managedSnapshot,
    );
    expect(result.ok).toBe(true);
  });
});

describe("getManagedRunProfileSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns manager snapshot when process exists", () => {
    vi.mocked(runProfileProcessManager.getSnapshot).mockReturnValue(
      managedSnapshot,
    );

    const result = getManagedRunProfileSnapshot("rp-1");

    expect(runProfileProcessManager.getSnapshot).toHaveBeenCalledWith("rp-1");
    expect(result).toEqual({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is starting.",
      processManagerBootSessionId: "test-boot-session-id",
    });
  });

  it("returns null snapshot when process is not registered", () => {
    vi.mocked(runProfileProcessManager.getSnapshot).mockReturnValue(null);

    const result = getManagedRunProfileSnapshot("rp-missing");

    expect(result).toEqual({
      ok: true,
      snapshot: null,
      message: "No managed process for this run profile.",
      processManagerBootSessionId: "test-boot-session-id",
    });
  });
});

describe("listManagedRunProfileSnapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all manager snapshots", () => {
    vi.mocked(runProfileProcessManager.listSnapshots).mockReturnValue([
      managedSnapshot,
    ]);

    const result = listManagedRunProfileSnapshots();

    expect(runProfileProcessManager.listSnapshots).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      snapshot: null,
      snapshots: [managedSnapshot],
      message: "Found 1 managed process(es).",
      processManagerBootSessionId: "test-boot-session-id",
    });
  });
});

describe("listRunProfilesWithRecentRunsByProjectId", () => {
  const recentRun = {
    id: "run-1",
    runProfileId: "rp-1",
    status: "exited",
    command: "pnpm dev",
    workingDirectory: "/Users/dev/app",
    pid: 4242,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:01:00.000Z",
    exitCode: 0,
    signal: null,
    durationMs: 60_000,
    stdoutPreview: "ready",
    stderrPreview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:01:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads recent runs for each profile with a serializable shape", async () => {
    vi.mocked(db.projectRunProfile.findMany).mockResolvedValue([mockProfile]);
    vi.mocked(listRunProfileRuns).mockResolvedValue([recentRun]);

    const result = await listRunProfilesWithRecentRunsByProjectId("proj-1");

    expect(db.projectRunProfile.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    expect(listRunProfileRuns).toHaveBeenCalledWith("rp-1", 3);
    expect(result).toEqual([
      {
        id: "rp-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
        description: null,
        isDefault: true,
        recentRuns: [recentRun],
      },
    ]);
  });

  it("returns empty recentRuns arrays when no history exists", async () => {
    vi.mocked(db.projectRunProfile.findMany).mockResolvedValue([mockProfile]);
    vi.mocked(listRunProfileRuns).mockResolvedValue([]);

    const result = await listRunProfilesWithRecentRunsByProjectId("proj-1");

    expect(result[0]?.recentRuns).toEqual([]);
  });
});

describe("getRunProfileRunHistoryPageData", () => {
  const recentRun = {
    id: "run-1",
    runProfileId: "rp-1",
    status: "exited",
    command: "pnpm dev",
    workingDirectory: "/Users/dev/app",
    pid: 4242,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:01:00.000Z",
    exitCode: 0,
    signal: null,
    durationMs: 60_000,
    stdoutPreview: "ready",
    stderrPreview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:01:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns project, profile, and runs when the profile belongs to the project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(listRunProfileRuns).mockResolvedValue([recentRun]);

    const result = await getRunProfileRunHistoryPageData("proj-1", "rp-1");

    expect(listRunProfileRuns).toHaveBeenCalledWith("rp-1", 25);
    expect(result).toEqual({
      project: { id: "proj-1", name: "ManDev" },
      profile: {
        id: "rp-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
      },
      runs: [recentRun],
    });
  });

  it("returns null when the profile belongs to a different project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      projectId: "other-project",
    });

    await expect(
      getRunProfileRunHistoryPageData("proj-1", "rp-1"),
    ).resolves.toBeNull();
    expect(listRunProfileRuns).not.toHaveBeenCalled();
  });

  it("returns null when the project or profile is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(null);

    await expect(
      getRunProfileRunHistoryPageData("proj-1", "rp-1"),
    ).resolves.toBeNull();
  });
});

describe("getRunProfileRunDetailPageData", () => {
  const recentRun = {
    id: "run-1",
    runProfileId: "rp-1",
    status: "exited",
    command: "pnpm dev",
    workingDirectory: "/Users/dev/app",
    pid: 4242,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: "2026-01-01T00:01:00.000Z",
    exitCode: 0,
    signal: null,
    durationMs: 60_000,
    stdoutPreview: "ready",
    stderrPreview: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:01:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns project, profile, and run when ownership matches", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(getRunProfileRunById).mockResolvedValue(recentRun);

    const result = await getRunProfileRunDetailPageData(
      "proj-1",
      "rp-1",
      "run-1",
    );

    expect(getRunProfileRunById).toHaveBeenCalledWith("run-1");
    expect(result).toEqual({
      project: { id: "proj-1", name: "ManDev" },
      profile: {
        id: "rp-1",
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
      },
      run: recentRun,
    });
  });

  it("returns null when the run belongs to a different profile", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(getRunProfileRunById).mockResolvedValue({
      ...recentRun,
      runProfileId: "other-profile",
    });

    await expect(
      getRunProfileRunDetailPageData("proj-1", "rp-1", "run-1"),
    ).resolves.toBeNull();
  });

  it("returns null when the profile belongs to a different project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      projectId: "other-project",
    });
    vi.mocked(getRunProfileRunById).mockResolvedValue(recentRun);

    await expect(
      getRunProfileRunDetailPageData("proj-1", "rp-1", "run-1"),
    ).resolves.toBeNull();
    expect(getRunProfileRunById).not.toHaveBeenCalled();
  });

  it("returns null when the run is missing", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "ManDev",
    } as never);
    vi.mocked(db.projectRunProfile.findUnique).mockResolvedValue(mockProfile);
    vi.mocked(getRunProfileRunById).mockResolvedValue(null);

    await expect(
      getRunProfileRunDetailPageData("proj-1", "rp-1", "missing"),
    ).resolves.toBeNull();
  });
});
