import type { Prisma, Project } from "@prisma/client";

import { db } from "@/lib/db";
import type { ProjectCreateInput } from "@/lib/validations/project";

export function listProjects(orderBy: Prisma.ProjectOrderByWithRelationInput = { updatedAt: "desc" }) {
  return db.project.findMany({
    orderBy,
    include: {
      _count: { select: { features: true } },
    },
  });
}

export function getProjectById(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      features: { orderBy: { updatedAt: "desc" } },
      _count: { select: { features: true } },
    },
  });
}

export function getProjectBySlug(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      features: { orderBy: { updatedAt: "desc" } },
      _count: { select: { features: true } },
    },
  });
}

export function createProjectRecord(data: ProjectCreateInput): Promise<Project> {
  return db.project.create({ data });
}

export function updateProjectRecord(
  id: string,
  data: ProjectCreateInput,
): Promise<Project> {
  return db.project.update({ where: { id }, data });
}

export function deleteProjectRecord(id: string): Promise<Project> {
  return db.project.delete({ where: { id } });
}
