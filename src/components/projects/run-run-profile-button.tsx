"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { executeRunProfileAction } from "@/app/projects/run-profiles/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RunProfileExecutionResult } from "@/lib/run-profile-execution";

type Props = {
  profileId: string;
  profileName: string;
  command: string;
  workingDirectory: string | null;
};

const previewCodeClassName =
  "mt-0.5 block break-all rounded bg-muted/80 px-2 py-1 font-mono text-[11px] text-foreground/90";

function statusLabel(status: RunProfileExecutionResult["status"]): string {
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

function statusVariant(
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

export function RunRunProfileButton({
  profileId,
  profileName,
  command,
  workingDirectory,
}: Props) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<RunProfileExecutionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const canRun = Boolean(command.trim() && workingDirectory?.trim());

  function handleConfirm() {
    startTransition(async () => {
      const executionResult = await executeRunProfileAction(profileId);
      setResult(executionResult);

      if (executionResult.status === "success") {
        toast.success(executionResult.message);
      } else if (executionResult.status === "failed") {
        toast.error(executionResult.message);
      } else if (executionResult.status === "timed_out") {
        toast.warning(executionResult.message);
      } else {
        toast.message(executionResult.message);
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setResult(null);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 border-amber-500/40 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
        disabled={!canRun}
        onClick={() => setOpen(true)}
      >
        <Play className="size-3.5" />
        Run
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Run profile locally?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                  Experimental — local only. This will execute a local command
                  on this machine.
                </p>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    Profile
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {profileName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    Command
                  </p>
                  <code className={previewCodeClassName}>{command}</code>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    Working directory
                  </p>
                  {workingDirectory ? (
                    <code className={previewCodeClassName}>
                      {workingDirectory}
                    </code>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not set</p>
                  )}
                </div>
                <p className="text-xs">
                  This will execute a local command on this machine.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-2 rounded-md border border-border/80 bg-muted/15 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Result</span>
                <Badge variant={statusVariant(result.status)}>
                  {statusLabel(result.status)}
                </Badge>
                {result.exitCode !== null ? (
                  <span className="text-muted-foreground">
                    Exit code {result.exitCode}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground">{result.message}</p>
              {result.stdoutPreview ? (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    stdout
                  </p>
                  <pre className="mt-0.5 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90">
                    {result.stdoutPreview}
                  </pre>
                </div>
              ) : null}
              {result.stderrPreview ? (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                    stderr
                  </p>
                  <pre className="mt-0.5 max-h-28 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90">
                    {result.stderrPreview}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {result ? "Close" : "Cancel"}
            </Button>
            {!result ? (
              <Button
                type="button"
                className="bg-amber-600 text-white hover:bg-amber-500"
                disabled={pending || !canRun}
                onClick={handleConfirm}
              >
                {pending ? "Running…" : "Run command"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
