export type FeaturesListFilterParams = {
  status?: string;
  projectId?: string;
};

export type FeatureEmptyStateAction = {
  label: string;
  href: string;
  variant?: "default" | "outline";
};

export type FeatureEmptyStateCopy = {
  title: string;
  description: string;
  actions: FeatureEmptyStateAction[];
};

export type FeatureEmptyStateParams = {
  status?: string;
  projectId?: string;
  /** Display name when filtering by project; falls back to "this project". */
  projectName?: string;
  /** Human-readable status for copy (e.g. from `featureStatusLabel`). */
  statusLabel?: string;
};

/** Builds `/features` href preserving status and project query params. */
export function buildFeaturesListHref(
  params: FeaturesListFilterParams = {},
): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.projectId) search.set("projectId", params.projectId);
  const qs = search.toString();
  return qs ? `/features?${qs}` : "/features";
}

/** Empty-state title, description, and actions for the feature list. */
export function getFeatureEmptyStateCopy(
  params: FeatureEmptyStateParams = {},
): FeatureEmptyStateCopy {
  const { status, projectId, projectName, statusLabel } = params;
  const hasStatus = Boolean(status);
  const hasProject = Boolean(projectId);
  const statusText = statusLabel ?? status ?? "selected";
  const projectText = projectName ?? "this project";

  if (!hasStatus && !hasProject) {
    return {
      title: "No features yet",
      description:
        "Your backlog is empty. Create a feature to capture specs before opening a repo.",
      actions: [{ label: "New feature", href: "/features/new" }],
    };
  }

  if (hasStatus && !hasProject) {
    return {
      title: `No ${statusText} features`,
      description: `Nothing in your backlog has the ${statusText} status.`,
      actions: [
        {
          label: "Clear status filter",
          href: buildFeaturesListHref(),
          variant: "outline",
        },
      ],
    };
  }

  if (!hasStatus && hasProject) {
    return {
      title: `No features in ${projectText}`,
      description: `${projectText} has no features in your backlog yet.`,
      actions: [
        {
          label: "New feature",
          href: `/features/new?projectId=${projectId}`,
        },
        {
          label: "Clear project filter",
          href: buildFeaturesListHref(),
          variant: "outline",
        },
      ],
    };
  }

  return {
    title: "No matching features",
    description: `No ${statusText} features in ${projectText}. Clear filters or add one for this project.`,
    actions: [
      {
        label: "Clear filters",
        href: buildFeaturesListHref(),
        variant: "outline",
      },
      {
        label: "New feature",
        href: `/features/new?projectId=${projectId}`,
      },
    ],
  };
}
