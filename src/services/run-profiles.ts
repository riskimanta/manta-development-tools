import path from "node:path";

import type { ProjectRunProfile } from "@prisma/client";

import { db } from "@/lib/db";
import { readRunProfilesImportFromLocalPath } from "@/lib/local-run-profiles-import";
import type { NormalizedRunProfileImportEntry } from "@/lib/validations/run-profile-import";
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

export class RunProfileImportServiceError extends Error {
  readonly code:
    | "PROJECT_NOT_FOUND"
    | "LOCAL_PATH_MISSING"
    | "PATH_UNSAFE"
    | "FILE_MISSING"
    | "JSON_INVALID"
    | "VALIDATION_FAILED";

  constructor(
    code: RunProfileImportServiceError["code"],
    message: string,
  ) {
    super(message);
    this.name = "RunProfileImportServiceError";
    this.code = code;
  }
}

export type RunProfileImportResult = {
  created: number;
  updated: number;
};

export function resolveRunProfileWorkingDirectory(
  workingDirectory: string | null | undefined,
  projectLocalPath: string | null | undefined,
): string | null {
  const trimmed = workingDirectory?.trim();
  if (trimmed) return trimmed;

  const localPath = projectLocalPath?.trim();
  return localPath || null;
}

export function resolveImportedRunProfileWorkingDirectory(
  workingDirectory: string | null | undefined,
  projectLocalPath: string | null | undefined,
): string | null {
  const localPath = projectLocalPath?.trim();
  const trimmed = workingDirectory?.trim();

  if (!trimmed) {
    return localPath || null;
  }

  if (trimmed === ".") {
    return localPath || null;
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  if (localPath) {
    return path.resolve(localPath, trimmed);
  }

  return trimmed;
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

function findExistingProfileByName(
  existing: ProjectRunProfile[],
  name: string,
): ProjectRunProfile | undefined {
  const normalized = name.trim();
  return existing.find((p) => p.name.trim() === normalized);
}

export async function importProjectRunProfilesFromLocalFile(
  projectId: string,
): Promise<RunProfileImportResult> {
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new RunProfileImportServiceError(
      "PROJECT_NOT_FOUND",
      "Project not found",
    );
  }

  const localPath = project.localPath?.trim();
  if (!localPath) {
    throw new RunProfileImportServiceError(
      "LOCAL_PATH_MISSING",
      "Set a local path on this project first, then read run profiles from that path on disk.",
    );
  }

  const readResult = await readRunProfilesImportFromLocalPath(localPath);
  if (!readResult.ok) {
    throw new RunProfileImportServiceError(
      readResult.code,
      readResult.message,
    );
  }

  return applyImportedRunProfiles(
    projectId,
    localPath,
    readResult.data.profiles,
  );
}

async function applyImportedRunProfiles(
  projectId: string,
  projectLocalPath: string,
  profiles: NormalizedRunProfileImportEntry[],
): Promise<RunProfileImportResult> {
  const hasImportedDefault = profiles.some((p) => p.isDefault);

  return db.$transaction(async (tx) => {
    const existing = await tx.projectRunProfile.findMany({
      where: { projectId },
    });

    if (hasImportedDefault) {
      await tx.projectRunProfile.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    let created = 0;
    let updated = 0;

    for (const profile of profiles) {
      const workingDirectory = resolveImportedRunProfileWorkingDirectory(
        profile.workingDirectory,
        projectLocalPath,
      );
      const match = findExistingProfileByName(existing, profile.name);

      if (match) {
        await tx.projectRunProfile.update({
          where: { id: match.id },
          data: {
            command: profile.command,
            workingDirectory,
            description: profile.description,
            isDefault: profile.isDefault,
          },
        });
        updated += 1;
      } else {
        const createdProfile = await tx.projectRunProfile.create({
          data: {
            projectId,
            name: profile.name,
            command: profile.command,
            workingDirectory,
            description: profile.description,
            isDefault: profile.isDefault,
          },
        });
        existing.push(createdProfile);
        created += 1;
      }
    }

    return { created, updated };
  });
}
