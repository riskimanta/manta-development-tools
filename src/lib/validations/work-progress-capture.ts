import { z } from "zod";

export const workProgressCaptureRequestSchema = z.object({
  cwd: z.string().trim().min(1, "Current working directory is required"),
  note: z.string().trim().min(1).optional(),
});

export type WorkProgressCaptureRequest = z.infer<
  typeof workProgressCaptureRequestSchema
>;
