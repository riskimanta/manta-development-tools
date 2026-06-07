import {
  RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL,
  type RunProfileRunRecord,
} from "@/lib/run-profile-run-history-types";
import type { RunProfileManagedProcessStatus } from "@/lib/run-profile-process-manager";
import {
  managedRunProfileStatusLabel,
  managedRunProfileStatusVariant,
} from "@/lib/managed-run-profile-ui";

export const RUN_PROFILE_RECENT_RUNS_UI_LIMIT = 3;

const IN_PROGRESS_RUN_STATUSES = new Set<string>([
  "starting",
  "running",
  "stopping",
]);

export function isRunProfileRunInProgress(status: string): boolean {
  return IN_PROGRESS_RUN_STATUSES.has(status);
}

export function resolveRunProfileRunStatus(
  status: string,
): RunProfileManagedProcessStatus {
  const known: RunProfileManagedProcessStatus[] = [
    "idle",
    "starting",
    "running",
    "stopping",
    "stopped",
    "failed",
    "exited",
  ];

  if (known.includes(status as RunProfileManagedProcessStatus)) {
    return status as RunProfileManagedProcessStatus;
  }

  return "idle";
}

export function runProfileRunStatusLabel(status: string): string {
  if (status === "stale") {
    return "Stale";
  }

  return managedRunProfileStatusLabel(resolveRunProfileRunStatus(status));
}

export function runProfileRunStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "stale") {
    return "secondary";
  }

  return managedRunProfileStatusVariant(resolveRunProfileRunStatus(status));
}

export function formatRunProfileRunTimestamp(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString();
}

export function formatRunProfileRunDuration(run: RunProfileRunRecord): string {
  if (run.endedAt === null || isRunProfileRunInProgress(run.status)) {
    return "In progress";
  }

  if (run.durationMs === null) {
    return "—";
  }

  return formatDurationMs(run.durationMs);
}

export function formatDurationMs(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function formatRunProfileRunExitSummary(
  exitCode: number | null,
  signal: string | null,
): string | null {
  if (signal === RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL) {
    return "app restart";
  }

  if (signal) {
    return `signal ${signal}`;
  }

  if (exitCode !== null) {
    return `exit ${exitCode}`;
  }

  return null;
}

export function formatRunProfileRunPid(pid: number | null): string {
  return pid === null ? "—" : String(pid);
}
