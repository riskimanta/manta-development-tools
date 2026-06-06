import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RunProfileProcessManager,
} from "./run-profile-process-manager";

type MockChild = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  pid: number;
  killed: boolean;
  kill: ReturnType<typeof vi.fn>;
};

function createMockChild(options: {
  pid?: number;
  emitSpawn?: boolean;
  emitSpawnSync?: boolean;
} = {}): MockChild {
  const child = new EventEmitter() as MockChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.pid = options.pid ?? 42_001;
  child.kill = vi.fn((signal?: NodeJS.Signals) => {
    if (signal === "SIGKILL") {
      child.killed = true;
    }
    return true;
  });
  child.killed = false;

  if (options.emitSpawnSync) {
    child.emit("spawn");
  } else if (options.emitSpawn !== false) {
    queueMicrotask(() => {
      child.emit("spawn");
    });
  }

  return child;
}

function emitClose(
  child: MockChild,
  code: number | null,
  signal: NodeJS.Signals | null = null,
) {
  child.emit("close", code, signal);
}

function emitError(child: MockChild, message: string) {
  child.emit("error", new Error(message));
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("RunProfileProcessManager", () => {
  let spawn: ReturnType<typeof vi.fn>;
  let manager: RunProfileProcessManager;

  beforeEach(() => {
    vi.useFakeTimers();
    spawn = vi.fn(() => createMockChild());
    manager = new RunProfileProcessManager({
      spawn: spawn as never,
      stopGraceMs: 100,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const startInput = {
    runProfileId: "profile-1",
    command: "pnpm dev",
    workingDirectory: "/tmp/project",
  };

  function latestChild(): MockChild {
    return spawn.mock.results.at(-1)?.value as MockChild;
  }

  it("start creates a snapshot with starting then running state and pid", async () => {
    const starting = manager.start(startInput);

    expect(starting.runProfileId).toBe("profile-1");
    expect(starting.status).toBe("starting");
    expect(starting.command).toBe("pnpm dev");
    expect(starting.workingDirectory).toBe("/tmp/project");
    expect(starting.startedAt).not.toBeNull();
    expect(spawn).toHaveBeenCalledWith("pnpm dev", [], {
      cwd: "/tmp/project",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    await flushMicrotasks();

    const running = manager.getSnapshot("profile-1");
    expect(running?.status).toBe("running");
    expect(running?.pid).toBe(42_001);
  });

  it("captures stdout chunks in logs", async () => {
    manager.start(startInput);
    const child = latestChild();
    child.stdout.emit("data", Buffer.from("hello "));
    child.stdout.emit("data", Buffer.from("stdout"));

    expect(manager.getSnapshot("profile-1")?.logs.stdout).toBe("hello stdout");
  });

  it("captures stderr chunks in logs", async () => {
    manager.start(startInput);
    const child = latestChild();
    child.stderr.emit("data", Buffer.from("warn: something"));

    expect(manager.getSnapshot("profile-1")?.logs.stderr).toBe(
      "warn: something",
    );
  });

  it("transitions to exited on exit code 0", async () => {
    manager.start(startInput);
    const child = latestChild();
    await flushMicrotasks();
    emitClose(child, 0);

    const snap = manager.getSnapshot("profile-1");
    expect(snap?.status).toBe("exited");
    expect(snap?.exitCode).toBe(0);
    expect(snap?.exitedAt).not.toBeNull();
    expect(snap?.message).toMatch(/with code 0/i);
  });

  it("transitions to failed on non-zero exit code", async () => {
    manager.start(startInput);
    const child = latestChild();
    await flushMicrotasks();
    emitClose(child, 1);

    const snap = manager.getSnapshot("profile-1");
    expect(snap?.status).toBe("failed");
    expect(snap?.exitCode).toBe(1);
    expect(snap?.message).toMatch(/with code 1/i);
  });

  it("transitions to failed on spawn error", async () => {
    spawn.mockImplementationOnce(() => {
      const child = createMockChild({ emitSpawn: false });
      queueMicrotask(() => emitError(child, "spawn failed"));
      return child;
    });

    manager.start(startInput);
    await flushMicrotasks();

    const snap = manager.getSnapshot("profile-1");
    expect(snap?.status).toBe("failed");
    expect(snap?.message).toMatch(/spawn failed/i);
  });

  it("blocks duplicate start while starting or running", async () => {
    const first = manager.start(startInput);
    expect(first.status).toBe("starting");

    const duplicate = manager.start(startInput);
    expect(duplicate.status).toBe("starting");
    expect(duplicate.message).toMatch(/already/i);
    expect(spawn).toHaveBeenCalledTimes(1);

    await flushMicrotasks();

    const duplicateWhileRunning = manager.start(startInput);
    expect(duplicateWhileRunning.status).toBe("running");
    expect(duplicateWhileRunning.message).toMatch(/already/i);
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it("stop sends SIGTERM and ends in stopped after close", async () => {
    manager.start(startInput);
    const child = latestChild();
    await flushMicrotasks();

    const stopping = manager.stop("profile-1");
    expect(stopping).not.toBeNull();
    expect(stopping!.status).toBe("stopping");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");

    emitClose(child, null, "SIGTERM");

    const stopped = manager.getSnapshot("profile-1");
    expect(stopped?.status).toBe("stopped");
    expect(stopped?.stoppedAt).not.toBeNull();
    expect(stopped?.signal).toBe("SIGTERM");
  });

  it("stop escalates to SIGKILL after grace period when process has not exited", async () => {
    manager.start(startInput);
    const child = latestChild();
    await flushMicrotasks();

    manager.stop("profile-1");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");

    vi.advanceTimersByTime(100);

    expect(child.kill).toHaveBeenCalledWith("SIGKILL");
  });

  it("stop returns current snapshot when no process exists", () => {
    expect(manager.stop("missing")).toBeNull();
  });

  it("restart stops an active process and starts a new one with cleared logs", async () => {
    manager.start(startInput);
    const firstChild = latestChild();
    await flushMicrotasks();
    firstChild.stdout.emit("data", Buffer.from("old output"));

    spawn.mockImplementationOnce(() => createMockChild({ pid: 99_002 }));

    const restarted = manager.restart(startInput);
    expect(firstChild.kill).toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(2);
    expect(restarted.status).toBe("starting");
    expect(restarted.logs.stdout).toBe("");
    expect(restarted.logs.stderr).toBe("");

    await flushMicrotasks();

    const snap = manager.getSnapshot("profile-1");
    expect(snap?.pid).toBe(99_002);
    expect(snap?.status).toBe("running");
    expect(snap?.logs.stdout).toBe("");
  });

  it("listSnapshots returns serializable snapshots", async () => {
    manager.start(startInput);
    await flushMicrotasks();

    const snapshots = manager.listSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual(
      expect.objectContaining({
        runProfileId: "profile-1",
        status: "running",
        logs: expect.objectContaining({
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
        }),
      }),
    );

    expect(JSON.parse(JSON.stringify(snapshots[0]))).toEqual(snapshots[0]);
  });

  it("clear removes a process snapshot", async () => {
    manager.start(startInput);
    await flushMicrotasks();

    manager.clear("profile-1");

    expect(manager.getSnapshot("profile-1")).toBeNull();
    expect(manager.listSnapshots()).toEqual([]);
  });

  it("preserves log buffer truncation flags in snapshots", () => {
    const smallBufferManager = new RunProfileProcessManager({
      spawn: spawn as never,
      logBufferOptions: { maxCharsPerStream: 4 },
    });

    smallBufferManager.start(startInput);
    const child = latestChild();
    child.stdout.emit("data", Buffer.from("123456789"));

    const snap = smallBufferManager.getSnapshot("profile-1");
    expect(snap?.logs.stdout).toBe("6789");
    expect(snap?.logs.stdoutTruncated).toBe(true);
  });

  it("allows start after a previous run has exited", async () => {
    manager.start(startInput);
    const child = latestChild();
    await flushMicrotasks();
    emitClose(child, 0);

    spawn.mockImplementationOnce(() => createMockChild({ pid: 55_005 }));

    const second = manager.start(startInput);
    expect(second.status).toBe("starting");
    expect(spawn).toHaveBeenCalledTimes(2);

    await flushMicrotasks();
    expect(manager.getSnapshot("profile-1")?.pid).toBe(55_005);
  });
});

describe("runProfileProcessManager singleton", () => {
  it("exports a shared manager instance", async () => {
    const { runProfileProcessManager } = await import(
      "./run-profile-process-manager"
    );
    expect(runProfileProcessManager).toBeInstanceOf(RunProfileProcessManager);
  });
});
