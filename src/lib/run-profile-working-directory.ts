import path from "node:path";

export function resolveImportedRunProfileWorkingDirectory(
  workingDirectory: string | null | undefined,
  projectLocalPath: string | null | undefined,
): string | null {
  const localPath = projectLocalPath?.trim();
  const trimmed = workingDirectory?.trim();

  if (!trimmed) {
    return localPath || null;
  }

  if (trimmed === ".") {
    return localPath || null;
  }

  if (path.isAbsolute(trimmed)) {
    return trimmed;
  }

  if (localPath) {
    return path.resolve(localPath, trimmed);
  }

  return trimmed;
}
