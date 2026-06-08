import type { WorkProgressChangedFile } from "@/lib/git-work-progress-capture";
import type { WorkProgressRecord } from "@/services/work-progress";

export const DEFAULT_WORK_PROGRESS_SESSION_GAP_MINUTES = 90;

export type WorkProgressSession = {
  id: string;
  projectId: string;
  branch: string | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  snapshotCount: number;
  firstSnapshotId: string;
  latestSnapshotId: string;
  firstCommitHash: string | null;
  latestCommitHash: string | null;
  latestCommitMessage: string | null;
  changedFilesCount: number;
  changedFiles: WorkProgressChangedFile[];
  latestStatusLabel: string;
  isClean: boolean;
  snapshots: WorkProgressRecord[];
};

export type GroupWorkProgressSessionsOptions = {
  gapMinutes?: number;
};

export function parseWorkProgressChangedFilesJson(
  raw: string,
): WorkProgressChangedFile[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (
        item &&
        typeof item === "object" &&
        "status" in item &&
        "path" in item &&
        typeof item.status === "string" &&
        typeof item.path === "string"
      ) {
        return [{ status: item.status, path: item.path }];
      }

      return [];
    });
  } catch {
    return [];
  }
}

export function aggregateSessionChangedFiles(
  snapshots: WorkProgressRecord[],
): WorkProgressChangedFile[] {
  const byPath = new Map<string, WorkProgressChangedFile>();

  for (const snapshot of snapshots) {
    for (const file of snapshot.changedFiles) {
      byPath.set(file.path, file);
    }
  }

  return Array.from(byPath.values()).sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

export function isWorkProgressSnapshotClean(
  snapshot: Pick<WorkProgressRecord, "changedFilesCount" | "gitStatusText">,
): boolean {
  return snapshot.changedFilesCount === 0;
}

export function workProgressStatusLabel(isClean: boolean): string {
  return isClean ? "Clean working tree" : "Dirty working tree";
}

function buildSession(snapshots: WorkProgressRecord[]): WorkProgressSession {
  const first = snapshots[0]!;
  const latest = snapshots[snapshots.length - 1]!;
  const startedAt = first.createdAt;
  const endedAt = latest.createdAt;
  const durationMs = Math.max(
    0,
    new Date(endedAt).getTime() - new Date(startedAt).getTime(),
  );
  const changedFiles = aggregateSessionChangedFiles(snapshots);
  const isClean = isWorkProgressSnapshotClean(latest);

  return {
    id: `session-${first.id}-${latest.id}`,
    projectId: first.projectId,
    branch: latest.branch,
    startedAt,
    endedAt,
    durationMs,
    snapshotCount: snapshots.length,
    firstSnapshotId: first.id,
    latestSnapshotId: latest.id,
    firstCommitHash: first.latestCommitHash,
    latestCommitHash: latest.latestCommitHash,
    latestCommitMessage: latest.latestCommitMessage,
    changedFilesCount: changedFiles.length,
    changedFiles,
    latestStatusLabel: workProgressStatusLabel(isClean),
    isClean,
    snapshots,
  };
}

export function groupWorkProgressIntoSessions(
  entries: WorkProgressRecord[],
  options: GroupWorkProgressSessionsOptions = {},
): WorkProgressSession[] {
  if (entries.length === 0) {
    return [];
  }

  const gapMs =
    (options.gapMinutes ?? DEFAULT_WORK_PROGRESS_SESSION_GAP_MINUTES) *
    60 *
    1000;
  const sorted = [...entries].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  const grouped: WorkProgressRecord[][] = [];
  let current: WorkProgressRecord[] = [];

  for (const snapshot of sorted) {
    if (current.length === 0) {
      current.push(snapshot);
      continue;
    }

    const previous = current[current.length - 1]!;
    const elapsedMs =
      new Date(snapshot.createdAt).getTime() -
      new Date(previous.createdAt).getTime();
    const branchChanged = snapshot.branch !== previous.branch;

    if (branchChanged || elapsedMs > gapMs) {
      grouped.push(current);
      current = [snapshot];
      continue;
    }

    current.push(snapshot);
  }

  if (current.length > 0) {
    grouped.push(current);
  }

  return grouped.map(buildSession).reverse();
}

export function getLatestWorkProgressSession(
  entries: WorkProgressRecord[],
  options: GroupWorkProgressSessionsOptions = {},
): WorkProgressSession | null {
  const sessions = groupWorkProgressIntoSessions(entries, options);
  return sessions[0] ?? null;
}
