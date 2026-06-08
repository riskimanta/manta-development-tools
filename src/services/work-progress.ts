import type { WorkProgress } from "@prisma/client";

import {
  buildWorkProgressSummary,
  captureGitWorkProgressSnapshot,
  type GitWorkProgressSnapshot,
  type WorkProgressChangedFile,
} from "@/lib/git-work-progress-capture";
import {
  findBestMatchingProject,
  type ProjectLocalPathCandidate,
} from "@/lib/project-local-path-match";
import { isSameWorkProgressSnapshot } from "@/lib/work-progress-dedupe";
import {
  findWorkProgressSessionById,
  groupWorkProgressIntoSessions,
  type WorkProgressSession,
} from "@/lib/work-progress-session";
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
export const WORK_PROGRESS_SESSIONS_ENTRY_LIMIT = 200;

export type WorkProgressSessionsPageData = {
  project: {
    id: string;
    name: string;
    slug: string;
    localPath: string | null;
  };
  sessions: WorkProgressSession[];
  entryCount: number;
};

export type WorkProgressSessionDetailPageData = {
  project: {
    id: string;
    name: string;
    slug: string;
    localPath: string | null;
  };
  session: WorkProgressSession;
};

export type WorkProgressProjectMatch = ProjectLocalPathCandidate;

export type WorkProgressCwdCaptureResult = {
  project: WorkProgressProjectMatch;
  snapshot: WorkProgressRecord;
  created: boolean;
  skipped: boolean;
  reason?: "UNCHANGED";
};

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

export async function findProjectForWorkProgressCwd(
  cwd: string,
): Promise<WorkProgressProjectMatch | null> {
  const projects = await db.project.findMany({
    where: {
      localPath: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      localPath: true,
    },
  });

  const candidates = projects.flatMap((project) => {
    const localPath = project.localPath?.trim();
    if (!localPath) {
      return [];
    }

    return [
      {
        id: project.id,
        name: project.name,
        slug: project.slug,
        localPath,
      },
    ];
  });

  return findBestMatchingProject(cwd, candidates);
}

async function persistGitWorkProgressSnapshot(
  projectId: string,
  snapshot: GitWorkProgressSnapshot,
  note?: string | null,
): Promise<WorkProgressRecord> {
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

export async function captureWorkProgressForCwd(input: {
  cwd: string;
  note?: string | null;
  dedupe?: boolean;
}): Promise<WorkProgressCwdCaptureResult> {
  const project = await findProjectForWorkProgressCwd(input.cwd);
  if (!project) {
    throw new WorkProgressServiceError(
      "PROJECT_NOT_FOUND",
      "No registered ManDev project matches the current working directory. Run mandev track from a folder whose localPath is registered in ManDev.",
    );
  }

  if (!input.dedupe) {
    const snapshot = await captureWorkProgressSnapshot(project.id, input.note);

    return {
      project,
      snapshot,
      created: true,
      skipped: false,
    };
  }

  const localPath = project.localPath.trim();
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

  const gitSnapshot = captureResult.snapshot;
  const latestRow = await db.workProgress.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });

  if (
    latestRow &&
    isSameWorkProgressSnapshot(
      {
        branch: gitSnapshot.branch,
        latestCommitHash: gitSnapshot.latestCommitHash,
        gitStatusText: gitSnapshot.gitStatusText,
        changedFilesJson: JSON.stringify(gitSnapshot.changedFiles),
      },
      {
        branch: latestRow.branch,
        latestCommitHash: latestRow.latestCommitHash,
        gitStatusText: latestRow.gitStatusText,
        changedFilesJson: latestRow.changedFilesJson,
      },
    )
  ) {
    return {
      project,
      snapshot: toWorkProgressRecord(latestRow),
      created: false,
      skipped: true,
      reason: "UNCHANGED",
    };
  }

  const snapshot = await persistGitWorkProgressSnapshot(
    project.id,
    gitSnapshot,
    input.note,
  );

  return {
    project,
    snapshot,
    created: true,
    skipped: false,
  };
}

export async function listWorkProgressEntriesByProjectId(
  projectId: string,
  limit: number = WORK_PROGRESS_SESSIONS_ENTRY_LIMIT,
): Promise<WorkProgressRecord[]> {
  const rows = await db.workProgress.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toWorkProgressRecord);
}

export async function listWorkProgressByProjectId(
  projectId: string,
  limit: number = WORK_PROGRESS_UI_LIMIT,
): Promise<WorkProgressRecord[]> {
  return listWorkProgressEntriesByProjectId(projectId, limit);
}

export async function listWorkProgressSessionsByProjectId(
  projectId: string,
  limit: number = WORK_PROGRESS_SESSIONS_ENTRY_LIMIT,
): Promise<WorkProgressSession[]> {
  const entries = await listWorkProgressEntriesByProjectId(projectId, limit);
  return groupWorkProgressIntoSessions(entries);
}

export async function getWorkProgressSessionsPageData(
  projectId: string,
): Promise<WorkProgressSessionsPageData | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      slug: true,
      localPath: true,
    },
  });

  if (!project) {
    return null;
  }

  const entries = await listWorkProgressEntriesByProjectId(projectId);
  const sessions = groupWorkProgressIntoSessions(entries);

  return {
    project,
    sessions,
    entryCount: entries.length,
  };
}

export async function getWorkProgressSessionDetailPageData(
  projectId: string,
  sessionId: string,
): Promise<WorkProgressSessionDetailPageData | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      slug: true,
      localPath: true,
    },
  });

  if (!project) {
    return null;
  }

  const entries = await listWorkProgressEntriesByProjectId(projectId);
  const sessions = groupWorkProgressIntoSessions(entries);
  const session = findWorkProgressSessionById(sessions, sessionId);

  if (!session) {
    return null;
  }

  return {
    project,
    session,
  };
}
