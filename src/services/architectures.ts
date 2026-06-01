import type { Project, ProjectArchitecture } from "@prisma/client";

import { buildDefaultArchitectureTemplate } from "@/lib/architecture-template";
import { readArchitectureImportFromLocalPath } from "@/lib/local-architecture-import";
import type { ArchitectureUpsertInput } from "@/lib/validations/architecture";
import { db } from "@/lib/db";

export type ArchitectureImportServiceErrorCode =
  | "PROJECT_NOT_FOUND"
  | "LOCAL_PATH_MISSING"
  | "PATH_UNSAFE"
  | "FILE_MISSING"
  | "JSON_INVALID"
  | "VALIDATION_FAILED";

export class ArchitectureImportServiceError extends Error {
  readonly code: ArchitectureImportServiceErrorCode;

  constructor(code: ArchitectureImportServiceErrorCode, message: string) {
    super(message);
    this.name = "ArchitectureImportServiceError";
    this.code = code;
  }
}

export function getProjectArchitecture(projectId: string) {
  return db.projectArchitecture.findUnique({
    where: { projectId },
  });
}

export function upsertProjectArchitecture(
  input: ArchitectureUpsertInput,
): Promise<ProjectArchitecture> {
  const { projectId, summary, mermaidSource } = input;

  return db.projectArchitecture.upsert({
    where: { projectId },
    create: { projectId, summary, mermaidSource },
    update: { summary, mermaidSource },
  });
}

export function createDefaultProjectArchitecture(
  project: Pick<Project, "id" | "name" | "repoUrl" | "localPath">,
): Promise<ProjectArchitecture> {
  return db.projectArchitecture.create({
    data: {
      projectId: project.id,
      summary: null,
      mermaidSource: buildDefaultArchitectureTemplate({
        name: project.name,
        repoUrl: project.repoUrl,
        localPath: project.localPath,
      }),
    },
  });
}

export async function importProjectArchitectureFromLocalFile(
  projectId: string,
): Promise<ProjectArchitecture> {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new ArchitectureImportServiceError(
      "PROJECT_NOT_FOUND",
      "Project not found",
    );
  }

  const localPath = project.localPath?.trim();
  if (!localPath) {
    throw new ArchitectureImportServiceError(
      "LOCAL_PATH_MISSING",
      "Set a local path on this project first, then read architecture from that path on disk.",
    );
  }

  const readResult = await readArchitectureImportFromLocalPath(localPath);
  if (!readResult.ok) {
    throw new ArchitectureImportServiceError(
      readResult.code,
      readResult.message,
    );
  }

  return upsertProjectArchitecture({
    projectId,
    summary: readResult.data.summary,
    mermaidSource: readResult.data.mermaidSource,
  });
}
