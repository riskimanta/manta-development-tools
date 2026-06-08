"use server";

import { revalidatePath } from "next/cache";

import {
  captureWorkProgressSnapshot,
  WorkProgressServiceError,
} from "@/services/work-progress";

export type WorkProgressActionState = {
  ok?: boolean;
  message?: string;
};

export async function captureWorkProgressAction(
  _prev: WorkProgressActionState | undefined,
  formData: FormData,
): Promise<WorkProgressActionState> {
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId.trim()) {
    return { message: "Project is required" };
  }

  const noteValue = formData.get("note");
  const note =
    typeof noteValue === "string" && noteValue.trim() ? noteValue : null;

  try {
    const entry = await captureWorkProgressSnapshot(projectId.trim(), note);
    revalidatePath(`/projects/${projectId.trim()}`);
    return {
      ok: true,
      message: `Captured progress on ${entry.branch} @ ${entry.latestCommitHash}`,
    };
  } catch (error) {
    if (error instanceof WorkProgressServiceError) {
      return { message: error.message };
    }
    throw error;
  }
}
