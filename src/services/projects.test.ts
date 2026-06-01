import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import type { ProjectCreateInput } from "@/lib/validations/project";
import {
  createProjectRecord,
  deleteProjectRecord,
  getProjectById,
  getProjectBySlug,
  listProjects,
  updateProjectRecord,
} from "@/services/projects";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const projectInput: ProjectCreateInput = {
  name: "ManDev",
  slug: "mandev",
  description: "Internal tools",
  repoUrl: null,
  localPath: null,
};

const mockProjectRecord = {
  id: "proj-1",
  name: "ManDev",
  slug: "mandev",
  description: "Internal tools",
  repoUrl: null,
  localPath: null,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};

const mockProject = {
  id: "proj-1",
  name: "ManDev",
  slug: "mandev",
  description: "Internal tools",
  _count: { features: 2 },
  features: [
    {
      id: "feat-1",
      title: "Dashboard hub",
      updatedAt: new Date("2026-05-01"),
    },
  ],
};

describe("listProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findMany with default orderBy and feature count include", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);

    await listProjects();

    expect(db.project.findMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { features: true } },
      },
    });
  });

  it("passes custom orderBy to findMany", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);

    await listProjects({ name: "asc" });

    expect(db.project.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { features: true } },
      },
    });
  });

  it("returns mocked project list", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue(
      [mockProject] as unknown as Awaited<ReturnType<typeof db.project.findMany>>,
    );

    const result = await listProjects();

    expect(result).toEqual([mockProject]);
  });
});

describe("getProjectById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findUnique with id and includes features ordered by updatedAt desc", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await getProjectById("proj-1");

    expect(db.project.findUnique).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      include: {
        features: { orderBy: { updatedAt: "desc" } },
        _count: { select: { features: true } },
      },
    });
  });

  it("returns mocked project data", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      mockProject as unknown as Awaited<ReturnType<typeof db.project.findUnique>>,
    );

    const result = await getProjectById("proj-1");

    expect(result).toEqual(mockProject);
  });
});

describe("getProjectBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findUnique with slug and same include shape as getProjectById", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);

    await getProjectBySlug("mandev");

    expect(db.project.findUnique).toHaveBeenCalledWith({
      where: { slug: "mandev" },
      include: {
        features: { orderBy: { updatedAt: "desc" } },
        _count: { select: { features: true } },
      },
    });
  });

  it("returns mocked project data", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      mockProject as unknown as Awaited<ReturnType<typeof db.project.findUnique>>,
    );

    const result = await getProjectBySlug("mandev");

    expect(result).toEqual(mockProject);
  });
});

describe("createProjectRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls project.create with input data", async () => {
    vi.mocked(db.project.create).mockResolvedValue(
      mockProjectRecord as Awaited<ReturnType<typeof db.project.create>>,
    );

    const result = await createProjectRecord(projectInput);

    expect(db.project.create).toHaveBeenCalledWith({ data: projectInput });
    expect(result).toEqual(mockProjectRecord);
  });
});

describe("updateProjectRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls project.update with id where and input data", async () => {
    vi.mocked(db.project.update).mockResolvedValue(
      mockProjectRecord as Awaited<ReturnType<typeof db.project.update>>,
    );

    const result = await updateProjectRecord("proj-1", projectInput);

    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: projectInput,
    });
    expect(result).toEqual(mockProjectRecord);
  });
});

describe("deleteProjectRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls project.delete with id where", async () => {
    vi.mocked(db.project.delete).mockResolvedValue(
      mockProjectRecord as Awaited<ReturnType<typeof db.project.delete>>,
    );

    const result = await deleteProjectRecord("proj-1");

    expect(db.project.delete).toHaveBeenCalledWith({ where: { id: "proj-1" } });
    expect(result).toEqual(mockProjectRecord);
  });
});
