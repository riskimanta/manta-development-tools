import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { readArchitectureImportFromLocalPath } from "@/lib/local-architecture-import";

import {
  ArchitectureImportServiceError,
  importProjectArchitectureFromLocalFile,
} from "@/services/architectures";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    projectArchitecture: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/local-architecture-import", () => ({
  readArchitectureImportFromLocalPath: vi.fn(),
}));

const mockArchitecture = {
  id: "arch-1",
  projectId: "proj-1",
  summary: "Imported summary",
  mermaidSource: "flowchart TD\n  A --> B",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("importProjectArchitectureFromLocalFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when project is not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await expect(
      importProjectArchitectureFromLocalFile("missing"),
    ).rejects.toMatchObject({
      code: "PROJECT_NOT_FOUND",
      message: "Project not found",
    });
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
      importProjectArchitectureFromLocalFile("proj-1"),
    ).rejects.toMatchObject({
      code: "LOCAL_PATH_MISSING",
    });
  });

  it("upserts architecture from validated local import file", async () => {
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
    vi.mocked(readArchitectureImportFromLocalPath).mockResolvedValue({
      ok: true,
      data: {
        summary: "Imported summary",
        mermaidSource: "flowchart TD\n  A --> B",
      },
    });
    vi.mocked(db.projectArchitecture.upsert).mockResolvedValue(
      mockArchitecture,
    );

    const result = await importProjectArchitectureFromLocalFile("proj-1");

    expect(readArchitectureImportFromLocalPath).toHaveBeenCalledWith(
      "/Users/dev/app",
    );
    expect(db.projectArchitecture.upsert).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      create: {
        projectId: "proj-1",
        summary: "Imported summary",
        mermaidSource: "flowchart TD\n  A --> B",
      },
      update: {
        summary: "Imported summary",
        mermaidSource: "flowchart TD\n  A --> B",
      },
    });
    expect(result).toEqual(mockArchitecture);
  });

  it("throws import errors from the file reader", async () => {
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
    vi.mocked(readArchitectureImportFromLocalPath).mockResolvedValue({
      ok: false,
      code: "FILE_MISSING",
      message:
        "Could not find `.mandev/architecture.json` at the configured local path. Create the file in your target project first, then try again.",
    });

    await expect(
      importProjectArchitectureFromLocalFile("proj-1"),
    ).rejects.toBeInstanceOf(ArchitectureImportServiceError);
  });
});
