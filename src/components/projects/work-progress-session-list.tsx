import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatSessionDurationMs,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";
import type { WorkProgressSession } from "@/lib/work-progress-session";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusCodeClassName =
  "inline-block min-w-[1.75rem] rounded bg-muted px-1 py-0.5 text-center font-mono text-[10px] text-foreground/90";

const SESSION_SNAPSHOT_PREVIEW_LIMIT = 3;

function SessionSnapshotPreview({
  session,
}: {
  session: WorkProgressSession;
}) {
  const previewSnapshots = session.snapshots.slice(-SESSION_SNAPSHOT_PREVIEW_LIMIT);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
        Latest snapshots
      </p>
      <ul className="space-y-1">
        {previewSnapshots.map((snapshot) => (
          <li
            key={snapshot.id}
            className="rounded border border-border/50 bg-background/40 px-2.5 py-2 text-[11px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {snapshot.latestCommitHash}
              </span>
              <span className="text-muted-foreground">
                {formatRelativeTime(new Date(snapshot.createdAt))}
              </span>
            </div>
            <p className="mt-1 text-foreground/90">{snapshot.latestCommitMessage}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkProgressSessionCard({
  projectId,
  session,
}: {
  projectId: string;
  session: WorkProgressSession;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-medium">
            {session.branch ?? "Unknown branch"}
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
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium text-foreground/80">Latest commit:</span>{" "}
            <span className="font-mono text-xs">{session.latestCommitHash}</span>
          </p>
          <p>
            <span className="font-medium text-foreground/80">Changed files:</span>{" "}
            {session.changedFilesCount}
          </p>
        </div>

        <p className="text-sm text-foreground/90">
          {session.latestCommitMessage ?? "No commit message"}
        </p>

        <p className="text-xs text-muted-foreground">{session.latestStatusLabel}</p>

        {session.changedFilesCount === 0 ? null : (
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
              Changed files preview
            </p>
            <ul className="max-h-32 space-y-1 overflow-auto">
              {session.changedFiles.slice(0, 8).map((file) => (
                <li
                  key={file.path}
                  className="flex items-start gap-2 font-mono text-[10px] text-foreground/90"
                >
                  <span className={statusCodeClassName}>{file.status}</span>
                  <span className="break-all">{file.path}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SessionSnapshotPreview session={session} />

        <Link
          href={`/projects/${projectId}/work-progress/sessions/${session.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View details
        </Link>
      </CardContent>
    </Card>
  );
}

type Props = {
  projectId: string;
  sessions: WorkProgressSession[];
  className?: string;
};

export function WorkProgressSessionList({
  projectId,
  sessions,
  className,
}: Props) {
  return (
    <ul className={className ?? "space-y-4"}>
      {sessions.map((session) => (
        <li key={session.id}>
          <WorkProgressSessionCard projectId={projectId} session={session} />
        </li>
      ))}
    </ul>
  );
}
