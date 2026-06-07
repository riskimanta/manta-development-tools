import { describe, expect, it } from "vitest";

import type { RunProfileRunRecord } from "@/lib/run-profile-run-history-types";

import {
  formatDurationMs,
  formatRunProfileRunDuration,
  formatRunProfileRunExitSummary,
  formatRunProfileRunPid,
  formatRunProfileRunTimestamp,
  isRunProfileRunInProgress,
  runProfileRunStatusLabel,
} from "./run-profile-run-history-ui";

const baseRun: RunProfileRunRecord = {
  id: "run-1",
  runProfileId: "rp-1",
  status: "exited",
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  pid: 4242,
  startedAt: "2026-01-01T00:00:00.000Z",
  endedAt: "2026-01-01T00:01:30.000Z",
  exitCode: 0,
  signal: null,
  durationMs: 90_000,
  stdoutPreview: "ready",
  stderrPreview: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:01:30.000Z",
};

describe("isRunProfileRunInProgress", () => {
  it("returns true for active managed statuses", () => {
    expect(isRunProfileRunInProgress("starting")).toBe(true);
    expect(isRunProfileRunInProgress("running")).toBe(true);
    expect(isRunProfileRunInProgress("stopping")).toBe(true);
  });

  it("returns false for terminal statuses", () => {
    expect(isRunProfileRunInProgress("exited")).toBe(false);
    expect(isRunProfileRunInProgress("stopped")).toBe(false);
  });
});

describe("runProfileRunStatusLabel", () => {
  it("maps persisted statuses to managed labels", () => {
    expect(runProfileRunStatusLabel("running")).toBe("Running");
    expect(runProfileRunStatusLabel("exited")).toBe("Exited");
  });
});

describe("formatRunProfileRunTimestamp", () => {
  it("returns null for missing values", () => {
    expect(formatRunProfileRunTimestamp(null)).toBeNull();
  });

  it("formats valid ISO timestamps", () => {
    const formatted = formatRunProfileRunTimestamp("2026-01-01T00:00:00.000Z");
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("formatDurationMs", () => {
  it("formats sub-second, second, minute, and hour durations", () => {
    expect(formatDurationMs(250)).toBe("250ms");
    expect(formatDurationMs(5_000)).toBe("5s");
    expect(formatDurationMs(125_000)).toBe("2m 5s");
    expect(formatDurationMs(3_725_000)).toBe("1h 2m");
  });
});

describe("formatRunProfileRunDuration", () => {
  it("shows in progress for open runs", () => {
    expect(
      formatRunProfileRunDuration({
        ...baseRun,
        status: "running",
        endedAt: null,
        durationMs: null,
      }),
    ).toBe("In progress");
  });

  it("formats completed run duration", () => {
    expect(formatRunProfileRunDuration(baseRun)).toBe("1m 30s");
  });
});

describe("formatRunProfileRunExitSummary", () => {
  it("prefers signal over exit code", () => {
    expect(formatRunProfileRunExitSummary(1, "SIGTERM")).toBe("signal SIGTERM");
  });

  it("shows exit code when no signal", () => {
    expect(formatRunProfileRunExitSummary(0, null)).toBe("exit 0");
  });

  it("returns null when neither is set", () => {
    expect(formatRunProfileRunExitSummary(null, null)).toBeNull();
  });
});

describe("formatRunProfileRunPid", () => {
  it("renders pid or placeholder", () => {
    expect(formatRunProfileRunPid(1234)).toBe("1234");
    expect(formatRunProfileRunPid(null)).toBe("—");
  });
});
