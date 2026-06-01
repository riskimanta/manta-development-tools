import type { Feature, FeatureStatus, Prisma } from "@prisma/client";

import { priorityBandToWhere, type FeaturePriorityBand } from "@/lib/backlog";
import { db } from "@/lib/db";
import type { FeatureCreateInput } from "@/lib/validations/feature";

export type FeatureListFilters = {
  projectId?: string;
  status?: FeatureStatus;
  /** When true and `status` is unset, excludes `done` features (backlog view). */
  excludeDone?: boolean;
  priorityBand?: FeaturePriorityBand;
};

export function listFeatures(
  filters: FeatureListFilters = {},
  orderBy: Prisma.FeatureOrderByWithRelationInput = { updatedAt: "desc" },
) {
  const where: Prisma.FeatureWhereInput = {};
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.status) {
    where.status = filters.status;
  } else if (filters.excludeDone) {
    where.status = { not: "done" };
  }
  if (filters.priorityBand) {
    where.priority = priorityBandToWhere(filters.priorityBand);
  }

  return db.feature.findMany({
    where,
    orderBy,
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
  });
}

export function getFeatureById(id: string) {
  return db.feature.findUnique({
    where: { id },
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
}

function normalizeFeaturePriority(
  priority: FeatureCreateInput["priority"],
): number | null {
  return priority === undefined || priority === null ? null : priority;
}

export function createFeatureRecord(data: FeatureCreateInput): Promise<Feature> {
  return db.feature.create({
    data: {
      ...data,
      priority: normalizeFeaturePriority(data.priority),
    },
  });
}

export function updateFeatureRecord(
  id: string,
  data: FeatureCreateInput,
): Promise<Feature> {
  return db.feature.update({
    where: { id },
    data: {
      ...data,
      priority: normalizeFeaturePriority(data.priority),
    },
  });
}

export async function deleteFeatureRecord(
  id: string,
): Promise<{ projectId: string } | null> {
  const existing = await db.feature.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!existing) {
    return null;
  }
  await db.feature.delete({ where: { id } });
  return existing;
}
