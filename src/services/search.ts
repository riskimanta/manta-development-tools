import type { FeatureStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type CommandPaletteProjectHit = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CommandPaletteFeatureHit = {
  id: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  project: { name: string };
};

export type CommandPaletteSearchResult = {
  projects: CommandPaletteProjectHit[];
  features: CommandPaletteFeatureHit[];
};

const PROJECT_LIMIT = 8;
const FEATURE_LIMIT = 8;
const RECENT_LIMIT = 5;

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

export async function searchCommandPalette(
  query: string,
): Promise<CommandPaletteSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { projects: [], features: [] };
  }

  const [projects, features] = await Promise.all([
    db.project.findMany({
      where: {
        OR: [
          { name: { contains: trimmed } },
          { slug: { contains: trimmed } },
          { description: { contains: trimmed } },
        ],
      },
      select: projectSelect,
      orderBy: { updatedAt: "desc" },
      take: PROJECT_LIMIT,
    }),
    db.feature.findMany({
      where: {
        OR: [
          { title: { contains: trimmed } },
          { description: { contains: trimmed } },
        ],
      },
      select: featureSelect,
      orderBy: { updatedAt: "desc" },
      take: FEATURE_LIMIT,
    }),
  ]);

  return { projects, features };
}

export async function getCommandPaletteRecent(): Promise<CommandPaletteSearchResult> {
  const [projects, features] = await Promise.all([
    db.project.findMany({
      select: projectSelect,
      orderBy: { updatedAt: "desc" },
      take: RECENT_LIMIT,
    }),
    db.feature.findMany({
      select: featureSelect,
      orderBy: { updatedAt: "desc" },
      take: RECENT_LIMIT,
    }),
  ]);

  return { projects, features };
}
