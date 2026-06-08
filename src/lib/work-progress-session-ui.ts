export function formatSessionDurationMs(durationMs: number): string {
  if (durationMs < 60_000) {
    const seconds = Math.max(1, Math.round(durationMs / 1000));
    return `${seconds}s`;
  }

  const totalMinutes = Math.floor(durationMs / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatWorkProgressSessionTitle(branch: string | null): string {
  return branch ? `Work session on ${branch}` : "Work session";
}

export const WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL = "AI Summary";

export const WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL =
  "No saved AI summary yet.";

export function formatWorkProgressTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
