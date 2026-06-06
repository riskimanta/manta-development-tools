"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, RotateCw, Square } from "lucide-react";
import { toast } from "sonner";

import {
  getManagedRunProfileSnapshotAction,
  restartManagedRunProfileAction,
  startManagedRunProfileAction,
  stopManagedRunProfileAction,
} from "@/app/projects/run-profiles/actions";
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
import {
  canRestartManagedRunProfile,
  canStartManagedRunProfile,
  canStopManagedRunProfile,
  MANAGED_RUN_PROFILE_POLL_MS,
  managedRunProfileStatusLabel,
  managedRunProfileStatusVariant,
  resolveManagedRunProfileStatus,
  shouldPollManagedRunProfileSnapshot,
} from "@/lib/managed-run-profile-ui";
import type { RunProfileManagedProcessSnapshot } from "@/lib/run-profile-process-manager";

type Props = {
  profileId: string;
  profileName: string;
  command: string;
  workingDirectory: string | null;
};

const previewCodeClassName =
  "mt-0.5 block break-all rounded bg-muted/80 px-2 py-1 font-mono text-[11px] text-foreground/90";

const logPreClassName =
  "mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/80 px-2 py-1 font-mono text-[10px] text-foreground/90";

function formatManagedTimestamp(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
}

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  pending: boolean;
  profileName: string;
  command: string;
  workingDirectory: string | null;
  onConfirm: () => void;
};

function ManagedProcessConfirmDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  pending,
  profileName,
  command,
  workingDirectory,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/90">
                This will start a managed local process on this machine.
                Experimental — in-memory only; state is lost when ManDev restarts.
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
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-violet-600 text-white hover:bg-violet-500"
            disabled={pending || !command.trim() || !workingDirectory?.trim()}
            onClick={onConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManagedRunProfileLogsPanel({
  snapshot,
}: {
  snapshot: RunProfileManagedProcessSnapshot | null;
}) {
  const logs = snapshot?.logs;
  const hasStdout = Boolean(logs?.stdout);
  const hasStderr = Boolean(logs?.stderr);

  if (!hasStdout && !hasStderr) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No logs yet. Output appears here while the process runs.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {hasStdout ? (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
              stdout
            </p>
            {logs?.stdoutTruncated ? (
              <Badge variant="outline" className="text-[9px]">
                truncated
              </Badge>
            ) : null}
          </div>
          <pre className={logPreClassName}>{logs?.stdout}</pre>
        </div>
      ) : null}
      {hasStderr ? (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
              stderr
            </p>
            {logs?.stderrTruncated ? (
              <Badge variant="outline" className="text-[9px]">
                truncated
              </Badge>
            ) : null}
          </div>
          <pre className={logPreClassName}>{logs?.stderr}</pre>
        </div>
      ) : null}
    </div>
  );
}

export function ManagedRunProfileControls({
  profileId,
  profileName,
  command,
  workingDirectory,
}: Props) {
  const [snapshot, setSnapshot] =
    useState<RunProfileManagedProcessSnapshot | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const status = resolveManagedRunProfileStatus(snapshot?.status);
  const canStart = canStartManagedRunProfile(status);
  const canStop = canStopManagedRunProfile(status);
  const canRestart = canRestartManagedRunProfile(status);
  const canManage = Boolean(command.trim() && workingDirectory?.trim());

  useEffect(() => {
    let cancelled = false;

    async function refreshSnapshot() {
      const result = await getManagedRunProfileSnapshotAction(profileId);
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setSnapshot(result.snapshot ?? null);
        if (result.snapshot?.message) {
          setActionMessage(result.snapshot.message);
        }
      } else {
        setActionMessage(result.message);
      }
    }

    void refreshSnapshot();

    if (!shouldPollManagedRunProfileSnapshot(status)) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = setInterval(() => {
      void refreshSnapshot();
    }, MANAGED_RUN_PROFILE_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [profileId, status]);

  function applyActionResult(
    result: Awaited<ReturnType<typeof startManagedRunProfileAction>>,
    successToast?: "success" | "message",
  ) {
    if (result.ok) {
      setSnapshot(result.snapshot ?? null);
      setActionMessage(result.message);
      if (successToast === "success") {
        toast.success(result.message);
      } else {
        toast.message(result.message);
      }
      return;
    }

    setActionMessage(result.message);
    toast.error(result.message);
  }

  function handleStart() {
    startTransition(async () => {
      const result = await startManagedRunProfileAction(profileId);
      applyActionResult(result, "success");
      if (result.ok) {
        setStartOpen(false);
      }
    });
  }

  function handleStop() {
    startTransition(async () => {
      const result = await stopManagedRunProfileAction(profileId);
      applyActionResult(result, "message");
    });
  }

  function handleRestart() {
    startTransition(async () => {
      const result = await restartManagedRunProfileAction(profileId);
      applyActionResult(result, "success");
      if (result.ok) {
        setRestartOpen(false);
      }
    });
  }

  const startedAtLabel = formatManagedTimestamp(snapshot?.startedAt ?? null);
  const exitedAtLabel = formatManagedTimestamp(snapshot?.exitedAt ?? null);

  return (
    <div className="space-y-2 rounded-md border border-violet-500/25 bg-violet-500/5 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-foreground/90">
          Managed process
        </p>
        <Badge variant={managedRunProfileStatusVariant(status)}>
          {managedRunProfileStatusLabel(status)}
        </Badge>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Long-running local process control — experimental, in-memory only.
      </p>

      {snapshot ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          {snapshot.pid !== null ? (
            <>
              <dt className="text-muted-foreground">PID</dt>
              <dd className="font-mono text-foreground/90">{snapshot.pid}</dd>
            </>
          ) : null}
          {startedAtLabel ? (
            <>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="text-foreground/90">{startedAtLabel}</dd>
            </>
          ) : null}
          {exitedAtLabel ? (
            <>
              <dt className="text-muted-foreground">Exited</dt>
              <dd className="text-foreground/90">{exitedAtLabel}</dd>
            </>
          ) : null}
          {snapshot.exitCode !== null ? (
            <>
              <dt className="text-muted-foreground">Exit code</dt>
              <dd className="font-mono text-foreground/90">
                {snapshot.exitCode}
              </dd>
            </>
          ) : null}
          {snapshot.signal ? (
            <>
              <dt className="text-muted-foreground">Signal</dt>
              <dd className="font-mono text-foreground/90">
                {snapshot.signal}
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {actionMessage ? (
        <p className="text-[11px] text-muted-foreground">{actionMessage}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canStart ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-violet-500/40 text-violet-200 hover:bg-violet-500/10 hover:text-violet-100"
            disabled={!canManage || pending}
            onClick={() => setStartOpen(true)}
          >
            <Play className="size-3.5" />
            Start
          </Button>
        ) : null}
        {canStop ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={pending}
            onClick={handleStop}
          >
            <Square className="size-3.5" />
            Stop
          </Button>
        ) : null}
        {canRestart ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!canManage || pending}
            onClick={() => setRestartOpen(true)}
          >
            <RotateCw className="size-3.5" />
            Restart
          </Button>
        ) : null}
      </div>

      <details
        className="rounded-md border border-border/60 bg-muted/10 p-2"
        open={shouldPollManagedRunProfileSnapshot(status)}
      >
        <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
          Process logs
        </summary>
        <div className="mt-2">
          <ManagedRunProfileLogsPanel snapshot={snapshot} />
        </div>
      </details>

      <ManagedProcessConfirmDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        title="Start managed process?"
        confirmLabel="Start process"
        pending={pending}
        profileName={profileName}
        command={command}
        workingDirectory={workingDirectory}
        onConfirm={handleStart}
      />

      <ManagedProcessConfirmDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        title="Restart managed process?"
        confirmLabel="Restart process"
        pending={pending}
        profileName={profileName}
        command={command}
        workingDirectory={workingDirectory}
        onConfirm={handleRestart}
      />
    </div>
  );
}
