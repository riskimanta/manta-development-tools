import { describe, expect, it } from "vitest";

import {
  formatSessionDurationMs,
  formatWorkProgressSessionTitle,
  formatWorkProgressTimestamp,
  WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL,
  WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL,
} from "@/lib/work-progress-session-ui";

describe("formatSessionDurationMs", () => {
  it("formats seconds, minutes, hours, and days", () => {
    expect(formatSessionDurationMs(45_000)).toBe("45s");
    expect(formatSessionDurationMs(5 * 60_000)).toBe("5m");
    expect(formatSessionDurationMs(80 * 60_000)).toBe("1h 20m");
    expect(formatSessionDurationMs(26 * 60 * 60_000)).toBe("1d 2h");
  });
});

describe("formatWorkProgressSessionTitle", () => {
  it("formats branch-based session title", () => {
    expect(formatWorkProgressSessionTitle("main")).toBe("Work session on main");
    expect(formatWorkProgressSessionTitle(null)).toBe("Work session");
  });
});

describe("work progress session list summary labels", () => {
  it("exposes display labels for saved and missing summaries", () => {
    expect(WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL).toBe("AI Summary");
    expect(WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL).toBe(
      "No saved AI summary yet.",
    );
  });
});

describe("formatWorkProgressTimestamp", () => {
  it("formats ISO timestamps", () => {
    const formatted = formatWorkProgressTimestamp("2026-06-08T10:00:00.000Z");
    expect(formatted).toMatch(/Jun|6/);
  });
});
