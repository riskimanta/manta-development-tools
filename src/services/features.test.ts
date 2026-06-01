import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import type { FeatureCreateInput } from "@/lib/validations/feature";
import {
  createFeatureRecord,
  deleteFeatureRecord,
  getFeatureById,
  listFeatures,
  updateFeatureRecord,
} from "@/services/features";

vi.mock("@/lib/db", () => ({
  db: {
    feature: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const featureInputBase: Omit<FeatureCreateInput, "priority"> = {
  projectId: "proj-1",
  title: "Dashboard hub",
  description: null,
  status: "draft",
};

const mockFeatureRecord = {
  id: "feat-1",
  projectId: "proj-1",
  title: "Dashboard hub",
  description: null,
  status: "draft" as const,
  priority: null,
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
};

const projectInclude = {
  project: { select: { id: true, name: true, slug: true } },
} as const;

const mockFeatureListItem = {
  id: "feat-1",
  title: "Dashboard hub",
  status: "draft" as const,
  projectId: "proj-1",
  project: { id: "proj-1", name: "ManDev", slug: "mandev" },
};

const mockFeatureDetail = {
  id: "feat-1",
  title: "Dashboard hub",
  description: "Central landing page",
  status: "draft" as const,
  projectId: "proj-1",
  project: {
    id: "proj-1",
    name: "ManDev",
    slug: "mandev",
    repoUrl: "https://github.com/example/mandev",
    localPath: "/Users/dev/mandev",
  },
};

describe("listFeatures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findMany with empty where and default orderBy when no filters", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures();

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("includes status in where when status filter is set", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ status: "in_progress" });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { status: "in_progress" },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("includes projectId in where when project filter is set", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ projectId: "proj-1" });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("includes both status and projectId when both filters are set", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ status: "done", projectId: "proj-2" });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj-2", status: "done" },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("excludes done status when excludeDone is set without status filter", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ excludeDone: true });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { status: { not: "done" } },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("does not exclude done when an explicit status filter is set", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ status: "done", excludeDone: true });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { status: "done" },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("includes priority band in where when priorityBand is set", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({ priorityBand: "medium" });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: { priority: { gte: 34, lte: 66 } },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("combines excludeDone, projectId, and priorityBand filters", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({
      excludeDone: true,
      projectId: "proj-1",
      priorityBand: "high",
    });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: {
        projectId: "proj-1",
        status: { not: "done" },
        priority: { gte: 67, lte: 100 },
      },
      orderBy: { updatedAt: "desc" },
      include: projectInclude,
    });
  });

  it("passes custom orderBy to findMany", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await listFeatures({}, { title: "asc" });

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { title: "asc" },
      include: projectInclude,
    });
  });

  it("returns mocked feature list", async () => {
    vi.mocked(db.feature.findMany).mockResolvedValue(
      [mockFeatureListItem] as unknown as Awaited<
        ReturnType<typeof db.feature.findMany>
      >,
    );

    const result = await listFeatures();

    expect(result).toEqual([mockFeatureListItem]);
  });
});

describe("getFeatureById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findUnique with id and project fields needed for Cursor Prompt", async () => {
    vi.mocked(db.feature.findUnique).mockResolvedValue(null);

    await getFeatureById("feat-1");

    expect(db.feature.findUnique).toHaveBeenCalledWith({
      where: { id: "feat-1" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            repoUrl: true,
            localPath: true,
          },
        },
      },
    });
  });

  it("returns mocked feature data", async () => {
    vi.mocked(db.feature.findUnique).mockResolvedValue(
      mockFeatureDetail as unknown as Awaited<
        ReturnType<typeof db.feature.findUnique>
      >,
    );

    const result = await getFeatureById("feat-1");

    expect(result).toEqual(mockFeatureDetail);
  });
});

describe("createFeatureRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.feature.create).mockResolvedValue(
      mockFeatureRecord as Awaited<ReturnType<typeof db.feature.create>>,
    );
  });

  it("normalizes undefined priority to null", async () => {
    await createFeatureRecord({ ...featureInputBase, priority: undefined });

    expect(db.feature.create).toHaveBeenCalledWith({
      data: { ...featureInputBase, priority: null },
    });
  });

  it("keeps null priority as null", async () => {
    await createFeatureRecord({ ...featureInputBase, priority: null });

    expect(db.feature.create).toHaveBeenCalledWith({
      data: { ...featureInputBase, priority: null },
    });
  });

  it("preserves numeric priority", async () => {
    await createFeatureRecord({ ...featureInputBase, priority: 42 });

    expect(db.feature.create).toHaveBeenCalledWith({
      data: { ...featureInputBase, priority: 42 },
    });
  });

  it("returns mocked create result", async () => {
    const result = await createFeatureRecord(featureInputBase);

    expect(result).toEqual(mockFeatureRecord);
  });
});

describe("updateFeatureRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.feature.update).mockResolvedValue(
      mockFeatureRecord as Awaited<ReturnType<typeof db.feature.update>>,
    );
  });

  it("calls feature.update with id where and normalized priority", async () => {
    await updateFeatureRecord("feat-1", {
      ...featureInputBase,
      priority: 10,
    });

    expect(db.feature.update).toHaveBeenCalledWith({
      where: { id: "feat-1" },
      data: { ...featureInputBase, priority: 10 },
    });
  });

  it("normalizes undefined priority to null on update", async () => {
    await updateFeatureRecord("feat-1", {
      ...featureInputBase,
      priority: undefined,
    });

    expect(db.feature.update).toHaveBeenCalledWith({
      where: { id: "feat-1" },
      data: { ...featureInputBase, priority: null },
    });
  });

  it("returns mocked update result", async () => {
    const result = await updateFeatureRecord("feat-1", featureInputBase);

    expect(result).toEqual(mockFeatureRecord);
  });
});

describe("deleteFeatureRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds feature projectId, deletes, and returns projectId payload", async () => {
    vi.mocked(db.feature.findUnique).mockResolvedValue({
      projectId: "proj-1",
    } as Awaited<ReturnType<typeof db.feature.findUnique>>);
    vi.mocked(db.feature.delete).mockResolvedValue(
      mockFeatureRecord as Awaited<ReturnType<typeof db.feature.delete>>,
    );

    const result = await deleteFeatureRecord("feat-1");

    expect(db.feature.findUnique).toHaveBeenCalledWith({
      where: { id: "feat-1" },
      select: { projectId: true },
    });
    expect(db.feature.delete).toHaveBeenCalledWith({ where: { id: "feat-1" } });
    expect(result).toEqual({ projectId: "proj-1" });
  });

  it("returns null and does not delete when feature is missing", async () => {
    vi.mocked(db.feature.findUnique).mockResolvedValue(null);

    const result = await deleteFeatureRecord("missing");

    expect(db.feature.delete).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
