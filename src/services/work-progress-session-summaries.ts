import type { WorkProgressSessionSummary } from "@prisma/client";

import { db } from "@/lib/db";
import {
  findWorkProgressSessionById,
  groupWorkProgressIntoSessions,
} from "@/lib/work-progress-session";
import type { WorkProgressSession } from "@/lib/work-progress-session";
import { listWorkProgressEntriesByProjectId } from "@/services/work-progress";

export type WorkProgressSessionDetailPageData = {
  project: {
    id: string;
    name: string;
    slug: string;
    localPath: string | null;
  };
  session: WorkProgressSession;
  summary: WorkProgressSessionSummaryRecord | null;
};

export type WorkProgressSessionSummaryRecord = {
  id: string;
  projectId: string;
  sessionId: string;
  summaryMarkdown: string;
  firstSnapshotId: string | null;
  latestSnapshotId: string | null;
  branch: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkProgressSessionSummaryServiceErrorCode =
  | "PROJECT_NOT_FOUND"
  | "SESSION_NOT_FOUND";

export class WorkProgressSessionSummaryServiceError extends Error {
  readonly code: WorkProgressSessionSummaryServiceErrorCode;

  constructor(
    code: WorkProgressSessionSummaryServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WorkProgressSessionSummaryServiceError";
    this.code = code;
  }
}

function toWorkProgressSessionSummaryRecord(
  row: WorkProgressSessionSummary,
): WorkProgressSessionSummaryRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    sessionId: row.sessionId,
    summaryMarkdown: row.summaryMarkdown,
    firstSnapshotId: row.firstSnapshotId,
    latestSnapshotId: row.latestSnapshotId,
    branch: row.branch,
    sessionStartedAt: row.sessionStartedAt?.toISOString() ?? null,
    sessionEndedAt: row.sessionEndedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getWorkProgressSessionSummary(
  projectId: string,
  sessionId: string,
): Promise<WorkProgressSessionSummaryRecord | null> {
  const row = await db.workProgressSessionSummary.findUnique({
    where: {
      projectId_sessionId: {
        projectId,
        sessionId,
      },
    },
  });

  return row ? toWorkProgressSessionSummaryRecord(row) : null;
}

export async function upsertWorkProgressSessionSummary(input: {
  projectId: string;
  sessionId: string;
  summaryMarkdown: string;
}): Promise<WorkProgressSessionSummaryRecord> {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { id: true },
  });

  if (!project) {
    throw new WorkProgressSessionSummaryServiceError(
      "PROJECT_NOT_FOUND",
      "Project not found",
    );
  }

  const entries = await listWorkProgressEntriesByProjectId(input.projectId);
  const sessions = groupWorkProgressIntoSessions(entries);
  const session = findWorkProgressSessionById(sessions, input.sessionId);

  if (!session) {
    throw new WorkProgressSessionSummaryServiceError(
      "SESSION_NOT_FOUND",
      "Work progress session not found",
    );
  }

  const row = await db.workProgressSessionSummary.upsert({
    where: {
      projectId_sessionId: {
        projectId: input.projectId,
        sessionId: input.sessionId,
      },
    },
    create: {
      projectId: input.projectId,
      sessionId: input.sessionId,
      summaryMarkdown: input.summaryMarkdown,
      firstSnapshotId: session.firstSnapshotId,
      latestSnapshotId: session.latestSnapshotId,
      branch: session.branch,
      sessionStartedAt: new Date(session.startedAt),
      sessionEndedAt: new Date(session.endedAt),
    },
    update: {
      summaryMarkdown: input.summaryMarkdown,
      firstSnapshotId: session.firstSnapshotId,
      latestSnapshotId: session.latestSnapshotId,
      branch: session.branch,
      sessionStartedAt: new Date(session.startedAt),
      sessionEndedAt: new Date(session.endedAt),
    },
  });

  return toWorkProgressSessionSummaryRecord(row);
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

  const summary = await getWorkProgressSessionSummary(projectId, sessionId);

  return {
    project,
    session,
    summary,
  };
}
