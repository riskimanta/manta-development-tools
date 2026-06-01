import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";

import {
  getCommandPaletteRecent,
  searchCommandPalette,
} from "@/services/search";

vi.mock("@/lib/db", () => ({
  db: {
    project: { findMany: vi.fn() },
    feature: { findMany: vi.fn() },
  },
}));

const mockProjects = [
  {
    id: "proj-1",
    name: "ManDev",
    slug: "mandev",
    description: "Internal tools",
  },
];

const mockFeatures = [
  {
    id: "feat-1",
    title: "Dashboard hub",
    description: "Central landing page",
    status: "draft" as const,
    project: { name: "ManDev" },
  },
];

const projectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
} as const;

const featureSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  project: { select: { name: true } },
} as const;

describe("searchCommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty results for an empty query without calling Prisma", async () => {
    const result = await searchCommandPalette("");

    expect(result).toEqual({ projects: [], features: [] });
    expect(db.project.findMany).not.toHaveBeenCalled();
    expect(db.feature.findMany).not.toHaveBeenCalled();
  });

  it("returns empty results for a whitespace-only query without calling Prisma", async () => {
    const result = await searchCommandPalette("   \t  ");

    expect(result).toEqual({ projects: [], features: [] });
    expect(db.project.findMany).not.toHaveBeenCalled();
    expect(db.feature.findMany).not.toHaveBeenCalled();
  });

  it("trims the query before building Prisma filters", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await searchCommandPalette("  dashboard  ");

    expect(db.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "dashboard" } },
            { slug: { contains: "dashboard" } },
            { description: { contains: "dashboard" } },
          ],
        },
      }),
    );
    expect(db.feature.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { title: { contains: "dashboard" } },
            { description: { contains: "dashboard" } },
          ],
        },
      }),
    );
  });

  it("searches projects with OR filters on name, slug, and description", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await searchCommandPalette("mandev");

    expect(db.project.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "mandev" } },
          { slug: { contains: "mandev" } },
          { description: { contains: "mandev" } },
        ],
      },
      select: projectSelect,
      orderBy: { updatedAt: "desc" },
      take: 8,
    });
  });

  it("searches features with OR filters on title and description", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await searchCommandPalette("hub");

    expect(db.feature.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: "hub" } },
          { description: { contains: "hub" } },
        ],
      },
      select: featureSelect,
      orderBy: { updatedAt: "desc" },
      take: 8,
    });
  });

  it("limits project and feature results to 8 each ordered by updatedAt desc", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await searchCommandPalette("test");

    expect(db.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    );
    expect(db.feature.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    );
  });

  it("returns mocked project and feature results", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue(
      mockProjects as Awaited<ReturnType<typeof db.project.findMany>>,
    );
    vi.mocked(db.feature.findMany).mockResolvedValue(
      mockFeatures as unknown as Awaited<
        ReturnType<typeof db.feature.findMany>
      >,
    );

    const result = await searchCommandPalette("mandev");

    expect(result).toEqual({
      projects: mockProjects,
      features: mockFeatures,
    });
  });
});

describe("getCommandPaletteRecent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls project and feature findMany", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await getCommandPaletteRecent();

    expect(db.project.findMany).toHaveBeenCalledOnce();
    expect(db.feature.findMany).toHaveBeenCalledOnce();
  });

  it("limits recent projects and features to 5 each ordered by updatedAt desc", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue([]);
    vi.mocked(db.feature.findMany).mockResolvedValue([]);

    await getCommandPaletteRecent();

    expect(db.project.findMany).toHaveBeenCalledWith({
      select: projectSelect,
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
    expect(db.feature.findMany).toHaveBeenCalledWith({
      select: featureSelect,
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
  });

  it("returns mocked recent projects and features", async () => {
    vi.mocked(db.project.findMany).mockResolvedValue(
      mockProjects as Awaited<ReturnType<typeof db.project.findMany>>,
    );
    vi.mocked(db.feature.findMany).mockResolvedValue(
      mockFeatures as unknown as Awaited<
        ReturnType<typeof db.feature.findMany>
      >,
    );

    const result = await getCommandPaletteRecent();

    expect(result).toEqual({
      projects: mockProjects,
      features: mockFeatures,
    });
  });
});
