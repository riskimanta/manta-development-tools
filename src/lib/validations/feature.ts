import { z } from "zod";

export const featureStatuses = [
  "draft",
  "ready",
  "in_progress",
  "done",
] as const;

export const featureCreateSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Title is required").max(300),
  description: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === "") return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.null(), z.string().max(10000)]),
  ),
  status: z.enum(featureStatuses),
  priority: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.union([z.null(), z.coerce.number().int().min(0).max(100)]).optional(),
  ),
});

export const featureUpdateSchema = featureCreateSchema.extend({
  id: z.string().min(1),
});

export type FeatureCreateInput = z.infer<typeof featureCreateSchema>;
export type FeatureUpdateInput = z.infer<typeof featureUpdateSchema>;
