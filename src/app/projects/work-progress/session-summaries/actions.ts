"use server";

import { revalidatePath } from "next/cache";

import type { WorkProgressSessionSummaryActionState } from "@/lib/work-progress-session-summary-action-types";
import { workProgressSessionSummarySaveSchema } from "@/lib/validations/work-progress-session-summary";
import {
  upsertWorkProgressSessionSummary,
  WorkProgressSessionSummaryServiceError,
} from "@/services/work-progress-session-summaries";

function flattenZodErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  const fieldErrors = error.flatten().fieldErrors;
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (value?.length) {
      out[key] = value;
    }
  }
  return out;
}

export async function saveWorkProgressSessionSummaryAction(
  _prev: WorkProgressSessionSummaryActionState | undefined,
  formData: FormData,
): Promise<WorkProgressSessionSummaryActionState> {
  const raw = {
    projectId: formData.get("projectId"),
    sessionId: formData.get("sessionId"),
    summaryMarkdown: formData.get("summaryMarkdown"),
  };

  const parsed = workProgressSessionSummarySaveSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { projectId, sessionId } = parsed.data;

  try {
    await upsertWorkProgressSessionSummary(parsed.data);
    revalidatePath(
      `/projects/${projectId}/work-progress/sessions/${sessionId}`,
    );
    return { ok: true, message: "AI summary saved" };
  } catch (error) {
    if (error instanceof WorkProgressSessionSummaryServiceError) {
      return { message: error.message };
    }
    throw error;
  }
}
