import { z } from "zod";

export const architectureUpsertSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  summary: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === "") return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.null(), z.string().max(5000)]),
  ),
  mermaidSource: z
    .string()
    .min(1, "Mermaid source is required")
    .max(50000)
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Mermaid source is required"),
});

export type ArchitectureUpsertInput = z.infer<typeof architectureUpsertSchema>;
