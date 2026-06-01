"use server";

import { revalidatePath } from "next/cache";

import { architectureUpsertSchema } from "@/lib/validations/architecture";
import {
  ArchitectureImportServiceError,
  importProjectArchitectureFromLocalFile,
  upsertProjectArchitecture,
} from "@/services/architectures";

export type ArchitectureActionState = {
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

export async function saveProjectArchitecture(
  _prev: ArchitectureActionState | undefined,
  formData: FormData,
): Promise<ArchitectureActionState> {
  const raw = {
    projectId: formData.get("projectId"),
    summary: formData.get("summary"),
    mermaidSource: formData.get("mermaidSource"),
  };

  const parsed = architectureUpsertSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { projectId } = parsed.data;

  await upsertProjectArchitecture(parsed.data);
  revalidatePath(`/projects/${projectId}`);

  return { ok: true, message: "Architecture diagram saved" };
}

export async function importProjectArchitectureFromLocalFileAction(
  _prev: ArchitectureActionState | undefined,
  formData: FormData,
): Promise<ArchitectureActionState> {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId.trim()) {
    return { message: "Project is required" };
  }

  try {
    await importProjectArchitectureFromLocalFile(projectId.trim());
    revalidatePath(`/projects/${projectId.trim()}`);
    return {
      ok: true,
      message: "Architecture loaded from local path",
    };
  } catch (e) {
    if (e instanceof ArchitectureImportServiceError) {
      return { message: e.message };
    }
    throw e;
  }
}
