import type { ProjectRunProfile } from "@prisma/client";
import fs from "node:fs";

import { db } from "@/lib/db";
import {
  COMMAND_EXECUTION_DISABLED_MESSAGE,
  isCommandExecutionEnabled,
} from "@/lib/mandev-command-execution";
import {
  executeSavedRunProfileCommand,
  validateRunProfileExecutionTarget,
  type RunProfileExecutionResult,
} from "@/lib/run-profile-execution";
import type {
  ManagedRunProfileActionFailureReason,
  ManagedRunProfileActionResult,
} from "@/lib/run-profile-managed-action-types";
import {
  getRunProfileProcessManagerBootSessionId,
  runProfileProcessManager,
} from "@/lib/run-profile-process-manager";
import { readRunProfilesImportFromLocalPath } from "@/lib/local-run-profiles-import";
import { resolveImportedRunProfileWorkingDirectory } from "@/lib/run-profile-working-directory";
import { buildRunProfilesImportPreview } from "@/lib/run-profiles-import-preview";
import type { RunProfilesImportPreview } from "@/lib/run-profiles-import-preview";
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

type RunProfileFsAccess = {
  exists: (path: string) => boolean;
  isDirectory: (path: string) => boolean;
};

function defaultRunProfileFsAccess(): RunProfileFsAccess {
  return {
    exists: (targetPath) => fs.existsSync(targetPath),
    isDirectory: (targetPath) => {
      try {
        return fs.statSync(targetPath).isDirectory();
      } catch {
        return false;
      }
    },
  };
}

function validationFailureToManagedResult(
  validation: RunProfileExecutionResult,
  profile: { command: string; workingDirectory: string | null },
  fsAccess: RunProfileFsAccess,
): ManagedRunProfileActionResult {
  const command = profile.command.trim();
  const workingDirectory = profile.workingDirectory?.trim();

  let reason: ManagedRunProfileActionFailureReason;
  if (!command) {
    reason = "invalid_command";
  } else if (!workingDirectory) {
    reason = "missing_working_directory";
  } else if (!fsAccess.exists(workingDirectory)) {
    reason = "invalid_working_directory";
  } else {
    reason = "not_directory";
  }

  return withProcessManagerBootSessionId({
    ok: false,
    snapshot: null,
    message: validation.message,
    reason,
  });
}

function validateSavedProfileForManagedExecution(
  profile: ProjectRunProfile,
  fsAccess: RunProfileFsAccess = defaultRunProfileFsAccess(),
): ManagedRunProfileActionResult | null {
  const validation = validateRunProfileExecutionTarget({
    command: profile.command,
    workingDirectory: profile.workingDirectory,
    exists: fsAccess.exists,
    isDirectory: fsAccess.isDirectory,
  });

  if (!validation) {
    return null;
  }

  return validationFailureToManagedResult(validation, profile, fsAccess);
}

type ManagedRunProfileActionResultWithoutBootSessionId =
  | Omit<
      Extract<ManagedRunProfileActionResult, { ok: true }>,
      "processManagerBootSessionId"
    >
  | Omit<
      Extract<ManagedRunProfileActionResult, { ok: false }>,
      "processManagerBootSessionId"
    >;

function withProcessManagerBootSessionId(
  result: ManagedRunProfileActionResultWithoutBootSessionId,
): ManagedRunProfileActionResult {
  return {
    ...result,
    processManagerBootSessionId: getRunProfileProcessManagerBootSessionId(),
  };
}

function disabledManagedResult(): ManagedRunProfileActionResult {
  return withProcessManagerBootSessionId({
    ok: false,
    snapshot: null,
    message: COMMAND_EXECUTION_DISABLED_MESSAGE,
    reason: "disabled",
  });
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

export { resolveImportedRunProfileWorkingDirectory } from "@/lib/run-profile-working-directory";

export function listRunProfilesByProjectId(projectId: string) {
  return db.projectRunProfile.findMany({
    where: { projectId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export function getRunProfileById(id: string) {
  return db.projectRunProfile.findUnique({ where: { id } });
}

export async function executeRunProfileCommand(
  profileId: string,
): Promise<RunProfileExecutionResult> {
  if (!isCommandExecutionEnabled()) {
    return {
      status: "disabled",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message: COMMAND_EXECUTION_DISABLED_MESSAGE,
    };
  }

  const profile = await getRunProfileById(profileId);
  if (!profile) {
    throw new RunProfileServiceError(
      "RUN_PROFILE_NOT_FOUND",
      "Run profile not found",
    );
  }

  if (!profile.workingDirectory?.trim()) {
    return {
      status: "blocked",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message:
        "Working directory is required before ManDev can run this profile.",
    };
  }

  return executeSavedRunProfileCommand({
    command: profile.command,
    workingDirectory: profile.workingDirectory,
  });
}

export async function startManagedRunProfile(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  if (!isCommandExecutionEnabled()) {
    return disabledManagedResult();
  }

  const profile = await getRunProfileById(runProfileId);
  if (!profile) {
    return withProcessManagerBootSessionId({
      ok: false,
      snapshot: null,
      message: "Run profile not found",
      reason: "not_found",
    });
  }

  const validationFailure = validateSavedProfileForManagedExecution(profile);
  if (validationFailure) {
    return validationFailure;
  }

  const snapshot = runProfileProcessManager.start({
    runProfileId: profile.id,
    command: profile.command.trim(),
    workingDirectory: profile.workingDirectory!.trim(),
  });

  return withProcessManagerBootSessionId({
    ok: true,
    snapshot,
    message: snapshot.message,
  });
}

export async function stopManagedRunProfile(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  if (!isCommandExecutionEnabled()) {
    return disabledManagedResult();
  }

  const snapshot = runProfileProcessManager.stop(runProfileId);
  if (!snapshot) {
    return withProcessManagerBootSessionId({
      ok: false,
      snapshot: null,
      message: "No managed process found for this run profile.",
      reason: "manager_error",
    });
  }

  return withProcessManagerBootSessionId({
    ok: true,
    snapshot,
    message: snapshot.message,
  });
}

export async function restartManagedRunProfile(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  if (!isCommandExecutionEnabled()) {
    return disabledManagedResult();
  }

  const profile = await getRunProfileById(runProfileId);
  if (!profile) {
    return withProcessManagerBootSessionId({
      ok: false,
      snapshot: null,
      message: "Run profile not found",
      reason: "not_found",
    });
  }

  const validationFailure = validateSavedProfileForManagedExecution(profile);
  if (validationFailure) {
    return validationFailure;
  }

  const snapshot = runProfileProcessManager.restart({
    runProfileId: profile.id,
    command: profile.command.trim(),
    workingDirectory: profile.workingDirectory!.trim(),
  });

  return withProcessManagerBootSessionId({
    ok: true,
    snapshot,
    message: snapshot.message,
  });
}

export function getManagedRunProfileSnapshot(
  runProfileId: string,
): ManagedRunProfileActionResult {
  const snapshot = runProfileProcessManager.getSnapshot(runProfileId);

  return withProcessManagerBootSessionId({
    ok: true,
    snapshot,
    message: snapshot
      ? snapshot.message
      : "No managed process for this run profile.",
  });
}

export function listManagedRunProfileSnapshots(): ManagedRunProfileActionResult {
  const snapshots = runProfileProcessManager.listSnapshots();

  return withProcessManagerBootSessionId({
    ok: true,
    snapshot: null,
    snapshots,
    message:
      snapshots.length === 0
        ? "No managed processes are currently registered."
        : `Found ${snapshots.length} managed process(es).`,
  });
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

export async function previewProjectRunProfilesImportFromLocalFile(
  projectId: string,
): Promise<RunProfilesImportPreview> {
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

  const existing = await listRunProfilesByProjectId(projectId);

  return buildRunProfilesImportPreview({
    existing: existing.map((profile) => ({
      name: profile.name,
      command: profile.command,
      workingDirectory: profile.workingDirectory,
      description: profile.description,
      isDefault: profile.isDefault,
    })),
    imported: readResult.data.profiles,
    projectLocalPath: localPath,
  });
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
