import { WorkProgressAiSummaryPromptActions } from "@/components/projects/work-progress-ai-summary-prompt-actions";
import { WorkProgressSessionSummaryForm } from "@/components/projects/work-progress-session-summary-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatSessionDurationMs,
  formatWorkProgressSessionTitle,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";
import {
  isWorkProgressSnapshotClean,
  type WorkProgressSession,
} from "@/lib/work-progress-session";
import { formatRelativeTime } from "@/lib/format";
import type { WorkProgressRecord } from "@/services/work-progress";
import type { WorkProgressSessionSummaryRecord } from "@/services/work-progress-session-summaries";

const statusCodeClassName =
  "inline-block min-w-[1.75rem] rounded bg-muted px-1 py-0.5 text-center font-mono text-[10px] text-foreground/90";

const CHANGED_FILES_PREVIEW_LIMIT = 12;
const SNAPSHOT_CHANGED_FILES_PREVIEW_LIMIT = 5;

function SnapshotTimelineEntry({ snapshot }: { snapshot: WorkProgressRecord }) {
  const isClean = isWorkProgressSnapshotClean(snapshot);

  return (
    <li className="rounded border border-border/60 bg-background/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase">
          {snapshot.branch}
        </Badge>
        <span className="font-mono text-[10px] text-muted-foreground">
          {snapshot.latestCommitHash}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatWorkProgressTimestamp(snapshot.createdAt)} ·{" "}
          {formatRelativeTime(new Date(snapshot.createdAt))}
        </span>
        <Badge variant={isClean ? "outline" : "secondary"} className="text-[10px]">
          {isClean ? "Clean" : "Dirty"}
        </Badge>
      </div>

      <p className="text-sm text-foreground/90">{snapshot.latestCommitMessage}</p>

      <div className="grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground/80">Changed files:</span>{" "}
          {snapshot.changedFilesCount}
        </p>
        <p>
          <span className="font-medium text-foreground/80">Author:</span>{" "}
          {snapshot.latestCommitAuthor}
        </p>
      </div>

      {snapshot.changedFilesCount === 0 ? (
        <p className="text-[11px] text-muted-foreground">Clean working tree.</p>
      ) : (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            Changed files
          </p>
          <ul className="space-y-1">
            {snapshot.changedFiles
              .slice(0, SNAPSHOT_CHANGED_FILES_PREVIEW_LIMIT)
              .map((file) => (
                <li
                  key={`${snapshot.id}:${file.path}`}
                  className="flex items-start gap-2 font-mono text-[10px] text-foreground/90"
                >
                  <span className={statusCodeClassName}>{file.status}</span>
                  <span className="break-all">{file.path}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {snapshot.gitStatusText ? (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            Git status
          </p>
          <pre className="max-h-24 overflow-auto rounded bg-muted/80 p-2 font-mono text-[10px] text-foreground/90 whitespace-pre-wrap">
            {snapshot.gitStatusText || "(empty)"}
          </pre>
        </div>
      ) : null}
    </li>
  );
}

type Props = {
  project: {
    id: string;
    name: string;
    localPath: string | null;
  };
  session: WorkProgressSession;
  summary: WorkProgressSessionSummaryRecord | null;
};

export function WorkProgressSessionDetail({ project, session, summary }: Props) {
  const timelineSnapshots = [...session.snapshots].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-medium">
              {formatWorkProgressSessionTitle(session.branch)}
            </CardTitle>
            <Badge variant={session.isClean ? "outline" : "secondary"}>
              {session.isClean ? "Clean" : "Dirty"}
            </Badge>
          </div>
          <CardDescription>
            {formatWorkProgressTimestamp(session.startedAt)} to{" "}
            {formatWorkProgressTimestamp(session.endedAt)} ·{" "}
            {formatSessionDurationMs(session.durationMs)} · {session.snapshotCount}{" "}
            snapshot{session.snapshotCount === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
      </Card>

      <WorkProgressAiSummaryPromptActions project={project} session={session} />

      <WorkProgressSessionSummaryForm
        projectId={project.id}
        sessionId={session.id}
        summary={summary}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Session metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium text-foreground/80">Branch:</span>{" "}
            {session.branch ?? "Unknown"}
          </p>
          <p>
            <span className="font-medium text-foreground/80">Status:</span>{" "}
            {session.latestStatusLabel}
          </p>
          <p>
            <span className="font-medium text-foreground/80">First commit:</span>{" "}
            <span className="font-mono text-xs">{session.firstCommitHash}</span>
          </p>
          <p>
            <span className="font-medium text-foreground/80">Latest commit:</span>{" "}
            <span className="font-mono text-xs">{session.latestCommitHash}</span>
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground/80">Latest message:</span>{" "}
            {session.latestCommitMessage ?? "No commit message"}
          </p>
          <p>
            <span className="font-medium text-foreground/80">Changed files:</span>{" "}
            {session.changedFilesCount}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Changed files</h2>
        {session.changedFilesCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Clean working tree across this session.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-1">
                {session.changedFiles
                  .slice(0, CHANGED_FILES_PREVIEW_LIMIT)
                  .map((file) => (
                    <li
                      key={file.path}
                      className="flex items-start gap-2 font-mono text-[11px] text-foreground/90"
                    >
                      <span className={statusCodeClassName}>{file.status}</span>
                      <span className="break-all">{file.path}</span>
                    </li>
                  ))}
              </ul>
              {session.changedFiles.length > CHANGED_FILES_PREVIEW_LIMIT ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Showing {CHANGED_FILES_PREVIEW_LIMIT} of {session.changedFiles.length}{" "}
                  changed files.
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Snapshot timeline</h2>
        <p className="text-sm text-muted-foreground">
          Newest snapshot first. Commit progression from latest to earliest capture.
        </p>
        <ul className="space-y-3">
          {timelineSnapshots.map((snapshot) => (
            <SnapshotTimelineEntry key={snapshot.id} snapshot={snapshot} />
          ))}
        </ul>
      </section>
    </div>
  );
}
