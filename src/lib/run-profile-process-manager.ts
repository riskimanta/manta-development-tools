import { spawn as nodeSpawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { randomUUID } from "node:crypto";

import {
  RunProfileLogBuffer,
  type RunProfileLogBufferOptions,
  type RunProfileLogSnapshot,
} from "./run-profile-log-buffer";

export const RUN_PROFILE_PROCESS_STOP_GRACE_MS = 5_000;

/** Changes when the Node.js server process reloads (e.g. dev restart). */
export const RUN_PROFILE_PROCESS_MANAGER_BOOT_SESSION_ID = randomUUID();

export function getRunProfileProcessManagerBootSessionId(): string {
  return RUN_PROFILE_PROCESS_MANAGER_BOOT_SESSION_ID;
}

export type RunProfileManagedProcessStatus =
  | "idle"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "failed"
  | "exited";

export type RunProfileManagedProcessSnapshot = {
  runProfileId: string;
  status: RunProfileManagedProcessStatus;
  pid: number | null;
  command: string;
  workingDirectory: string;
  startedAt: string | null;
  stoppedAt: string | null;
  exitedAt: string | null;
  exitCode: number | null;
  signal: string | null;
  message: string;
  logs: RunProfileLogSnapshot;
};

type RunProfileProcessStartInput = {
  runProfileId: string;
  command: string;
  workingDirectory: string;
};

export type RunProfileManagedProcessLifecycleEvent = {
  type: "spawn" | "error" | "close";
  snapshot: RunProfileManagedProcessSnapshot;
};

export type RunProfileManagedProcessLifecycleHandler = (
  event: RunProfileManagedProcessLifecycleEvent,
) => void | Promise<void>;

export function isManagedProcessStartAccepted(
  snapshot: RunProfileManagedProcessSnapshot,
): boolean {
  return !snapshot.message.startsWith("Process is already");
}

type ManagedProcessEntry = {
  runProfileId: string;
  command: string;
  workingDirectory: string;
  status: RunProfileManagedProcessStatus;
  pid: number | null;
  child: ChildProcess | null;
  logs: RunProfileLogBuffer;
  startedAt: Date | null;
  stoppedAt: Date | null;
  exitedAt: Date | null;
  exitCode: number | null;
  signal: string | null;
  message: string;
  userStopRequested: boolean;
  stopGraceTimer: ReturnType<typeof setTimeout> | null;
};

export type RunProfileProcessManagerOptions = {
  spawn?: typeof nodeSpawn;
  stopGraceMs?: number;
  logBufferOptions?: RunProfileLogBufferOptions;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
  platform?: string;
  processKill?: (pid: number, signal?: NodeJS.Signals | number) => boolean;
  lifecycleHandler?: RunProfileManagedProcessLifecycleHandler;
};

function isWindowsPlatform(platform: string): boolean {
  return platform === "win32";
}

function buildManagedProcessSpawnOptions(
  workingDirectory: string,
  platform: string,
): SpawnOptions {
  return {
    cwd: workingDirectory,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    ...(isWindowsPlatform(platform) ? {} : { detached: true }),
  };
}

const ACTIVE_STATUSES: RunProfileManagedProcessStatus[] = [
  "starting",
  "running",
  "stopping",
];

function isActiveStatus(status: RunProfileManagedProcessStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

function toSnapshot(entry: ManagedProcessEntry): RunProfileManagedProcessSnapshot {
  return {
    runProfileId: entry.runProfileId,
    status: entry.status,
    pid: entry.pid,
    command: entry.command,
    workingDirectory: entry.workingDirectory,
    startedAt: entry.startedAt?.toISOString() ?? null,
    stoppedAt: entry.stoppedAt?.toISOString() ?? null,
    exitedAt: entry.exitedAt?.toISOString() ?? null,
    exitCode: entry.exitCode,
    signal: entry.signal,
    message: entry.message,
    logs: entry.logs.snapshot(),
  };
}

export class RunProfileProcessManager {
  private readonly spawnFn: typeof nodeSpawn;
  private readonly stopGraceMs: number;
  private readonly logBufferOptions: RunProfileLogBufferOptions;
  private readonly setTimeoutFn: typeof setTimeout;
  private readonly clearTimeoutFn: typeof clearTimeout;
  private readonly platform: string;
  private readonly processKillFn: (
    pid: number,
    signal?: NodeJS.Signals | number,
  ) => boolean;
  private readonly useProcessGroups: boolean;
  private readonly registry = new Map<string, ManagedProcessEntry>();
  private lifecycleHandler?: RunProfileManagedProcessLifecycleHandler;

  constructor(options: RunProfileProcessManagerOptions = {}) {
    this.spawnFn = options.spawn ?? nodeSpawn;
    this.stopGraceMs =
      options.stopGraceMs ?? RUN_PROFILE_PROCESS_STOP_GRACE_MS;
    this.logBufferOptions = options.logBufferOptions ?? {};
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
    this.platform = options.platform ?? process.platform;
    this.processKillFn =
      options.processKill ??
      ((pid, signal) => process.kill(pid, signal));
    this.useProcessGroups = !isWindowsPlatform(this.platform);
    this.lifecycleHandler = options.lifecycleHandler;
  }

  setLifecycleHandler(
    handler: RunProfileManagedProcessLifecycleHandler | undefined,
  ): void {
    this.lifecycleHandler = handler;
  }

  private emitLifecycle(
    type: RunProfileManagedProcessLifecycleEvent["type"],
    entry: ManagedProcessEntry,
  ): void {
    const handler = this.lifecycleHandler;
    if (!handler) {
      return;
    }

    try {
      const result = handler({
        type,
        snapshot: toSnapshot(entry),
      });

      if (result instanceof Promise) {
        result.catch((error: unknown) => {
          console.error(
            `[run-profile-process-manager] lifecycle handler failed (${type}):`,
            error,
          );
        });
      }
    } catch (error) {
      console.error(
        `[run-profile-process-manager] lifecycle handler failed (${type}):`,
        error,
      );
    }
  }

  start(input: RunProfileProcessStartInput): RunProfileManagedProcessSnapshot {
    const existing = this.registry.get(input.runProfileId);
    if (existing && isActiveStatus(existing.status)) {
      return {
        ...toSnapshot(existing),
        message: `Process is already ${existing.status} for this run profile.`,
      };
    }

    if (existing) {
      this.disposeChild(existing);
      this.registry.delete(input.runProfileId);
    }

    const entry: ManagedProcessEntry = {
      runProfileId: input.runProfileId,
      command: input.command,
      workingDirectory: input.workingDirectory,
      status: "starting",
      pid: null,
      child: null,
      logs: new RunProfileLogBuffer(this.logBufferOptions),
      startedAt: new Date(),
      stoppedAt: null,
      exitedAt: null,
      exitCode: null,
      signal: null,
      message: "Process is starting.",
      userStopRequested: false,
      stopGraceTimer: null,
    };

    this.registry.set(input.runProfileId, entry);

    const child = this.spawnFn(
      input.command,
      [],
      buildManagedProcessSpawnOptions(input.workingDirectory, this.platform),
    );

    entry.child = child;
    this.attachChildListeners(entry, child);

    return toSnapshot(entry);
  }

  stop(runProfileId: string): RunProfileManagedProcessSnapshot | null {
    const entry = this.registry.get(runProfileId);
    if (!entry) {
      return null;
    }

    if (!isActiveStatus(entry.status)) {
      return toSnapshot(entry);
    }

    entry.userStopRequested = true;
    entry.status = "stopping";
    entry.stoppedAt = new Date();
    entry.message = "Stop requested; sending SIGTERM.";

    this.sendStopSignal(entry);

    return toSnapshot(entry);
  }

  restart(input: RunProfileProcessStartInput): RunProfileManagedProcessSnapshot {
    const existing = this.registry.get(input.runProfileId);
    if (existing && isActiveStatus(existing.status)) {
      this.forceStopForRestart(existing);
      this.registry.delete(input.runProfileId);
    } else if (existing) {
      this.registry.delete(input.runProfileId);
    }

    return this.start(input);
  }

  getSnapshot(
    runProfileId: string,
  ): RunProfileManagedProcessSnapshot | null {
    const entry = this.registry.get(runProfileId);
    return entry ? toSnapshot(entry) : null;
  }

  listSnapshots(): RunProfileManagedProcessSnapshot[] {
    return [...this.registry.values()].map(toSnapshot);
  }

  clear(runProfileId: string): void {
    const entry = this.registry.get(runProfileId);
    if (!entry) {
      return;
    }

    this.disposeChild(entry);
    this.registry.delete(runProfileId);
  }

  private attachChildListeners(
    entry: ManagedProcessEntry,
    child: ChildProcess,
  ): void {
    child.stdout?.on("data", (chunk: Buffer) => {
      entry.logs.appendStdout(chunk.toString());
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      entry.logs.appendStderr(chunk.toString());
    });

    child.on("spawn", () => {
      if (entry.status === "starting") {
        entry.status = "running";
        entry.pid = child.pid ?? null;
        entry.message = "Process is running.";
        this.emitLifecycle("spawn", entry);
      }
    });

    child.on("error", (error) => {
      this.clearStopGraceTimer(entry);
      entry.status = "failed";
      entry.child = null;
      entry.exitedAt = new Date();
      entry.message = `Failed to start command: ${error.message}`;
      entry.logs.appendStderr(error.message);
      this.emitLifecycle("error", entry);
    });

    child.on("close", (code, signal) => {
      this.clearStopGraceTimer(entry);
      entry.child = null;
      entry.exitCode = code;
      entry.signal = signal ?? null;
      entry.exitedAt = new Date();

      if (entry.userStopRequested || entry.status === "stopping") {
        entry.status = "stopped";
        entry.message = "Process stopped.";
        this.emitLifecycle("close", entry);
        return;
      }

      if (code === 0) {
        entry.status = "exited";
        entry.message = "Process exited with code 0.";
        this.emitLifecycle("close", entry);
        return;
      }

      entry.status = "failed";
      entry.message = `Process exited with code ${code ?? "unknown"}.`;
      this.emitLifecycle("close", entry);
    });
  }

  private killChildProcess(
    child: ChildProcess,
    signal: NodeJS.Signals,
  ): void {
    if (child.killed) {
      return;
    }

    const pid = child.pid;
    if (pid == null) {
      child.kill(signal);
      return;
    }

    if (this.useProcessGroups) {
      try {
        this.processKillFn(-pid, signal);
        return;
      } catch {
        // Process group kill failed; fall back to the direct child.
      }
    }

    child.kill(signal);
  }

  private sendStopSignal(entry: ManagedProcessEntry): void {
    const child = entry.child;
    if (!child || child.killed) {
      return;
    }

    this.killChildProcess(child, "SIGTERM");

    this.clearStopGraceTimer(entry);
    entry.stopGraceTimer = this.setTimeoutFn(() => {
      entry.stopGraceTimer = null;
      if (entry.child && !entry.child.killed) {
        this.killChildProcess(entry.child, "SIGKILL");
      }
    }, this.stopGraceMs);
  }

  private forceStopForRestart(entry: ManagedProcessEntry): void {
    this.clearStopGraceTimer(entry);
    entry.userStopRequested = true;
    entry.status = "stopped";
    entry.stoppedAt = entry.stoppedAt ?? new Date();
    entry.exitedAt = new Date();
    entry.message = "Process stopped.";

    const child = entry.child;
    if (child && !child.killed) {
      child.removeAllListeners();
      child.stdout?.removeAllListeners();
      child.stderr?.removeAllListeners();
      this.killChildProcess(child, "SIGTERM");
    }

    entry.child = null;
    this.emitLifecycle("close", entry);
  }

  private disposeChild(entry: ManagedProcessEntry): void {
    this.clearStopGraceTimer(entry);

    const child = entry.child;
    if (child && !child.killed) {
      child.removeAllListeners();
      child.stdout?.removeAllListeners();
      child.stderr?.removeAllListeners();
      this.killChildProcess(child, "SIGTERM");
    }

    entry.child = null;
  }

  private clearStopGraceTimer(entry: ManagedProcessEntry): void {
    if (entry.stopGraceTimer) {
      this.clearTimeoutFn(entry.stopGraceTimer);
      entry.stopGraceTimer = null;
    }
  }
}

export const runProfileProcessManager = new RunProfileProcessManager();
