import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import { readRunProfilesImportFromLocalPath } from "@/lib/local-run-profiles-import";

import {
  createRunProfileRecord,
  importProjectRunProfilesFromLocalFile,
  previewProjectRunProfilesImportFromLocalFile,
  resolveRunProfileWorkingDirectory,
  updateRunProfileRecord,
} from "@/services/run-profiles";

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
