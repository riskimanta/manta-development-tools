import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export type WorkProgressChangedFile = {
  status: string;
  path: string;
};

export type GitWorkProgressSnapshot = {
  branch: string;
  latestCommitHash: string;
  latestCommitMessage: string;
  latestCommitAuthor: string;
  latestCommitDate: string;
  changedFiles: WorkProgressChangedFile[];
  gitStatusText: string;
};

export type GitWorkProgressCaptureErrorCode =
  | "PATH_UNSAFE"
  | "NOT_GIT_REPOSITORY"
  | "GIT_COMMAND_FAILED";

export type CaptureGitWorkProgressResult =
  | { ok: true; snapshot: GitWorkProgressSnapshot }
  | {
      ok: false;
      code: GitWorkProgressCaptureErrorCode;
      message: string;
    };

export type GitExecFn = (cwd: string, args: string[]) => Promise<string>;

type CaptureDeps = {
  execGit: GitExecFn;
  pathExists: (targetPath: string) => boolean;
};

const execFileAsync = promisify(execFile);

const defaultExecGit: GitExecFn = async (cwd, args) => {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trimEnd();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message);
  }
};

const defaultPathExists = (targetPath: string): boolean => fs.existsSync(targetPath);

export function parseGitStatusShortLine(
  line: string,
): WorkProgressChangedFile | null {
  const trimmed = line.trimEnd();
  if (!trimmed || trimmed.startsWith("##")) {
    return null;
  }

  if (trimmed.startsWith("?? ")) {
    const filePath = trimmed.slice(3).trim();
    return filePath ? { status: "??", path: filePath } : null;
  }

  if (trimmed.length < 4) {
    return null;
  }

  const status = trimmed.slice(0, 2).trimEnd().replace(/ /g, "") || "?";
  const filePath = trimmed.slice(3);
  return filePath ? { status, path: filePath } : null;
}

export function parseGitStatusShort(
  gitStatusText: string,
): WorkProgressChangedFile[] {
  return gitStatusText
    .split("\n")
    .map(parseGitStatusShortLine)
    .filter((item): item is WorkProgressChangedFile => item !== null);
}

export function buildWorkProgressSummary(
  snapshot: GitWorkProgressSnapshot,
): string {
  const changedFilesCount = snapshot.changedFiles.length;
  const filePart =
    changedFilesCount === 0
      ? "clean working tree"
      : `${changedFilesCount} changed file${changedFilesCount === 1 ? "" : "s"}`;

  return `${snapshot.branch} @ ${snapshot.latestCommitHash}: ${snapshot.latestCommitMessage} (${filePart})`;
}

type GitCommandFailure = {
  ok: false;
  code: GitWorkProgressCaptureErrorCode;
  message: string;
};

async function runGitCommand(
  execGit: GitExecFn,
  cwd: string,
  args: string[],
  options: { preserveLeadingWhitespace?: boolean } = {},
): Promise<{ ok: true; value: string } | GitCommandFailure> {
  try {
    const output = await execGit(cwd, args);
    const value = options.preserveLeadingWhitespace
      ? output.trimEnd()
      : output.trim();
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      code: "GIT_COMMAND_FAILED",
      message: `Git command failed: git ${args.join(" ")}`,
    };
  }
}

export async function captureGitWorkProgressSnapshot(
  localPath: string,
  deps: Partial<CaptureDeps> = {},
): Promise<CaptureGitWorkProgressResult> {
  const trimmedLocalPath = localPath.trim();
  if (!trimmedLocalPath) {
    return {
      ok: false,
      code: "PATH_UNSAFE",
      message: "Local path is not configured",
    };
  }

  const root = path.resolve(trimmedLocalPath);
  const pathExists = deps.pathExists ?? defaultPathExists;
  const execGit = deps.execGit ?? defaultExecGit;

  if (!pathExists(root)) {
    return {
      ok: false,
      code: "PATH_UNSAFE",
      message: "Local path does not exist",
    };
  }

  const gitDirResult = await runGitCommand(execGit, root, [
    "rev-parse",
    "--git-dir",
  ]);
  if (!gitDirResult.ok) {
    if (gitDirResult.code === "GIT_COMMAND_FAILED") {
      return {
        ok: false,
        code: "NOT_GIT_REPOSITORY",
        message: "Local path is not a Git repository",
      };
    }
    return gitDirResult;
  }

  const branchResult = await runGitCommand(execGit, root, [
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  ]);
  if (!branchResult.ok) {
    return branchResult;
  }

  const hashResult = await runGitCommand(execGit, root, [
    "rev-parse",
    "--short",
    "HEAD",
  ]);
  if (!hashResult.ok) {
    return hashResult;
  }

  const messageResult = await runGitCommand(execGit, root, [
    "log",
    "-1",
    "--pretty=format:%s",
  ]);
  if (!messageResult.ok) {
    return messageResult;
  }

  const authorResult = await runGitCommand(execGit, root, [
    "log",
    "-1",
    "--pretty=format:%an",
  ]);
  if (!authorResult.ok) {
    return authorResult;
  }

  const dateResult = await runGitCommand(execGit, root, [
    "log",
    "-1",
    "--pretty=format:%cI",
  ]);
  if (!dateResult.ok) {
    return dateResult;
  }

  const statusResult = await runGitCommand(
    execGit,
    root,
    ["status", "--short"],
    { preserveLeadingWhitespace: true },
  );
  if (!statusResult.ok) {
    return statusResult;
  }

  const parsedDate = new Date(dateResult.value);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      ok: false,
      code: "GIT_COMMAND_FAILED",
      message: "Git returned an invalid commit date",
    };
  }

  const changedFiles = parseGitStatusShort(statusResult.value);

  return {
    ok: true,
    snapshot: {
      branch: branchResult.value,
      latestCommitHash: hashResult.value,
      latestCommitMessage: messageResult.value,
      latestCommitAuthor: authorResult.value,
      latestCommitDate: parsedDate.toISOString(),
      changedFiles,
      gitStatusText: statusResult.value,
    },
  };
}
