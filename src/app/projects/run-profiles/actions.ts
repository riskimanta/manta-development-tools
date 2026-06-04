"use server";

import { revalidatePath } from "next/cache";

import {
  runProfileCreateSchema,
  runProfileUpdateSchema,
} from "@/lib/validations/run-profile";
import { getProjectById } from "@/services/projects";
import {
  createRunProfileRecord,
  deleteRunProfileRecord,
  importProjectRunProfilesFromLocalFile,
  RunProfileImportServiceError,
  RunProfileServiceError,
  updateRunProfileRecord,
} from "@/services/run-profiles";

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
