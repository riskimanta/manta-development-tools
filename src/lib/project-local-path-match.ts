import fs from "node:fs";
import path from "node:path";

export type ProjectLocalPathCandidate = {
  id: string;
  name: string;
  slug: string;
  localPath: string;
};

type RealpathFn = (targetPath: string) => string;

const defaultRealpath: RealpathFn = (targetPath) => {
  try {
    return fs.realpathSync.native
      ? fs.realpathSync.native(targetPath)
      : fs.realpathSync(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
};

export function resolvePathForMatch(
  inputPath: string,
  realpathFn: RealpathFn = defaultRealpath,
): string {
  const trimmed = inputPath.trim();
  if (!trimmed) {
    return "";
  }

  return realpathFn(path.resolve(trimmed));
}

export function isCwdWithinLocalPath(
  normalizedCwd: string,
  normalizedLocalPath: string,
): boolean {
  if (!normalizedCwd || !normalizedLocalPath) {
    return false;
  }

  if (normalizedCwd === normalizedLocalPath) {
    return true;
  }

  const prefix = normalizedLocalPath.endsWith(path.sep)
    ? normalizedLocalPath
    : `${normalizedLocalPath}${path.sep}`;

  return normalizedCwd.startsWith(prefix);
}

export function findBestMatchingProject(
  cwd: string,
  projects: ProjectLocalPathCandidate[],
  realpathFn: RealpathFn = defaultRealpath,
): ProjectLocalPathCandidate | null {
  const normalizedCwd = resolvePathForMatch(cwd, realpathFn);
  if (!normalizedCwd) {
    return null;
  }

  const matches = projects
    .filter((project) => project.localPath.trim())
    .map((project) => ({
      project,
      normalizedLocalPath: resolvePathForMatch(project.localPath, realpathFn),
    }))
    .filter(({ normalizedLocalPath }) =>
      isCwdWithinLocalPath(normalizedCwd, normalizedLocalPath),
    )
    .sort(
      (left, right) =>
        right.normalizedLocalPath.length - left.normalizedLocalPath.length,
    );

  return matches[0]?.project ?? null;
}
