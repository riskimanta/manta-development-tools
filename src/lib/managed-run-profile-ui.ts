import type { RunProfileManagedProcessStatus } from "@/lib/run-profile-process-manager";

export const MANAGED_RUN_PROFILE_POLL_MS = 1500;

export function resolveManagedRunProfileStatus(
  status: RunProfileManagedProcessStatus | null | undefined,
): RunProfileManagedProcessStatus {
  return status ?? "idle";
}

export function shouldPollManagedRunProfileSnapshot(
  status: RunProfileManagedProcessStatus,
): boolean {
  return (
    status === "starting" || status === "running" || status === "stopping"
  );
}

export function canStartManagedRunProfile(
  status: RunProfileManagedProcessStatus,
): boolean {
  return (
    status === "idle" ||
    status === "stopped" ||
    status === "failed" ||
    status === "exited"
  );
}

export function canStopManagedRunProfile(
  status: RunProfileManagedProcessStatus,
): boolean {
  return status === "starting" || status === "running";
}

export function canRestartManagedRunProfile(
  status: RunProfileManagedProcessStatus,
): boolean {
  return (
    status === "running" ||
    status === "stopped" ||
    status === "failed" ||
    status === "exited"
  );
}

export function managedRunProfileStatusLabel(
  status: RunProfileManagedProcessStatus,
): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "starting":
      return "Starting";
    case "running":
      return "Running";
    case "stopping":
      return "Stopping";
    case "stopped":
      return "Stopped";
    case "failed":
      return "Failed";
    case "exited":
      return "Exited";
    default:
      return status;
  }
}

export function managedRunProfileStatusVariant(
  status: RunProfileManagedProcessStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "default";
    case "starting":
    case "stopping":
      return "secondary";
    case "failed":
      return "destructive";
    case "stopped":
    case "exited":
    case "idle":
      return "outline";
    default:
      return "outline";
  }
}
