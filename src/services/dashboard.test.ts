import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import { getDashboardOverview } from "@/services/dashboard";

vi.mock("@/lib/db", () => ({
  db: {
    project: { count: vi.fn(), findMany: vi.fn() },
    feature: { groupBy: vi.fn(), findMany: vi.fn() },
  },
}));

const mockRecentProjects = [
  {
    id: "proj-1",
    name: "ManDev",
    slug: "mandev",
    updatedAt: new Date("2026-05-01"),
    _count: { features: 3 },
  },
];

const mockRecentFeatures = [
  {
    id: "feat-1",
    title: "Dashboard hub",
    updatedAt: new Date("2026-05-02"),
    project: { name: "ManDev", slug: "mandev" },
  },
];

describe("getDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.project.count).mockResolvedValue(0);
    vi.mocked(db.feature.groupBy).mockResolvedValue([]);
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);
  });

  it("queries project count, status groups, and recent lists in parallel", async () => {
    await getDashboardOverview();

    expect(db.project.count).toHaveBeenCalledOnce();
    expect(db.feature.groupBy).toHaveBeenCalledOnce();
    expect(db.project.findMany).toHaveBeenCalledOnce();
    expect(db.feature.findMany).toHaveBeenCalledOnce();
  });

  it("groups features by status with counts", async () => {
    await getDashboardOverview();

    expect(db.feature.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      _count: { _all: true },
    });
  });

  it("limits recent projects to 6 ordered by updatedAt desc with feature counts", async () => {
    await getDashboardOverview();

    expect(db.project.findMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { _count: { select: { features: true } } },
    });
  });

  it("limits recent features to 10 ordered by updatedAt desc with project name/slug", async () => {
    await getDashboardOverview();

    expect(db.feature.findMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        project: { select: { name: true, slug: true } },
      },
    });
  });

  it("maps status groupBy results into featuresByStatus", async () => {
    vi.mocked(db.project.count).mockResolvedValue(2);
    vi.mocked(db.feature.groupBy).mockResolvedValue([
      { status: "draft", _count: { _all: 4 } },
      { status: "done", _count: { _all: 1 } },
    ] as Awaited<ReturnType<typeof db.feature.groupBy>>);
    vi.mocked(db.project.findMany).mockResolvedValue(
      mockRecentProjects as unknown as Awaited<
        ReturnType<typeof db.project.findMany>
      >,
    );
    vi.mocked(db.feature.findMany).mockResolvedValue(
      mockRecentFeatures as unknown as Awaited<
        ReturnType<typeof db.feature.findMany>
      >,
    );

    const result = await getDashboardOverview();

    expect(result).toEqual({
      projectCount: 2,
      featuresByStatus: { draft: 4, done: 1 },
      recentProjects: mockRecentProjects,
      recentFeatures: mockRecentFeatures,
    });
  });

  it("handles empty mocked data cleanly", async () => {
    const result = await getDashboardOverview();

    expect(result).toEqual({
      projectCount: 0,
      featuresByStatus: {},
      recentProjects: [],
      recentFeatures: [],
    });
  });
});
