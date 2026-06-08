import { buildWorkProgressSessionSummaryPreview } from "@/lib/work-progress-session-summary-preview";
import {
  groupWorkProgressIntoSessions,
  isWorkProgressSnapshotClean,
  type WorkProgressSession,
} from "@/lib/work-progress-session";
import type { WorkProgressRecord } from "@/services/work-progress";
import type { WorkProgressSessionSummaryRecord } from "@/services/work-progress-session-summaries";

export type WorkProgressDashboardSummaryLatestSession = {
  id: string;
  branch: string | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  snapshotCount: number;
  latestCommitHash: string | null;
  latestCommitMessage: string | null;
  changedFilesCount: number;
  isClean: boolean;
};

export type WorkProgressDashboardSummaryLatestSavedSummary = {
  sessionId: string;
  preview: string;
  updatedAt: string;
};

export type WorkProgressDashboardSummary = {
  snapshotCount: number;
  sessionCount: number;
  sessionsWithSummariesCount: number;
  latestSnapshotAt: string | null;
  latestBranch: string | null;
  latestCommitHash: string | null;
  latestCommitMessage: string | null;
  latestChangedFilesCount: number;
  latestIsClean: boolean;
  latestSession: WorkProgressDashboardSummaryLatestSession | null;
  latestSavedSummary: WorkProgressDashboardSummaryLatestSavedSummary | null;
};

function toDashboardLatestSession(
  session: WorkProgressSession,
): WorkProgressDashboardSummaryLatestSession {
  return {
    id: session.id,
    branch: session.branch,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    snapshotCount: session.snapshotCount,
    latestCommitHash: session.latestCommitHash,
    latestCommitMessage: session.latestCommitMessage,
    changedFilesCount: session.changedFilesCount,
    isClean: session.isClean,
  };
}

function findLatestSnapshot(
  entries: WorkProgressRecord[],
): WorkProgressRecord | null {
  if (entries.length === 0) {
    return null;
  }

  return [...entries].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0]!;
}

function buildValidSavedSummaries(
  sessions: WorkProgressSession[],
  summaries: WorkProgressSessionSummaryRecord[],
): WorkProgressDashboardSummaryLatestSavedSummary[] {
  const sessionIds = new Set(sessions.map((session) => session.id));

  return summaries.flatMap((summary) => {
    if (!sessionIds.has(summary.sessionId)) {
      return [];
    }

    const trimmed = summary.summaryMarkdown.trim();
    if (!trimmed) {
      return [];
    }

    return [
      {
        sessionId: summary.sessionId,
        preview: buildWorkProgressSessionSummaryPreview(trimmed),
        updatedAt: summary.updatedAt,
      },
    ];
  });
}

function findLatestSavedSummary(
  summaries: WorkProgressDashboardSummaryLatestSavedSummary[],
): WorkProgressDashboardSummaryLatestSavedSummary | null {
  if (summaries.length === 0) {
    return null;
  }

  return summaries.reduce((latest, current) =>
    new Date(current.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
      ? current
      : latest,
  );
}

export function buildWorkProgressDashboardSummary(
  entries: WorkProgressRecord[],
  summaries: WorkProgressSessionSummaryRecord[] = [],
): WorkProgressDashboardSummary {
  const sessions = groupWorkProgressIntoSessions(entries);
  const latestSnapshot = findLatestSnapshot(entries);
  const validSavedSummaries = buildValidSavedSummaries(sessions, summaries);
  const latestSession = sessions[0] ?? null;

  return {
    snapshotCount: entries.length,
    sessionCount: sessions.length,
    sessionsWithSummariesCount: new Set(
      validSavedSummaries.map((summary) => summary.sessionId),
    ).size,
    latestSnapshotAt: latestSnapshot?.createdAt ?? null,
    latestBranch: latestSnapshot?.branch ?? null,
    latestCommitHash: latestSnapshot?.latestCommitHash ?? null,
    latestCommitMessage: latestSnapshot?.latestCommitMessage ?? null,
    latestChangedFilesCount: latestSnapshot?.changedFilesCount ?? 0,
    latestIsClean: latestSnapshot
      ? isWorkProgressSnapshotClean(latestSnapshot)
      : true,
    latestSession: latestSession
      ? toDashboardLatestSession(latestSession)
      : null,
    latestSavedSummary: findLatestSavedSummary(validSavedSummaries),
  };
}
