import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { RunProfileRunRecord } from "@/lib/run-profile-run-history-types";
import {
  formatRunProfileRunDuration,
  formatRunProfileRunExitSummary,
  formatRunProfileRunPid,
  formatRunProfileRunTimestamp,
  runProfileRunStatusLabel,
  runProfileRunStatusVariant,
} from "@/lib/run-profile-run-history-ui";

const previewCodeClassName =
  "mt-0.5 block max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90";

function RunProfileRunListItem({
  run,
  runDetailHref,
}: {
  run: RunProfileRunRecord;
  runDetailHref?: string;
}) {
  const exitSummary = formatRunProfileRunExitSummary(run.exitCode, run.signal);
  const startedAt = formatRunProfileRunTimestamp(run.startedAt);
  const endedAt = formatRunProfileRunTimestamp(run.endedAt);

  return (
    <li className="rounded border border-border/60 bg-background/40 p-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {runDetailHref ? (
          <Link
            href={runDetailHref}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            View details
          </Link>
        ) : null}
        <Badge
          variant={runProfileRunStatusVariant(run.status)}
          className="text-[10px] uppercase"
        >
          {runProfileRunStatusLabel(run.status)}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          PID {formatRunProfileRunPid(run.pid)}
        </span>
        {exitSummary ? (
          <span className="text-[10px] text-muted-foreground">{exitSummary}</span>
        ) : null}
        <span className="text-[10px] text-muted-foreground">
          {formatRunProfileRunDuration(run)}
        </span>
      </div>

      <div className="grid gap-1 text-[10px] text-muted-foreground sm:grid-cols-2">
        <p>
          <span className="font-medium text-foreground/80">Started:</span>{" "}
          {startedAt ?? "—"}
        </p>
        <p>
          <span className="font-medium text-foreground/80">Ended:</span>{" "}
          {endedAt ?? "—"}
        </p>
      </div>

      {run.stdoutPreview ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            stdout
          </p>
          <code className={previewCodeClassName}>{run.stdoutPreview}</code>
        </div>
      ) : null}

      {run.stderrPreview ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            stderr
          </p>
          <code className={previewCodeClassName}>{run.stderrPreview}</code>
        </div>
      ) : null}
    </li>
  );
}

type Props = {
  runs: RunProfileRunRecord[];
  className?: string;
  buildRunDetailHref?: (runId: string) => string;
};

export function RunProfileRunList({
  runs,
  className,
  buildRunDetailHref,
}: Props) {
  return (
    <ul className={className}>
      {runs.map((run) => (
        <RunProfileRunListItem
          key={run.id}
          run={run}
          runDetailHref={buildRunDetailHref?.(run.id)}
        />
      ))}
    </ul>
  );
}
