import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CaptureWorkProgressButton } from "@/components/projects/capture-work-progress-button";
import { WorkProgressTerminalHint } from "@/components/projects/work-progress-terminal-hint";
import { WorkProgressList } from "@/components/projects/work-progress-list";
import type { WorkProgressSession } from "@/lib/work-progress-session";
import {
  formatSessionDurationMs,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";
import type { WorkProgressRecord } from "@/services/work-progress";

type Props = {
  projectId: string;
  localPath: string | null;
  entries: WorkProgressRecord[];
  latestSession?: WorkProgressSession | null;
};

export function ProjectWorkProgressCard({
  projectId,
  localPath,
  entries,
  latestSession,
}: Props) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-medium">Work progress</CardTitle>
        <CardDescription>
          Capture a Git snapshot of branch, latest commit, and working tree
          changes for this project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CaptureWorkProgressButton
          projectId={projectId}
          localPath={localPath}
        />

        {localPath?.trim() ? <WorkProgressTerminalHint /> : null}

        {latestSession ? (
          <section className="rounded-md border border-dashed p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Latest session
            </p>
            <p className="mt-1">
              {latestSession.branch} · {latestSession.snapshotCount} snapshot
              {latestSession.snapshotCount === 1 ? "" : "s"} ·{" "}
              {formatSessionDurationMs(latestSession.durationMs)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatWorkProgressTimestamp(latestSession.startedAt)} to{" "}
              {formatWorkProgressTimestamp(latestSession.endedAt)} ·{" "}
              {latestSession.latestStatusLabel}
            </p>
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Recent snapshots</h3>
          <Link
            href={`/projects/${projectId}/work-progress`}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all work progress
          </Link>
        </div>

        <section className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No work progress snapshots yet.
            </p>
          ) : (
            <WorkProgressList entries={entries} className="space-y-2" />
          )}
        </section>
      </CardContent>
    </Card>
  );
}
