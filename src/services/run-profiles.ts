import type { ProjectRunProfile } from "@prisma/client";

import { db } from "@/lib/db";
import type {
  RunProfileCreateInput,
  RunProfileUpdateInput,
} from "@/lib/validations/run-profile";

export class RunProfileServiceError extends Error {
  readonly code: "PROJECT_NOT_FOUND" | "RUN_PROFILE_NOT_FOUND";

  constructor(
    code: RunProfileServiceError["code"],
    message: string,
  ) {
    super(message);
    this.name = "RunProfileServiceError";
    this.code = code;
  }
}

export function resolveRunProfileWorkingDirectory(
  workingDirectory: string | null | undefined,
  projectLocalPath: string | null | undefined,
): string | null {
  const trimmed = workingDirectory?.trim();
  if (trimmed) return trimmed;

  const localPath = projectLocalPath?.trim();
  return localPath || null;
}

export function listRunProfilesByProjectId(projectId: string) {
  return db.projectRunProfile.findMany({
    where: { projectId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export function getRunProfileById(id: string) {
  return db.projectRunProfile.findUnique({ where: { id } });
}

export async function createRunProfileRecord(
  input: RunProfileCreateInput,
  projectLocalPath: string | null,
): Promise<ProjectRunProfile> {
  const project = await db.project.findUnique({
    where: { id: input.projectId },
    select: { id: true },
  });
  if (!project) {
    throw new RunProfileServiceError("PROJECT_NOT_FOUND", "Project not found");
  }

  const workingDirectory = resolveRunProfileWorkingDirectory(
    input.workingDirectory,
    projectLocalPath,
  );

  return db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.projectRunProfile.updateMany({
        where: { projectId: input.projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.projectRunProfile.create({
      data: {
        projectId: input.projectId,
        name: input.name.trim(),
        command: input.command.trim(),
        workingDirectory,
        description: input.description,
        isDefault: input.isDefault,
      },
    });
  });
}

export async function updateRunProfileRecord(
  input: RunProfileUpdateInput,
  projectLocalPath: string | null,
): Promise<ProjectRunProfile> {
  const existing = await db.projectRunProfile.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    throw new RunProfileServiceError(
      "RUN_PROFILE_NOT_FOUND",
      "Run profile not found",
    );
  }

  const workingDirectory = resolveRunProfileWorkingDirectory(
    input.workingDirectory,
    projectLocalPath,
  );

  return db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.projectRunProfile.updateMany({
        where: {
          projectId: existing.projectId,
          isDefault: true,
          id: { not: input.id },
        },
        data: { isDefault: false },
      });
    }

    return tx.projectRunProfile.update({
      where: { id: input.id },
      data: {
        name: input.name.trim(),
        command: input.command.trim(),
        workingDirectory,
        description: input.description,
        isDefault: input.isDefault,
      },
    });
  });
}

export async function deleteRunProfileRecord(id: string): Promise<void> {
  const existing = await db.projectRunProfile.findUnique({ where: { id } });
  if (!existing) {
    throw new RunProfileServiceError(
      "RUN_PROFILE_NOT_FOUND",
      "Run profile not found",
    );
  }

  await db.projectRunProfile.delete({ where: { id } });
}
