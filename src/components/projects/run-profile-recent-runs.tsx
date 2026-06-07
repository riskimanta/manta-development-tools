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

type Props = {
  recentRuns: RunProfileRunRecord[];
  className?: string;
};

const previewCodeClassName =
  "mt-0.5 block max-h-16 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90";

function RunProfileRecentRunItem({ run }: { run: RunProfileRunRecord }) {
  const exitSummary = formatRunProfileRunExitSummary(run.exitCode, run.signal);
  const startedAt = formatRunProfileRunTimestamp(run.startedAt);
  const endedAt = formatRunProfileRunTimestamp(run.endedAt);

  return (
    <li className="rounded border border-border/60 bg-background/40 p-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
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

export function RunProfileRecentRuns({ recentRuns, className }: Props) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium text-muted-foreground">Recent runs</p>
      {recentRuns.length === 0 ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          No run history yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {recentRuns.map((run) => (
            <RunProfileRecentRunItem key={run.id} run={run} />
          ))}
        </ul>
      )}
    </div>
  );
}
