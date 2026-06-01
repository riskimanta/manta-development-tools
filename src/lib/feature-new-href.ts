export type FeatureNewHrefParams = {
  projectId?: string;
};

/** Builds `/features/new` with an optional `projectId` query param. */
export function buildFeatureNewHref(
  params: FeatureNewHrefParams = {},
): string {
  const search = new URLSearchParams();
  if (params.projectId) search.set("projectId", params.projectId);
  const qs = search.toString();
  return qs ? `/features/new?${qs}` : "/features/new";
}

/**
 * Returns `requestedId` when it exists in `projectIds`; otherwise `undefined`
 * so the create form falls back to its default project selection.
 */
export function resolveDefaultFeatureProjectId(
  requestedId: string | undefined,
  projectIds: readonly string[],
): string | undefined {
  if (!requestedId) return undefined;
  return projectIds.includes(requestedId) ? requestedId : undefined;
}
