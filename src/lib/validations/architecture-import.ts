import { z } from "zod";

const detailSectionSchema = z.object({
  title: z
    .string()
    .min(1, "Section title is required")
    .max(200)
    .transform((v) => v.trim()),
  content: z
    .string()
    .min(1, "Section content is required")
    .max(5000)
    .transform((v) => v.trim()),
});

export const architectureImportFileSchema = z
  .object({
    summary: z
      .string()
      .max(5000)
      .optional()
      .transform((v) => (v === undefined ? undefined : v.trim())),
    mermaidSource: z
      .string()
      .min(1, "Mermaid source is required")
      .max(50000)
      .transform((v) => v.trim())
      .refine((v) => v.length > 0, "Mermaid source is required"),
    notes: z
      .string()
      .max(10000)
      .optional()
      .transform((v) => (v === undefined ? undefined : v.trim())),
    detailSections: z.array(detailSectionSchema).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    const hasNotes = Boolean(data.notes?.length);
    const hasSections = Boolean(data.detailSections?.length);
    if (!hasNotes && !hasSections) {
      return;
    }
    const merged = buildImportedSummary(data);
    if (!merged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Summary is required when notes or detail sections are provided",
        path: ["summary"],
      });
    } else if (merged.length > 5000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Combined summary exceeds maximum length (5000 characters)",
        path: ["summary"],
      });
    }
  });

export type ArchitectureImportFile = z.infer<typeof architectureImportFileSchema>;

export type NormalizedArchitectureImport = {
  summary: string | null;
  mermaidSource: string;
};

export function buildImportedSummary(
  data: Pick<
    ArchitectureImportFile,
    "summary" | "notes" | "detailSections"
  >,
): string | null {
  const parts: string[] = [];

  if (data.summary?.length) {
    parts.push(data.summary);
  }

  if (data.notes?.length) {
    parts.push(`## Notes\n\n${data.notes}`);
  }

  if (data.detailSections?.length) {
    for (const section of data.detailSections) {
      parts.push(`## ${section.title}\n\n${section.content}`);
    }
  }

  const merged = parts.join("\n\n").trim();
  return merged.length > 0 ? merged : null;
}

export function normalizeArchitectureImport(
  data: ArchitectureImportFile,
): NormalizedArchitectureImport {
  return {
    summary: buildImportedSummary(data),
    mermaidSource: data.mermaidSource,
  };
}
