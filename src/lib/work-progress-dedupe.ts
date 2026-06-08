export type WorkProgressComparableState = {
  branch: string;
  latestCommitHash: string;
  gitStatusText: string;
  changedFilesJson: string;
};

function normalizeChangedFilesJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(parsed ?? []);
  } catch {
    return raw;
  }
}

export function isSameWorkProgressSnapshot(
  current: WorkProgressComparableState,
  latest: WorkProgressComparableState | null,
): boolean {
  if (!latest) {
    return false;
  }

  return (
    current.branch === latest.branch &&
    current.latestCommitHash === latest.latestCommitHash &&
    current.gitStatusText === latest.gitStatusText &&
    normalizeChangedFilesJson(current.changedFilesJson) ===
      normalizeChangedFilesJson(latest.changedFilesJson)
  );
}
