import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import {
  createRunProfileRecord,
  resolveRunProfileWorkingDirectory,
  updateRunProfileRecord,
} from "@/services/run-profiles";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    projectRunProfile: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
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
