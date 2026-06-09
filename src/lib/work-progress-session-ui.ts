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

export const WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_HINT =
  "Open the session detail page to paste and save one.";

export const WORK_PROGRESS_NO_CAPTURE_YET_LABEL =
  "No work progress captured yet.";

export const WORK_PROGRESS_NO_CAPTURE_NO_LOCAL_PATH_HINT =
  "Set a local path and capture progress to start tracking development work.";

export const WORK_PROGRESS_NO_CAPTURE_WITH_LOCAL_PATH_HINT =
  "Capture progress from the button above or run mandev track from the project folder.";

/** @deprecated Use WORK_PROGRESS_NO_CAPTURE_YET_LABEL */
export const WORK_PROGRESS_DASHBOARD_NO_SNAPSHOTS_LABEL =
  WORK_PROGRESS_NO_CAPTURE_YET_LABEL;

export const WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_LABEL =
  "No work progress sessions match these filters.";

export const WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_HINT =
  "Clear filters to see all sessions.";

export const WORK_PROGRESS_DERIVED_SESSION_NOTICE =
  "This session is derived from Work Progress snapshots. Its link may change if future snapshots regroup the session.";

export const WORK_PROGRESS_USAGE_GUIDE_TITLE = "How to use Work Progress";

export const WORK_PROGRESS_USAGE_GUIDE_STEPS = [
  "Capture once from the Project Detail page.",
  "Run mandev track from a registered project folder.",
  "Use mandev track --watch during a development session.",
  "Review sessions, copy an AI prompt, and save the final summary.",
] as const;

export const WORK_PROGRESS_TERMINAL_TOKEN_HINT =
  "Run from a registered project folder after setting MANDEV_AGENT_TOKEN locally.";

export const WORK_PROGRESS_CLEAN_WORKING_TREE_LABEL = "Clean working tree.";

export const WORK_PROGRESS_DASHBOARD_SUMMARY_SECTION_LABEL = "Summary";

export const WORK_PROGRESS_DASHBOARD_LATEST_SESSION_LABEL = "Latest session";

export const WORK_PROGRESS_DASHBOARD_LATEST_SAVED_SUMMARY_LABEL =
  "Latest saved AI summary";

export function formatWorkProgressCleanDirtyLabel(isClean: boolean): string {
  return isClean ? "Clean working tree" : "Dirty working tree";
}

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
