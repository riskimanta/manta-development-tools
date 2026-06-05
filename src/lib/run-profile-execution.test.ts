import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  RUN_PROFILE_OUTPUT_PREVIEW_MAX,
  truncateRunProfileOutputPreview,
  validateRunProfileExecutionTarget,
  isLikelyLongRunningRunProfileCommand,
  executeSavedRunProfileCommand,
  type RunProfileExecutionSpawn,
} from "./run-profile-execution";

type MockSpawn = NonNullable<
  Parameters<typeof executeSavedRunProfileCommand>[1]
>["spawn"];

describe("truncateRunProfileOutputPreview", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncateRunProfileOutputPreview("hello")).toBe("hello");
  });

  it("truncates stdout/stderr preview beyond max length", () => {
    const long = "x".repeat(RUN_PROFILE_OUTPUT_PREVIEW_MAX + 50);
    const result = truncateRunProfileOutputPreview(long);

    expect(result.length).toBeLessThan(long.length);
    expect(result.endsWith("… [truncated]")).toBe(true);
  });
});

describe("validateRunProfileExecutionTarget", () => {
  it("blocks empty command", () => {
    const result = validateRunProfileExecutionTarget({
      command: "   ",
      workingDirectory: "/tmp/project",
      exists: () => true,
      isDirectory: () => true,
    });

    expect(result).toEqual({
      status: "blocked",
      exitCode: null,
      stdoutPreview: "",
      stderrPreview: "",
      message: "Command is empty.",
    });
  });

  it("blocks missing workingDirectory", () => {
    const result = validateRunProfileExecutionTarget({
      command: "pnpm test",
      workingDirectory: null,
      exists: () => true,
      isDirectory: () => true,
    });

    expect(result?.status).toBe("blocked");
    expect(result?.message).toMatch(/working directory/i);
  });

  it("blocks when workingDirectory does not exist", () => {
    const result = validateRunProfileExecutionTarget({
      command: "pnpm test",
      workingDirectory: "/missing/path",
      exists: () => false,
      isDirectory: () => false,
    });

    expect(result?.status).toBe("blocked");
    expect(result?.message).toMatch(/does not exist/i);
  });

  it("blocks when workingDirectory is not a directory", () => {
    const result = validateRunProfileExecutionTarget({
      command: "pnpm test",
      workingDirectory: "/tmp/file.txt",
      exists: () => true,
      isDirectory: () => false,
    });

    expect(result?.status).toBe("blocked");
    expect(result?.message).toMatch(/not a directory/i);
  });

  it("returns null when command and working directory are valid", () => {
    const result = validateRunProfileExecutionTarget({
      command: "pnpm test",
      workingDirectory: "/tmp/project",
      exists: () => true,
      isDirectory: () => true,
    });

    expect(result).toBeNull();
  });
});

describe("isLikelyLongRunningRunProfileCommand", () => {
  it("flags common dev-server commands", () => {
    expect(isLikelyLongRunningRunProfileCommand("pnpm dev")).toBe(true);
    expect(isLikelyLongRunningRunProfileCommand("npm run dev")).toBe(true);
    expect(isLikelyLongRunningRunProfileCommand("docker compose up")).toBe(true);
  });

  it("allows short-running commands", () => {
    expect(isLikelyLongRunningRunProfileCommand("pnpm test")).toBe(false);
    expect(isLikelyLongRunningRunProfileCommand("pnpm build")).toBe(false);
    expect(isLikelyLongRunningRunProfileCommand("docker compose up -d")).toBe(
      false,
    );
  });
});

function createMockChildProcess(options: {
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  delayMs?: number;
  neverExits?: boolean;
}) {
  const child = new EventEmitter() as RunProfileExecutionSpawn & EventEmitter;
  child.stdout = new EventEmitter() as unknown as Readable;
  child.stderr = new EventEmitter() as unknown as Readable;
  child.kill = vi.fn();

  setTimeout(() => {
    if (options.stdout) {
      child.stdout?.emit("data", Buffer.from(options.stdout));
    }
    if (options.stderr) {
      child.stderr?.emit("data", Buffer.from(options.stderr));
    }
    if (!options.neverExits) {
      child.emit("close", options.exitCode ?? 0);
    }
  }, options.delayMs ?? 0);

  return child;
}

describe("executeSavedRunProfileCommand", () => {
  const fsAccess = {
    exists: vi.fn(() => true),
    isDirectory: vi.fn(() => true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fsAccess.exists.mockReturnValue(true);
    fsAccess.isDirectory.mockReturnValue(true);
  });

  it("blocks likely long-running commands before spawn", async () => {
    const spawn = vi.fn() as unknown as MockSpawn;

    const result = await executeSavedRunProfileCommand(
      { command: "pnpm dev", workingDirectory: "/tmp/project" },
      { spawn, fsAccess, timeoutMs: 30 },
    );

    expect(result.status).toBe("blocked");
    expect(result.message).toMatch(/Phase 3/i);
    expect(spawn).not.toHaveBeenCalled();
  });

  it("returns success with stdout/stderr preview for exiting command", async () => {
    const spawn = vi.fn(() =>
      createMockChildProcess({
        exitCode: 0,
        stdout: "tests passed",
        stderr: "",
      }),
    ) as unknown as MockSpawn;

    const result = await executeSavedRunProfileCommand(
      { command: "pnpm test", workingDirectory: "/tmp/project" },
      { spawn, fsAccess, timeoutMs: 500 },
    );

    expect(spawn).toHaveBeenCalledWith("pnpm test", [], {
      cwd: "/tmp/project",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(result).toEqual({
      status: "success",
      exitCode: 0,
      stdoutPreview: "tests passed",
      stderrPreview: "",
      message: "Command finished with exit code 0.",
    });
  });

  it("returns failed status for non-zero exit code", async () => {
    const spawn = vi.fn(() =>
      createMockChildProcess({
        exitCode: 1,
        stdout: "",
        stderr: "error output",
      }),
    ) as unknown as MockSpawn;

    const result = await executeSavedRunProfileCommand(
      { command: "pnpm test", workingDirectory: "/tmp/project" },
      { spawn, fsAccess, timeoutMs: 500 },
    );

    expect(result).toEqual({
      status: "failed",
      exitCode: 1,
      stdoutPreview: "",
      stderrPreview: "error output",
      message: "Command finished with exit code 1.",
    });
  });

  it("kills and reports timed_out when command exceeds timeout", async () => {
    const child = createMockChildProcess({ neverExits: true });
    const spawn = vi.fn(() => child) as unknown as MockSpawn;

    const result = await executeSavedRunProfileCommand(
      { command: "pnpm test", workingDirectory: "/tmp/project" },
      { spawn, fsAccess, timeoutMs: 20 },
    );

    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
    expect(result.status).toBe("timed_out");
    expect(result.message).toMatch(/did not finish within/i);
  });
});
