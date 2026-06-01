import { db } from "@/lib/db";

export async function getDashboardOverview() {
  const [projectCount, statusGroups, recentProjects, recentFeatures] =
    await Promise.all([
      db.project.count(),
      db.feature.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { _count: { select: { features: true } } },
      }),
      db.feature.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          project: { select: { name: true, slug: true } },
        },
      }),
    ]);

  const featuresByStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Record<string, number>;

  return {
    projectCount,
    featuresByStatus,
    recentProjects,
    recentFeatures,
  };
}
