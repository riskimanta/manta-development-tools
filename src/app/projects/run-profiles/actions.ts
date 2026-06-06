"use server";

import { revalidatePath } from "next/cache";

import {
  runProfileCreateSchema,
  runProfileUpdateSchema,
} from "@/lib/validations/run-profile";
import { getProjectById } from "@/services/projects";
import type { RunProfilesImportPreview } from "@/lib/run-profiles-import-preview";
import type { RunProfileExecutionResult } from "@/lib/run-profile-execution";
import {
  createRunProfileRecord,
  deleteRunProfileRecord,
  executeRunProfileCommand,
  getManagedRunProfileSnapshot,
  importProjectRunProfilesFromLocalFile,
  listManagedRunProfileSnapshots,
  previewProjectRunProfilesImportFromLocalFile,
  restartManagedRunProfile,
  RunProfileImportServiceError,
  RunProfileServiceError,
  startManagedRunProfile,
  stopManagedRunProfile,
  updateRunProfileRecord,
  type ManagedRunProfileActionResult,
} from "@/services/run-profiles";

export type { ManagedRunProfileActionResult };

export type RunProfileActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function flattenZodErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  const fe = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(fe)) {
    if (v?.length) out[k] = v;
  }
  return out;
}

function parseRunProfileForm(formData: FormData) {
  return {
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    command: formData.get("command"),
    workingDirectory: formData.get("workingDirectory"),
    description: formData.get("description"),
    isDefault: formData.get("isDefault"),
  };
}

async function getProjectLocalPath(projectId: string): Promise<string | null> {
  const project = await getProjectById(projectId);
  return project?.localPath ?? null;
}

export async function createRunProfile(
  _prev: RunProfileActionState | undefined,
  formData: FormData,
): Promise<RunProfileActionState> {
  const parsed = runProfileCreateSchema.safeParse(parseRunProfileForm(formData));
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { projectId } = parsed.data;

  try {
    const localPath = await getProjectLocalPath(projectId);
    await createRunProfileRecord(parsed.data, localPath);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, message: "Run profile created" };
  } catch (e) {
    if (e instanceof RunProfileServiceError) {
      return { message: e.message };
    }
    throw e;
  }
}

export async function updateRunProfile(
  _prev: RunProfileActionState | undefined,
  formData: FormData,
): Promise<RunProfileActionState> {
  const raw = {
    id: formData.get("id"),
    ...parseRunProfileForm(formData),
  };

  const parsed = runProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { projectId } = parsed.data;

  try {
    const localPath = await getProjectLocalPath(projectId);
    await updateRunProfileRecord(parsed.data, localPath);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, message: "Run profile updated" };
  } catch (e) {
    if (e instanceof RunProfileServiceError) {
      return { message: e.message };
    }
    throw e;
  }
}

export async function deleteRunProfile(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id) {
    return;
  }

  await deleteRunProfileRecord(id);

  if (typeof projectId === "string" && projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

export type RunProfileImportPreviewActionResult =
  | { ok: true; preview: RunProfilesImportPreview }
  | { ok: false; message: string };

export async function previewRunProfilesImportFromLocalPathAction(
  projectId: string,
): Promise<RunProfileImportPreviewActionResult> {
  if (!projectId.trim()) {
    return { ok: false, message: "Project is required" };
  }

  try {
    const preview = await previewProjectRunProfilesImportFromLocalFile(
      projectId.trim(),
    );
    return { ok: true, preview };
  } catch (e) {
    if (e instanceof RunProfileImportServiceError) {
      return { ok: false, message: e.message };
    }
    throw e;
  }
}

function requireManagedRunProfileId(
  runProfileId: string,
): ManagedRunProfileActionResult | null {
  const id = runProfileId.trim();
  if (!id) {
    return {
      ok: false,
      snapshot: null,
      message: "Run profile is required.",
      reason: "not_found",
    };
  }
  return null;
}

export async function startManagedRunProfileAction(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  const missing = requireManagedRunProfileId(runProfileId);
  if (missing) {
    return missing;
  }

  return startManagedRunProfile(runProfileId.trim());
}

export async function stopManagedRunProfileAction(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  const missing = requireManagedRunProfileId(runProfileId);
  if (missing) {
    return missing;
  }

  return stopManagedRunProfile(runProfileId.trim());
}

export async function restartManagedRunProfileAction(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  const missing = requireManagedRunProfileId(runProfileId);
  if (missing) {
    return missing;
  }

  return restartManagedRunProfile(runProfileId.trim());
}

export async function getManagedRunProfileSnapshotAction(
  runProfileId: string,
): Promise<ManagedRunProfileActionResult> {
  const missing = requireManagedRunProfileId(runProfileId);
  if (missing) {
    return missing;
  }

  return getManagedRunProfileSnapshot(runProfileId.trim());
}

export async function listManagedRunProfileSnapshotsAction(): Promise<ManagedRunProfileActionResult> {
  return listManagedRunProfileSnapshots();
}

export async function executeRunProfileAction(
  profileId: string,
): Promise<RunProfileExecutionResult> {
  const id = profileId.trim();
  if (!id) {
    return {
      status: "blocked",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message: "Run profile is required.",
    };
  }

  try {
    return await executeRunProfileCommand(id);
  } catch (e) {
    if (e instanceof RunProfileServiceError) {
      return {
        status: "blocked",
        exitCode: null,
        stdoutPreview: "",
        stderrPreview: "",
        message: e.message,
      };
    }
    throw e;
  }
}

export async function importRunProfilesFromLocalPathAction(
  _prev: RunProfileActionState | undefined,
  formData: FormData,
): Promise<RunProfileActionState> {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId.trim()) {
    return { message: "Project is required" };
  }

  try {
    await importProjectRunProfilesFromLocalFile(projectId.trim());
    revalidatePath(`/projects/${projectId.trim()}`);
    return {
      ok: true,
      message: "Run profiles loaded from local path",
    };
  } catch (e) {
    if (e instanceof RunProfileImportServiceError) {
      return { message: e.message };
    }
    throw e;
  }
}
