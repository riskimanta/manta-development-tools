import type { RunProfileManagedProcessStatus } from "@/lib/run-profile-process-manager";

export const MANAGED_RUN_PROFILE_POLL_MS = 1500;

export const MANAGED_RUN_PROFILE_STALE_STATE_NOTICE =
  "Managed process state was reset because the app server restarted. Start the profile again if needed.";

export function shouldShowManagedRunProfileStaleNotice(
  previousBootSessionId: string | null | undefined,
  nextBootSessionId: string | null | undefined,
): boolean {
  if (!previousBootSessionId || !nextBootSessionId) {
    return false;
  }

  return previousBootSessionId !== nextBootSessionId;
}

export function applyManagedRunProfileBootSessionId(
  previousBootSessionId: string | null | undefined,
  nextBootSessionId: string | null | undefined,
): {
  bootSessionId: string | null;
  showStaleNotice: boolean;
} {
  return {
    bootSessionId: nextBootSessionId ?? previousBootSessionId ?? null,
    showStaleNotice: shouldShowManagedRunProfileStaleNotice(
      previousBootSessionId,
      nextBootSessionId,
    ),
  };
}

export function resolveManagedRunProfileActionMessage(input: {
  showStaleStateNotice: boolean;
  actionMessage: string | null | undefined;
  status: RunProfileManagedProcessStatus;
}): string | null {
  const trimmed = input.actionMessage?.trim();
  if (!trimmed) {
    return null;
  }

  if (
    input.showStaleStateNotice &&
    !shouldPollManagedRunProfileSnapshot(input.status)
  ) {
    return null;
  }

  return trimmed;
}

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
