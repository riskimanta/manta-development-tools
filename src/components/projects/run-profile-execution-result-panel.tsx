"use client";

import { Badge } from "@/components/ui/badge";
import type { RunProfileExecutionResult } from "@/lib/run-profile-execution";

const previewPreClassName =
  "mt-0.5 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90";

export function runProfileExecutionStatusLabel(
  status: RunProfileExecutionResult["status"],
): string {
  switch (status) {
    case "success":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "blocked":
      return "Blocked";
    case "timed_out":
      return "Timed out";
    case "disabled":
      return "Disabled";
    default:
      return status;
  }
}

export function runProfileExecutionStatusVariant(
  status: RunProfileExecutionResult["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "failed":
    case "timed_out":
      return "destructive";
    case "blocked":
    case "disabled":
      return "secondary";
    default:
      return "outline";
  }
}

type Props = {
  result: RunProfileExecutionResult;
  heading?: string;
  timestampLabel?: string;
  className?: string;
};

export function RunProfileExecutionResultPanel({
  result,
  heading = "Result",
  timestampLabel,
  className,
}: Props) {
  return (
    <div
      className={
        className ??
        "space-y-2 rounded-md border border-border/80 bg-muted/15 p-3 text-xs"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{heading}</span>
        <Badge variant={runProfileExecutionStatusVariant(result.status)}>
          {runProfileExecutionStatusLabel(result.status)}
        </Badge>
        {result.exitCode !== null ? (
          <span className="text-muted-foreground">
            Exit code {result.exitCode}
          </span>
        ) : null}
        {timestampLabel ? (
          <span className="text-muted-foreground/80">{timestampLabel}</span>
        ) : null}
      </div>
      <p className="text-muted-foreground">{result.message}</p>
      {result.stdoutPreview ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            stdout
          </p>
          <pre className={previewPreClassName}>{result.stdoutPreview}</pre>
        </div>
      ) : null}
      {result.stderrPreview ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
            stderr
          </p>
          <pre className={previewPreClassName}>{result.stderrPreview}</pre>
        </div>
      ) : null}
    </div>
  );
}
