/** Signal stored on run-history rows orphaned by app/server restart recovery. */
export const RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL = "APP_RESTART";

export type RunProfileRunRecord = {
  id: string;
  runProfileId: string;
  status: string;
  command: string;
  workingDirectory: string;
  pid: number | null;
  startedAt: string;
  endedAt: string | null;
  exitCode: number | null;
  signal: string | null;
  durationMs: number | null;
  stdoutPreview: string | null;
  stderrPreview: string | null;
  createdAt: string;
  updatedAt: string;
};
