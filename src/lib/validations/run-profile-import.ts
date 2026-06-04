import { z } from "zod";

const optionalImportText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    })
    .pipe(z.union([z.null(), z.string().max(max)]));

const runProfileImportEntrySchema = z.object({
  name: z
    .string()
    .min(1, "Profile name is required")
    .max(200)
    .transform((v) => v.trim()),
  command: z
    .string()
    .min(1, "Profile command is required")
    .max(4000)
    .transform((v) => v.trim()),
  workingDirectory: optionalImportText(2000),
  description: optionalImportText(5000),
  isDefault: z.boolean().optional().default(false),
});

export const runProfilesImportFileSchema = z
  .object({
    profiles: z
      .array(runProfileImportEntrySchema)
      .min(1, "At least one profile is required"),
  })
  .superRefine((data, ctx) => {
    const defaultCount = data.profiles.filter((p) => p.isDefault).length;
    if (defaultCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Only one profile may have isDefault: true in the import file",
        path: ["profiles"],
      });
    }
  });

export type RunProfilesImportFile = z.infer<typeof runProfilesImportFileSchema>;

export type NormalizedRunProfileImportEntry = {
  name: string;
  command: string;
  workingDirectory: string | null;
  description: string | null;
  isDefault: boolean;
};

export type NormalizedRunProfilesImport = {
  profiles: NormalizedRunProfileImportEntry[];
};

export function normalizeRunProfilesImport(
  data: RunProfilesImportFile,
): NormalizedRunProfilesImport {
  return {
    profiles: data.profiles.map((p) => ({
      name: p.name,
      command: p.command,
      workingDirectory: p.workingDirectory,
      description: p.description,
      isDefault: p.isDefault ?? false,
    })),
  };
}
