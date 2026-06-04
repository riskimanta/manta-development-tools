import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import { readRunProfilesImportFromLocalPath } from "@/lib/local-run-profiles-import";

import {
  createRunProfileRecord,
  importProjectRunProfilesFromLocalFile,
  resolveImportedRunProfileWorkingDirectory,
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

describe("resolveImportedRunProfileWorkingDirectory", () => {
  it('maps "." to project local path', () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(".", "/Users/dev/app"),
    ).toBe("/Users/dev/app");
  });

  it("resolves relative paths against project local path", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory("apps/web", "/Users/dev/app"),
    ).toBe("/Users/dev/app/apps/web");
  });

  it("keeps absolute paths as-is", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(
        "/opt/run",
        "/Users/dev/app",
      ),
    ).toBe("/opt/run");
  });

  it("falls back to local path when working directory is missing", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(null, "/Users/dev/app"),
    ).toBe("/Users/dev/app");
  });
});

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
