import type { WorkProgress } from "@prisma/client";

import {
  buildWorkProgressSummary,
  captureGitWorkProgressSnapshot,
  type WorkProgressChangedFile,
} from "@/lib/git-work-progress-capture";
import { db } from "@/lib/db";

export type WorkProgressRecord = {
  id: string;
  projectId: string;
  branch: string;
  latestCommitHash: string;
  latestCommitMessage: string;
  latestCommitAuthor: string;
  latestCommitDate: string;
  changedFiles: WorkProgressChangedFile[];
  changedFilesCount: number;
  gitStatusText: string;
  summary: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkProgressServiceErrorCode =
  | "PROJECT_NOT_FOUND"
  | "LOCAL_PATH_MISSING"
  | "PATH_UNSAFE"
  | "NOT_GIT_REPOSITORY"
  | "GIT_COMMAND_FAILED";

export class WorkProgressServiceError extends Error {
  readonly code: WorkProgressServiceErrorCode;

  constructor(code: WorkProgressServiceErrorCode, message: string) {
    super(message);
    this.name = "WorkProgressServiceError";
    this.code = code;
  }
}

export const WORK_PROGRESS_UI_LIMIT = 10;

function parseChangedFilesJson(raw: string): WorkProgressChangedFile[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (
        item &&
        typeof item === "object" &&
        "status" in item &&
        "path" in item &&
        typeof item.status === "string" &&
        typeof item.path === "string"
      ) {
        return [{ status: item.status, path: item.path }];
      }

      return [];
    });
  } catch {
    return [];
  }
}

export function toWorkProgressRecord(row: WorkProgress): WorkProgressRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    branch: row.branch,
    latestCommitHash: row.latestCommitHash,
    latestCommitMessage: row.latestCommitMessage,
    latestCommitAuthor: row.latestCommitAuthor,
    latestCommitDate: row.latestCommitDate.toISOString(),
    changedFiles: parseChangedFilesJson(row.changedFilesJson),
    changedFilesCount: row.changedFilesCount,
    gitStatusText: row.gitStatusText,
    summary: row.summary,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapGitCaptureError(
  code: "PATH_UNSAFE" | "NOT_GIT_REPOSITORY" | "GIT_COMMAND_FAILED",
  message: string,
): WorkProgressServiceError {
  return new WorkProgressServiceError(code, message);
}

export async function captureWorkProgressSnapshot(
  projectId: string,
  note?: string | null,
): Promise<WorkProgressRecord> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, localPath: true },
  });

  if (!project) {
    throw new WorkProgressServiceError("PROJECT_NOT_FOUND", "Project not found");
  }

  const localPath = project.localPath?.trim();
  if (!localPath) {
    throw new WorkProgressServiceError(
      "LOCAL_PATH_MISSING",
      "Set a local path on this project first, then capture Git work progress from that repository.",
    );
  }

  const captureResult = await captureGitWorkProgressSnapshot(localPath);
  if (!captureResult.ok) {
    throw mapGitCaptureError(captureResult.code, captureResult.message);
  }

  const snapshot = captureResult.snapshot;
  const summary = buildWorkProgressSummary(snapshot);
  const trimmedNote = note?.trim() || null;

  const row = await db.workProgress.create({
    data: {
      projectId,
      branch: snapshot.branch,
      latestCommitHash: snapshot.latestCommitHash,
      latestCommitMessage: snapshot.latestCommitMessage,
      latestCommitAuthor: snapshot.latestCommitAuthor,
      latestCommitDate: new Date(snapshot.latestCommitDate),
      changedFilesJson: JSON.stringify(snapshot.changedFiles),
      changedFilesCount: snapshot.changedFiles.length,
      gitStatusText: snapshot.gitStatusText,
      summary,
      note: trimmedNote,
    },
  });

  return toWorkProgressRecord(row);
}

export async function listWorkProgressByProjectId(
  projectId: string,
  limit: number = WORK_PROGRESS_UI_LIMIT,
): Promise<WorkProgressRecord[]> {
  const rows = await db.workProgress.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toWorkProgressRecord);
}
