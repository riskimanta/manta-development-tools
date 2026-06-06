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
