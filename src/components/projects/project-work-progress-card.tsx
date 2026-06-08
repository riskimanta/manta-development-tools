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
import { formatRelativeTime } from "@/lib/format";
import {
  formatSessionDurationMs,
  formatWorkProgressCleanDirtyLabel,
  formatWorkProgressTimestamp,
  WORK_PROGRESS_DASHBOARD_LATEST_SAVED_SUMMARY_LABEL,
  WORK_PROGRESS_DASHBOARD_LATEST_SESSION_LABEL,
  WORK_PROGRESS_DASHBOARD_NO_SNAPSHOTS_LABEL,
  WORK_PROGRESS_DASHBOARD_SUMMARY_SECTION_LABEL,
  WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL,
  WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL,
} from "@/lib/work-progress-session-ui";
import type { WorkProgressDashboardSummary } from "@/lib/work-progress-dashboard-summary";
import type { WorkProgressRecord } from "@/services/work-progress";

type Props = {
  projectId: string;
  localPath: string | null;
  entries: WorkProgressRecord[];
  dashboardSummary: WorkProgressDashboardSummary;
};

export function ProjectWorkProgressCard({
  projectId,
  localPath,
  entries,
  dashboardSummary,
}: Props) {
  const sessionsHref = `/projects/${projectId}/work-progress`;
  const hasSnapshots = dashboardSummary.snapshotCount > 0;

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

        <section className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {WORK_PROGRESS_DASHBOARD_SUMMARY_SECTION_LABEL}
          </p>
          {!hasSnapshots ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {WORK_PROGRESS_DASHBOARD_NO_SNAPSHOTS_LABEL}
            </p>
          ) : (
            <dl className="mt-2 grid gap-1.5 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Last activity:</dt>
                <dd>
                  {dashboardSummary.latestSnapshotAt
                    ? formatRelativeTime(
                        new Date(dashboardSummary.latestSnapshotAt),
                      )
                    : "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Snapshots:</dt>
                <dd>{dashboardSummary.snapshotCount}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Sessions:</dt>
                <dd>{dashboardSummary.sessionCount}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Sessions with summaries:</dt>
                <dd>{dashboardSummary.sessionsWithSummariesCount}</dd>
              </div>
            </dl>
          )}
        </section>

        {dashboardSummary.latestSession ? (
          <section className="rounded-md border border-dashed p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {WORK_PROGRESS_DASHBOARD_LATEST_SESSION_LABEL}
              </p>
              <Link
                href={sessionsHref}
                className="text-xs font-medium text-primary hover:underline"
              >
                View sessions
              </Link>
            </div>
            <dl className="mt-2 grid gap-1.5">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Branch:</dt>
                <dd>{dashboardSummary.latestSession.branch ?? "Unknown"}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Duration:</dt>
                <dd>
                  {formatSessionDurationMs(
                    dashboardSummary.latestSession.durationMs,
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Snapshots:</dt>
                <dd>{dashboardSummary.latestSession.snapshotCount}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>
                  {formatWorkProgressCleanDirtyLabel(
                    dashboardSummary.latestSession.isClean,
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">Latest commit:</dt>
                <dd>
                  <span className="font-mono text-xs">
                    {dashboardSummary.latestSession.latestCommitHash}
                  </span>{" "}
                  {dashboardSummary.latestSession.latestCommitMessage}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="rounded-md border border-border/40 bg-muted/10 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {WORK_PROGRESS_DASHBOARD_LATEST_SAVED_SUMMARY_LABEL}
          </p>
          {dashboardSummary.latestSavedSummary ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                {WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL}
              </p>
              <p className="text-foreground/90">
                {dashboardSummary.latestSavedSummary.preview}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated{" "}
                {formatWorkProgressTimestamp(
                  dashboardSummary.latestSavedSummary.updatedAt,
                )}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL}
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Recent snapshots</h3>
          <Link
            href={sessionsHref}
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
