import type { ProjectRunProfileRun } from "@prisma/client";

import { db } from "@/lib/db";
import { truncateRunProfileOutputPreview } from "@/lib/run-profile-execution";
import {
  RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL,
  type RunProfileRunRecord,
} from "@/lib/run-profile-run-history-types";
import { RUN_PROFILE_ALL_RUNS_PAGE_LIMIT } from "@/lib/run-profile-run-history-ui";
import type {
  RunProfileManagedProcessSnapshot,
  RunProfileManagedProcessStatus,
} from "@/lib/run-profile-process-manager";

const DEFAULT_RUN_HISTORY_LIMIT = RUN_PROFILE_ALL_RUNS_PAGE_LIMIT;

const TERMINAL_RUN_STATUSES: RunProfileManagedProcessStatus[] = [
  "stopped",
  "failed",
  "exited",
];

function logRunHistoryError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[run-profile-run-history] ${context}: ${message}`);
}

export function toRunProfileRunRecord(
  row: ProjectRunProfileRun,
): RunProfileRunRecord {
  return {
    id: row.id,
    runProfileId: row.runProfileId,
    status: row.status,
    command: row.command,
    workingDirectory: row.workingDirectory,
    pid: row.pid,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    exitCode: row.exitCode,
    signal: row.signal,
    durationMs: row.durationMs,
    stdoutPreview: row.stdoutPreview,
    stderrPreview: row.stderrPreview,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseSnapshotStartedAt(snapshot: RunProfileManagedProcessSnapshot): Date {
  if (snapshot.startedAt) {
    const parsed = new Date(snapshot.startedAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function resolveSnapshotEndedAt(
  snapshot: RunProfileManagedProcessSnapshot,
): Date {
  const candidate = snapshot.exitedAt ?? snapshot.stoppedAt;
  if (candidate) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function computeDurationMs(startedAt: Date, endedAt: Date): number {
  return Math.max(0, endedAt.getTime() - startedAt.getTime());
}

function buildLogPreviews(snapshot: RunProfileManagedProcessSnapshot): {
  stdoutPreview: string | null;
  stderrPreview: string | null;
} {
  const stdout = snapshot.logs.stdout.trim();
  const stderr = snapshot.logs.stderr.trim();

  return {
    stdoutPreview: stdout ? truncateRunProfileOutputPreview(stdout) : null,
    stderrPreview: stderr ? truncateRunProfileOutputPreview(stderr) : null,
  };
}

async function findOpenRunProfileRun(runProfileId: string) {
  return db.projectRunProfileRun.findFirst({
    where: {
      runProfileId,
      endedAt: null,
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

export async function createRunProfileRunForManagedStart(
  snapshot: RunProfileManagedProcessSnapshot,
): Promise<void> {
  try {
    await db.projectRunProfileRun.create({
      data: {
        runProfileId: snapshot.runProfileId,
        status: snapshot.status,
        command: snapshot.command,
        workingDirectory: snapshot.workingDirectory,
        pid: snapshot.pid,
        startedAt: parseSnapshotStartedAt(snapshot),
      },
    });
  } catch (error) {
    logRunHistoryError("createRunProfileRunForManagedStart", error);
  }
}

export async function updateRunProfileRunOnSpawn(
  snapshot: RunProfileManagedProcessSnapshot,
): Promise<void> {
  try {
    const openRun = await findOpenRunProfileRun(snapshot.runProfileId);
    if (!openRun) {
      return;
    }

    await db.projectRunProfileRun.update({
      where: { id: openRun.id },
      data: {
        status: snapshot.status,
        pid: snapshot.pid,
      },
    });
  } catch (error) {
    logRunHistoryError("updateRunProfileRunOnSpawn", error);
  }
}

export async function finalizeRunProfileRunFromSnapshot(
  snapshot: RunProfileManagedProcessSnapshot,
): Promise<void> {
  if (!TERMINAL_RUN_STATUSES.includes(snapshot.status)) {
    return;
  }

  try {
    const openRun = await findOpenRunProfileRun(snapshot.runProfileId);
    if (!openRun) {
      return;
    }

    const endedAt = resolveSnapshotEndedAt(snapshot);
    const durationMs = computeDurationMs(openRun.startedAt, endedAt);
    const { stdoutPreview, stderrPreview } = buildLogPreviews(snapshot);

    await db.projectRunProfileRun.update({
      where: { id: openRun.id },
      data: {
        status: snapshot.status,
        pid: snapshot.pid,
        endedAt,
        exitCode: snapshot.exitCode,
        signal: snapshot.signal,
        durationMs,
        stdoutPreview,
        stderrPreview,
      },
    });
  } catch (error) {
    logRunHistoryError("finalizeRunProfileRunFromSnapshot", error);
  }
}

export async function listRunProfileRuns(
  runProfileId: string,
  limit: number = DEFAULT_RUN_HISTORY_LIMIT,
): Promise<RunProfileRunRecord[]> {
  const rows = await db.projectRunProfileRun.findMany({
    where: { runProfileId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return rows.map(toRunProfileRunRecord);
}

export async function getLatestRunProfileRun(
  runProfileId: string,
): Promise<RunProfileRunRecord | null> {
  const row = await db.projectRunProfileRun.findFirst({
    where: { runProfileId },
    orderBy: { startedAt: "desc" },
  });

  return row ? toRunProfileRunRecord(row) : null;
}

/** In-progress run-history statuses orphaned when ManDev restarts mid-lifecycle. */
const BOOT_STALE_RUN_STATUSES = ["starting", "running", "stopping"] as const;

export async function markActiveRunProfileRunsStaleOnBoot(): Promise<number> {
  try {
    const now = new Date();
    const activeRows = await db.projectRunProfileRun.findMany({
      where: { status: { in: [...BOOT_STALE_RUN_STATUSES] } },
      select: { id: true, startedAt: true },
    });

    if (activeRows.length === 0) {
      return 0;
    }

    await db.$transaction(
      activeRows.map((row) =>
        db.projectRunProfileRun.update({
          where: { id: row.id },
          data: {
            status: "stale",
            endedAt: now,
            durationMs: computeDurationMs(row.startedAt, now),
            signal: RUN_PROFILE_RUN_STALE_APP_RESTART_SIGNAL,
          },
        }),
      ),
    );

    return activeRows.length;
  } catch (error) {
    logRunHistoryError("markActiveRunProfileRunsStaleOnBoot", error);
    return 0;
  }
}
