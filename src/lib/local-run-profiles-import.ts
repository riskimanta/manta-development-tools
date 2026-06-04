import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  normalizeRunProfilesImport,
  runProfilesImportFileSchema,
  type NormalizedRunProfilesImport,
} from "@/lib/validations/run-profile-import";

export const MANDEV_RUN_PROFILES_RELATIVE = path.join(
  ".mandev",
  "run-profiles.json",
);

export type RunProfilesImportErrorCode =
  | "PATH_UNSAFE"
  | "FILE_MISSING"
  | "JSON_INVALID"
  | "VALIDATION_FAILED";

export type ReadRunProfilesImportResult =
  | { ok: true; data: NormalizedRunProfilesImport }
  | { ok: false; code: RunProfilesImportErrorCode; message: string };

export type ReadFileFn = (filePath: string) => Promise<string>;

export function resolveRunProfilesImportPath(localPath: string): string {
  const root = path.resolve(localPath);
  const filePath = path.resolve(root, MANDEV_RUN_PROFILES_RELATIVE);
  const relative = path.relative(root, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("PATH_UNSAFE");
  }

  return filePath;
}

function formatValidationMessage(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): string {
  const fieldErrors = error.flatten().fieldErrors;
  const firstKey = Object.keys(fieldErrors)[0];
  const firstMessages = firstKey ? fieldErrors[firstKey] : undefined;
  if (firstMessages?.[0]) {
    return firstMessages[0];
  }
  return "Run profiles import file failed validation";
}

const defaultReadFile: ReadFileFn = (filePath) =>
  readFile(filePath, "utf8");

export async function readRunProfilesImportFromLocalPath(
  localPath: string,
  deps: { readFile: ReadFileFn } = { readFile: defaultReadFile },
): Promise<ReadRunProfilesImportResult> {
  let filePath: string;
  try {
    filePath = resolveRunProfilesImportPath(localPath);
  } catch {
    return {
      ok: false,
      code: "PATH_UNSAFE",
      message: "Local path is not valid for run profiles import",
    };
  }

  let raw: string;
  try {
    raw = await deps.readFile(filePath);
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined;
    if (code === "ENOENT") {
      return {
        ok: false,
        code: "FILE_MISSING",
        message:
          "Could not find .mandev/run-profiles.json at the configured local path. Create the file in your target project first, then try again.",
      };
    }
    throw err;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      code: "JSON_INVALID",
      message: "Run profiles import file is not valid JSON",
    };
  }

  const validated = runProfilesImportFileSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      code: "VALIDATION_FAILED",
      message: formatValidationMessage(validated.error),
    };
  }

  return { ok: true, data: normalizeRunProfilesImport(validated.data) };
}
