import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";

export const RUN_PROFILE_EXECUTION_TIMEOUT_MS = 30_000;
export const RUN_PROFILE_OUTPUT_PREVIEW_MAX = 4_000;

export type RunProfileExecutionStatus =
  | "success"
  | "failed"
  | "blocked"
  | "timed_out"
  | "disabled";

export type RunProfileExecutionResult = {
  status: RunProfileExecutionStatus;
  exitCode: number | null;
  stdoutPreview: string;
  stderrPreview: string;
  message: string;
};

export type RunProfileExecutionSpawn = ChildProcessWithoutNullStreams;

type FsAccess = {
  exists: (path: string) => boolean;
  isDirectory: (path: string) => boolean;
};

type ExecuteDeps = {
  spawn?: typeof nodeSpawn;
  fsAccess?: FsAccess;
  timeoutMs?: number;
};

const LONG_RUNNING_COMMAND_PATTERNS: RegExp[] = [
  /\bpnpm\s+dev\b/i,
  /\bnpm\s+run\s+dev\b/i,
  /\byarn\s+dev\b/i,
  /\bnext\s+dev\b/i,
  /\bnodemon\b/i,
  /\bdocker\s+compose\s+up\b(?!.*\s(-d|--detach)\b)/i,
  /\bspring-boot:run\b/i,
  /\bpnpm\s+start\b/i,
  /\bnpm\s+start\b/i,
  /\bnpm\s+run\s+start\b/i,
  /\bwatch\b/i,
  /\bvite\b(?!\s+build\b)/i,
];

export function truncateRunProfileOutputPreview(text: string): string {
  if (text.length <= RUN_PROFILE_OUTPUT_PREVIEW_MAX) {
    return text;
  }

  const keep = RUN_PROFILE_OUTPUT_PREVIEW_MAX - "… [truncated]".length;
  return `${text.slice(0, Math.max(0, keep))}… [truncated]`;
}

export function isLikelyLongRunningRunProfileCommand(command: string): boolean {
  const trimmed = command.trim();
  return LONG_RUNNING_COMMAND_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function validateRunProfileExecutionTarget(input: {
  command: string;
  workingDirectory: string | null;
  exists: (path: string) => boolean;
  isDirectory: (path: string) => boolean;
}): RunProfileExecutionResult | null {
  const command = input.command.trim();
  if (!command) {
    return blockedResult("Command is empty.");
  }

  const workingDirectory = input.workingDirectory?.trim();
  if (!workingDirectory) {
    return blockedResult(
      "Working directory is required before ManDev can run this profile.",
    );
  }

  if (!input.exists(workingDirectory)) {
    return blockedResult(
      `Working directory does not exist: ${workingDirectory}`,
    );
  }

  if (!input.isDirectory(workingDirectory)) {
    return blockedResult(
      `Working directory is not a directory: ${workingDirectory}`,
    );
  }

  return null;
}

function blockedResult(message: string): RunProfileExecutionResult {
  return {
    status: "blocked",
    exitCode: null,
    stdoutPreview: "",
    stderrPreview: "",
    message,
  };
}

function defaultFsAccess(): FsAccess {
  return {
    exists: (targetPath) => fs.existsSync(targetPath),
    isDirectory: (targetPath) => {
      try {
        return fs.statSync(targetPath).isDirectory();
      } catch {
        return false;
      }
    },
  };
}

export async function executeSavedRunProfileCommand(
  profile: { command: string; workingDirectory: string },
  deps: ExecuteDeps = {},
): Promise<RunProfileExecutionResult> {
  const spawnFn = deps.spawn ?? nodeSpawn;
  const fsAccess = deps.fsAccess ?? defaultFsAccess();
  const timeoutMs = deps.timeoutMs ?? RUN_PROFILE_EXECUTION_TIMEOUT_MS;

  const validation = validateRunProfileExecutionTarget({
    command: profile.command,
    workingDirectory: profile.workingDirectory,
    exists: fsAccess.exists,
    isDirectory: fsAccess.isDirectory,
  });
  if (validation) {
    return validation;
  }

  const command = profile.command.trim();
  const workingDirectory = profile.workingDirectory.trim();

  if (isLikelyLongRunningRunProfileCommand(command)) {
    return blockedResult(
      "This command looks long-running (for example dev servers or docker compose up). Process management is not available until Phase 3 — use copy actions or your terminal instead.",
    );
  }

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const child = spawnFn(command, [], {
      cwd: workingDirectory,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const finish = (result: RunProfileExecutionResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      finish({
        status: "failed",
        exitCode: null,
        stdoutPreview: truncateRunProfileOutputPreview(stdout),
        stderrPreview: truncateRunProfileOutputPreview(
          stderr || error.message,
        ),
        message: `Failed to start command: ${error.message}`,
      });
    });

    child.on("close", (code) => {
      const exitCode = code ?? 1;
      finish({
        status: exitCode === 0 ? "success" : "failed",
        exitCode,
        stdoutPreview: truncateRunProfileOutputPreview(stdout),
        stderrPreview: truncateRunProfileOutputPreview(stderr),
        message: `Command finished with exit code ${exitCode}.`,
      });
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 1_000);

      finish({
        status: "timed_out",
        exitCode: null,
        stdoutPreview: truncateRunProfileOutputPreview(stdout),
        stderrPreview: truncateRunProfileOutputPreview(stderr),
        message: `Command did not finish within ${Math.round(timeoutMs / 1000)} seconds. The process was stopped because Phase 2A only supports short-running commands.`,
      });
    }, timeoutMs);
  });
}
