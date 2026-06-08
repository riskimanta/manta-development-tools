import { z } from "zod";

export const WORK_PROGRESS_SESSION_SUMMARY_MAX_LENGTH = 20_000;

export const workProgressSessionSummarySaveSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  sessionId: z.string().min(1, "Session is required"),
  summaryMarkdown: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Summary is required")
        .max(
          WORK_PROGRESS_SESSION_SUMMARY_MAX_LENGTH,
          `Summary must be at most ${WORK_PROGRESS_SESSION_SUMMARY_MAX_LENGTH.toLocaleString()} characters`,
        ),
    ),
});

export type WorkProgressSessionSummarySaveInput = z.infer<
  typeof workProgressSessionSummarySaveSchema
>;
