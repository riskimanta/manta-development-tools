import type { FeatureStatus, Prisma } from "@prisma/client";

import { featureStatuses } from "@/lib/validations/feature";

/** Slug for the internal ManDev product project. */
export const MANDEV_PROJECT_SLUG = "mandev";

export const featurePriorityBands = [
  "low",
  "medium",
  "high",
  "unset",
] as const;

export type FeaturePriorityBand = (typeof featurePriorityBands)[number];

/** Canonical numeric priority for “medium” backlog items (0–100 scale). */
export const FEATURE_PRIORITY_MEDIUM = 50;

export type BacklogListFilterParams = {
  status?: string;
  projectId?: string;
  priority?: string;
};

export function isFeatureStatus(s: string): s is (typeof featureStatuses)[number] {
  return (featureStatuses as readonly string[]).includes(s);
}

export function isFeaturePriorityBand(
  s: string,
): s is FeaturePriorityBand {
  return (featurePriorityBands as readonly string[]).includes(s);
}

export function priorityBandLabel(band: FeaturePriorityBand): string {
  const map: Record<FeaturePriorityBand, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    unset: "Unset",
  };
  return map[band];
}

/** Maps a priority band to a Prisma `priority` where clause. */
export function priorityBandToWhere(
  band: FeaturePriorityBand,
): Prisma.IntNullableFilter {
  switch (band) {
    case "low":
      return { gte: 0, lte: 33 };
    case "medium":
      return { gte: 34, lte: 66 };
    case "high":
      return { gte: 67, lte: 100 };
    case "unset":
      return { equals: null };
  }
}

export function isMandevProjectSlug(slug: string): boolean {
  return slug === MANDEV_PROJECT_SLUG;
}

export function buildBacklogListHref(
  params: BacklogListFilterParams = {},
): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.projectId) search.set("projectId", params.projectId);
  if (params.priority) search.set("priority", params.priority);
  const qs = search.toString();
  return qs ? `/backlog?${qs}` : "/backlog";
}

export const MANDEV_PROJECT_CALLOUT =
  'Create a project with slug "mandev" to track ManDev’s own product backlog separately from client/project work.';

export const BACKLOG_EMPTY_STATE = {
  title: "No backlog items yet",
  description:
    "Create a feature under a project to start building the backlog.",
} as const;

export type BacklogEmptyStateParams = {
  status?: FeatureStatus;
  projectId?: string;
  projectName?: string;
  statusLabel?: string;
  priorityBand?: FeaturePriorityBand;
  priorityLabel?: string;
};

export function getBacklogEmptyStateCopy(
  params: BacklogEmptyStateParams = {},
): {
  title: string;
  description: string;
  actions: { label: string; href: string; variant?: "default" | "outline" }[];
} {
  const { status, projectId, projectName, statusLabel, priorityBand, priorityLabel } =
    params;
  const hasStatus = Boolean(status);
  const hasProject = Boolean(projectId);
  const hasPriority = Boolean(priorityBand);
  const statusText = statusLabel ?? status ?? "selected";
  const projectText = projectName ?? "this project";
  const priorityText = priorityLabel ?? priorityBand ?? "selected";

  if (!hasStatus && !hasProject && !hasPriority) {
    return {
      title: BACKLOG_EMPTY_STATE.title,
      description: BACKLOG_EMPTY_STATE.description,
      actions: [
        { label: "New feature", href: "/features/new" },
        { label: "All features", href: "/features", variant: "outline" },
      ],
    };
  }

  if (hasStatus && !hasProject && !hasPriority) {
    return {
      title: `No ${statusText} backlog items`,
      description: `Nothing in the backlog has the ${statusText} status.`,
      actions: [
        {
          label: "Clear status filter",
          href: buildBacklogListHref(),
          variant: "outline",
        },
      ],
    };
  }

  if (!hasStatus && hasProject && !hasPriority) {
    return {
      title: `No backlog items in ${projectText}`,
      description: `${projectText} has no open backlog items with the current filters.`,
      actions: [
        {
          label: "New feature",
          href: `/features/new?projectId=${projectId}`,
        },
        {
          label: "Clear project filter",
          href: buildBacklogListHref(),
          variant: "outline",
        },
      ],
    };
  }

  if (!hasStatus && !hasProject && hasPriority) {
    return {
      title: `No ${priorityText} priority items`,
      description: `No backlog items match the ${priorityText} priority band.`,
      actions: [
        {
          label: "Clear priority filter",
          href: buildBacklogListHref(),
          variant: "outline",
        },
      ],
    };
  }

  return {
    title: "No matching backlog items",
    description:
      "Try clearing filters or add a feature for this project.",
    actions: [
      {
        label: "Clear filters",
        href: buildBacklogListHref(),
        variant: "outline",
      },
      {
        label: "New feature",
        href: projectId
          ? `/features/new?projectId=${projectId}`
          : "/features/new",
      },
    ],
  };
}

export type BacklogFeatureRow = {
  id: string;
  project: { id: string; name: string; slug: string };
};

export function splitBacklogByMandev<T extends BacklogFeatureRow>(features: T[]): {
  mandev: T[];
  other: T[];
} {
  const mandev: T[] = [];
  const other: T[] = [];
  for (const f of features) {
    if (isMandevProjectSlug(f.project.slug)) {
      mandev.push(f);
    } else {
      other.push(f);
    }
  }
  return { mandev, other };
}

export function groupOtherBacklogByProject<T extends BacklogFeatureRow>(
  features: T[],
): { project: T["project"]; items: T[] }[] {
  const map = new Map<string, { project: T["project"]; items: T[] }>();
  for (const f of features) {
    const existing = map.get(f.project.id);
    if (existing) {
      existing.items.push(f);
    } else {
      map.set(f.project.id, { project: f.project, items: [f] });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.project.name.localeCompare(b.project.name),
  );
}
