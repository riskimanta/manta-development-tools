import type { WorkProgressChangedFile } from "@/lib/git-work-progress-capture";
import {
  isWorkProgressSnapshotClean,
  type WorkProgressSession,
} from "@/lib/work-progress-session";
import {
  formatSessionDurationMs,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";
import type { WorkProgressRecord } from "@/services/work-progress";

export type WorkProgressAiSummaryPromptInput = {
  project: {
    name: string;
    localPath: string | null;
  };
  session: WorkProgressSession;
};

function formatOptionalText(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatChangedFileLine(file: WorkProgressChangedFile): string {
  return `- ${file.status} ${file.path}`;
}

function formatSnapshotTimelineEntry(
  index: number,
  snapshot: WorkProgressRecord,
): string {
  const isClean = isWorkProgressSnapshotClean(snapshot);
  const status = isClean ? "Clean working tree" : "Dirty working tree";
  const commitHash = formatOptionalText(snapshot.latestCommitHash, "Not available");
  const commitMessage = formatOptionalText(
    snapshot.latestCommitMessage,
    "No commit message",
  );
  const branch = formatOptionalText(snapshot.branch, "Unknown");
  const timestamp = formatWorkProgressTimestamp(snapshot.createdAt);

  return `${index}. ${timestamp} — ${branch} @ ${commitHash} — ${commitMessage} — ${status} (${snapshot.changedFilesCount} changed file${snapshot.changedFilesCount === 1 ? "" : "s"})`;
}

export function buildWorkProgressAiSummaryPrompt(
  input: WorkProgressAiSummaryPromptInput,
): string {
  const { project, session } = input;
  const branch = formatOptionalText(session.branch, "Unknown");
  const firstCommit = formatOptionalText(session.firstCommitHash, "Not available");
  const latestCommit = formatOptionalText(session.latestCommitHash, "Not available");
  const latestCommitMessage = formatOptionalText(
    session.latestCommitMessage,
    "No commit message",
  );
  const statusLabel = session.latestStatusLabel;
  const localPath = formatOptionalText(project.localPath, "Not provided");
  const startedAt = formatWorkProgressTimestamp(session.startedAt);
  const endedAt = formatWorkProgressTimestamp(session.endedAt);
  const duration = formatSessionDurationMs(session.durationMs);

  const changedFilesSection =
    session.changedFiles.length === 0
      ? "(none — clean working tree)"
      : session.changedFiles.map(formatChangedFileLine).join("\n");

  const timelineSnapshots = [...session.snapshots].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
  const snapshotTimelineSection =
    timelineSnapshots.length === 0
      ? "(no snapshots)"
      : timelineSnapshots
          .map((snapshot, index) => formatSnapshotTimelineEntry(index + 1, snapshot))
          .join("\n");

  return `You are helping me summarize a software development work session.

Please produce:
1. A concise development session summary
2. What changed
3. Important files touched
4. Current state
5. Risks/blockers
6. Suggested next steps
7. A short copy-pasteable progress report

Project:
- Name: ${project.name}
- Local path: ${localPath}

Session:
- Branch: ${branch}
- Started: ${startedAt}
- Ended: ${endedAt}
- Duration: ${duration}
- Snapshots: ${session.snapshotCount}
- First commit: ${firstCommit}
- Latest commit: ${latestCommit}
- Latest commit message: ${latestCommitMessage}
- Status: ${statusLabel}

Changed files:
${changedFilesSection}

Snapshot timeline:
${snapshotTimelineSection}`;
}
