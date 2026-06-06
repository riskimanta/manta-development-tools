import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProjectById } from "@/services/projects";
import {
  createRunProfileRecord,
  deleteRunProfileRecord,
  executeRunProfileCommand,
  getManagedRunProfileSnapshot,
  importProjectRunProfilesFromLocalFile,
  listManagedRunProfileSnapshots,
  previewProjectRunProfilesImportFromLocalFile,
  restartManagedRunProfile,
  startManagedRunProfile,
  stopManagedRunProfile,
  updateRunProfileRecord,
} from "@/services/run-profiles";

import {
  createRunProfile,
  deleteRunProfile,
  executeRunProfileAction,
  getManagedRunProfileSnapshotAction,
  importRunProfilesFromLocalPathAction,
  listManagedRunProfileSnapshotsAction,
  previewRunProfilesImportFromLocalPathAction,
  restartManagedRunProfileAction,
  startManagedRunProfileAction,
  stopManagedRunProfileAction,
  updateRunProfile,
} from "./actions";

vi.mock("@/services/run-profiles", () => ({
  createRunProfileRecord: vi.fn(),
  updateRunProfileRecord: vi.fn(),
  deleteRunProfileRecord: vi.fn(),
  executeRunProfileCommand: vi.fn(),
  startManagedRunProfile: vi.fn(),
  stopManagedRunProfile: vi.fn(),
  restartManagedRunProfile: vi.fn(),
  getManagedRunProfileSnapshot: vi.fn(),
  listManagedRunProfileSnapshots: vi.fn(),
  importProjectRunProfilesFromLocalFile: vi.fn(),
  previewProjectRunProfilesImportFromLocalFile: vi.fn(),
  RunProfileServiceError: class RunProfileServiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  RunProfileImportServiceError: class RunProfileImportServiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/services/projects", () => ({
  getProjectById: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function validRunProfileForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("projectId", "proj-1");
  formData.set("name", "Dev server");
  formData.set("command", "pnpm dev");
  formData.set("workingDirectory", "/Users/dev/app");
  formData.set("description", "Local Next.js");
  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }
  return formData;
}

describe("createRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectById).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
  });

  it("returns field errors when validation fails", async () => {
    const result = await createRunProfile(
      undefined,
      validRunProfileForm({ command: "" }),
    );

    expect(result.fieldErrors?.command).toBeDefined();
    expect(createRunProfileRecord).not.toHaveBeenCalled();
  });

  it("creates profile and revalidates project page on success", async () => {
    vi.mocked(createRunProfileRecord).mockResolvedValue({
      id: "rp-1",
      projectId: "proj-1",
      name: "Dev server",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
      description: "Local Next.js",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createRunProfile(undefined, validRunProfileForm());

    expect(createRunProfileRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        name: "Dev server",
        command: "pnpm dev",
      }),
      "/Users/dev/app",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({ ok: true, message: "Run profile created" });
  });
});

describe("updateRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjectById).mockResolvedValue({
      id: "proj-1",
      localPath: "/Users/dev/app",
    } as never);
  });

  it("updates profile and revalidates on success", async () => {
    const formData = validRunProfileForm();
    formData.set("id", "rp-1");
    formData.set("isDefault", "on");

    vi.mocked(updateRunProfileRecord).mockResolvedValue({
      id: "rp-1",
      projectId: "proj-1",
      name: "Dev server",
      command: "pnpm dev",
      workingDirectory: "/Users/dev/app",
      description: "Local Next.js",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateRunProfile(undefined, formData);

    expect(updateRunProfileRecord).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({ ok: true, message: "Run profile updated" });
  });
});

describe("previewRunProfilesImportFromLocalPathAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when project id is missing", async () => {
    const result = await previewRunProfilesImportFromLocalPathAction("  ");

    expect(result).toEqual({ ok: false, message: "Project is required" });
    expect(previewProjectRunProfilesImportFromLocalFile).not.toHaveBeenCalled();
  });

  it("returns preview data without importing", async () => {
    vi.mocked(previewProjectRunProfilesImportFromLocalFile).mockResolvedValue({
      totalInFile: 1,
      create: [
        {
          name: "Build",
          command: "pnpm build",
          workingDirectory: "/Users/dev/app",
          description: null,
          isDefault: false,
        },
      ],
      update: [],
      unchanged: [],
      kept: [],
      currentDefaultName: null,
      nextDefaultName: null,
      defaultWillChange: false,
    });

    const result = await previewRunProfilesImportFromLocalPathAction("proj-1");

    expect(previewProjectRunProfilesImportFromLocalFile).toHaveBeenCalledWith(
      "proj-1",
    );
    expect(importProjectRunProfilesFromLocalFile).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preview.create).toHaveLength(1);
    }
  });
});

describe("importRunProfilesFromLocalPathAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when project id is missing", async () => {
    const formData = new FormData();

    const result = await importRunProfilesFromLocalPathAction(
      undefined,
      formData,
    );

    expect(result).toEqual({ message: "Project is required" });
    expect(importProjectRunProfilesFromLocalFile).not.toHaveBeenCalled();
  });

  it("imports profiles and revalidates on success", async () => {
    vi.mocked(importProjectRunProfilesFromLocalFile).mockResolvedValue({
      created: 2,
      updated: 0,
    });

    const formData = new FormData();
    formData.set("projectId", "proj-1");

    const result = await importRunProfilesFromLocalPathAction(
      undefined,
      formData,
    );

    expect(importProjectRunProfilesFromLocalFile).toHaveBeenCalledWith(
      "proj-1",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
    expect(result).toEqual({
      ok: true,
      message: "Run profiles loaded from local path",
    });
  });
});

describe("executeRunProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns blocked when profile id is missing", async () => {
    const result = await executeRunProfileAction("  ");

    expect(result.status).toBe("blocked");
    expect(executeRunProfileCommand).not.toHaveBeenCalled();
  });

  it("returns execution result from service", async () => {
    vi.mocked(executeRunProfileCommand).mockResolvedValue({
      status: "success",
      exitCode: 0,
      stdoutPreview: "done",
      stderrPreview: "",
      message: "Command finished with exit code 0.",
    });

    const result = await executeRunProfileAction("rp-1");

    expect(executeRunProfileCommand).toHaveBeenCalledWith("rp-1");
    expect(result.status).toBe("success");
  });

  it("maps RunProfileServiceError to blocked result", async () => {
    const { RunProfileServiceError } = await import("@/services/run-profiles");
    vi.mocked(executeRunProfileCommand).mockRejectedValue(
      new RunProfileServiceError("RUN_PROFILE_NOT_FOUND", "Run profile not found"),
    );

    const result = await executeRunProfileAction("missing");

    expect(result).toEqual({
      status: "blocked",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message: "Run profile not found",
    });
  });
});

const managedSnapshot = {
  runProfileId: "rp-1",
  status: "running" as const,
  pid: 1234,
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  startedAt: "2026-01-01T00:00:00.000Z",
  stoppedAt: null,
  exitedAt: null,
  exitCode: null,
  signal: null,
  message: "Process is running.",
  logs: {
    stdout: "ready",
    stderr: "",
    stdoutTruncated: false,
    stderrTruncated: false,
  },
};

describe("startManagedRunProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when profile id is missing", async () => {
    const result = await startManagedRunProfileAction("  ");

    expect(result).toEqual({
      ok: false,
      snapshot: null,
      message: "Run profile is required.",
      reason: "not_found",
    });
    expect(startManagedRunProfile).not.toHaveBeenCalled();
  });

  it("delegates to service and returns result", async () => {
    vi.mocked(startManagedRunProfile).mockResolvedValue({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is running.",
    });

    const result = await startManagedRunProfileAction("rp-1");

    expect(startManagedRunProfile).toHaveBeenCalledWith("rp-1");
    expect(result.ok).toBe(true);
  });
});

describe("stopManagedRunProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when profile id is missing", async () => {
    const result = await stopManagedRunProfileAction("");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_found");
    }
    expect(stopManagedRunProfile).not.toHaveBeenCalled();
  });

  it("delegates to service and returns result", async () => {
    vi.mocked(stopManagedRunProfile).mockResolvedValue({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is running.",
    });

    const result = await stopManagedRunProfileAction("rp-1");

    expect(stopManagedRunProfile).toHaveBeenCalledWith("rp-1");
    expect(result.ok).toBe(true);
  });
});

describe("restartManagedRunProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to service and returns result", async () => {
    vi.mocked(restartManagedRunProfile).mockResolvedValue({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is starting.",
    });

    const result = await restartManagedRunProfileAction("rp-1");

    expect(restartManagedRunProfile).toHaveBeenCalledWith("rp-1");
    expect(result.ok).toBe(true);
  });
});

describe("getManagedRunProfileSnapshotAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to service and returns snapshot", async () => {
    vi.mocked(getManagedRunProfileSnapshot).mockReturnValue({
      ok: true,
      snapshot: managedSnapshot,
      message: "Process is running.",
    });

    const result = await getManagedRunProfileSnapshotAction("rp-1");

    expect(getManagedRunProfileSnapshot).toHaveBeenCalledWith("rp-1");
    expect(result.ok).toBe(true);
  });
});

describe("listManagedRunProfileSnapshotsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to service and returns snapshots", async () => {
    vi.mocked(listManagedRunProfileSnapshots).mockReturnValue({
      ok: true,
      snapshot: null,
      snapshots: [managedSnapshot],
      message: "Found 1 managed process(es).",
    });

    const result = await listManagedRunProfileSnapshotsAction();

    expect(listManagedRunProfileSnapshots).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshots).toHaveLength(1);
    }
  });
});

describe("deleteRunProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes profile and revalidates project page", async () => {
    const formData = new FormData();
    formData.set("id", "rp-1");
    formData.set("projectId", "proj-1");

    await deleteRunProfile(formData);

    expect(deleteRunProfileRecord).toHaveBeenCalledWith("rp-1");
    expect(revalidatePath).toHaveBeenCalledWith("/projects/proj-1");
  });
});
