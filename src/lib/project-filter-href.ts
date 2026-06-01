import { buildBacklogListHref } from "@/lib/backlog";
import { buildFeaturesListHref } from "@/lib/features-filter";

export type ProjectFilterListTarget = "features" | "backlog";

export type ProjectFilterHrefParams = {
  status?: string;
  projectId?: string;
  priority?: string;
};

/** Builds list URLs for project filter dropdowns (features or backlog). */
export function buildProjectFilterListHref(
  target: ProjectFilterListTarget,
  params: ProjectFilterHrefParams = {},
): string {
  if (target === "backlog") {
    return buildBacklogListHref(params);
  }
  return buildFeaturesListHref({
    status: params.status,
    projectId: params.projectId,
  });
}
