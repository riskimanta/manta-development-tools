import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(128)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens",
  );

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: slugSchema,
  description: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === "") return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.null(), z.string().max(5000)]),
  ),
  repoUrl: z
    .union([z.literal(""), z.string().trim().url().max(2000)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === undefined || v === null ? null : v)),
  localPath: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) =>
      v === undefined || v === null || v.trim() === "" ? null : v.trim(),
    ),
});

export const projectUpdateSchema = projectCreateSchema.extend({
  id: z.string().min(1),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
