import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === "") return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.null(), z.string().max(max)]),
  );

const booleanFromForm = z.preprocess(
  (v) => v === true || v === "true" || v === "on" || v === "1",
  z.boolean(),
);

export const runProfileCreateSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Name is required").max(200),
  command: z.string().min(1, "Command is required").max(4000),
  workingDirectory: optionalText(2000),
  description: optionalText(5000),
  isDefault: booleanFromForm.default(false),
});

export const runProfileUpdateSchema = runProfileCreateSchema.extend({
  id: z.string().min(1),
});

export type RunProfileCreateInput = z.infer<typeof runProfileCreateSchema>;
export type RunProfileUpdateInput = z.infer<typeof runProfileUpdateSchema>;
