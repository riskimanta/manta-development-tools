import { describe, expect, it } from "vitest";

import {
  formatSessionDurationMs,
  formatWorkProgressCleanDirtyLabel,
  formatWorkProgressSessionTitle,
  formatWorkProgressTimestamp,
  WORK_PROGRESS_DERIVED_SESSION_NOTICE,
  WORK_PROGRESS_NO_CAPTURE_YET_LABEL,
  WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_HINT,
  WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_LABEL,
  WORK_PROGRESS_SESSION_LIST_SUMMARY_LABEL,
  WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_HINT,
  WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_LABEL,
  WORK_PROGRESS_TERMINAL_TOKEN_HINT,
  WORK_PROGRESS_USAGE_GUIDE_STEPS,
  WORK_PROGRESS_USAGE_GUIDE_TITLE,
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
    expect(WORK_PROGRESS_SESSION_LIST_NO_SUMMARY_HINT).toContain(
      "session detail",
    );
    expect(WORK_PROGRESS_NO_CAPTURE_YET_LABEL).toBe(
      "No work progress captured yet.",
    );
  });
});

describe("work progress UX copy helpers", () => {
  it("exposes usage guide title and steps", () => {
    expect(WORK_PROGRESS_USAGE_GUIDE_TITLE).toBe("How to use Work Progress");
    expect(WORK_PROGRESS_USAGE_GUIDE_STEPS).toHaveLength(4);
    expect(WORK_PROGRESS_USAGE_GUIDE_STEPS[0]).toContain("Project Detail");
  });

  it("exposes derived session notice and filter empty-state copy", () => {
    expect(WORK_PROGRESS_DERIVED_SESSION_NOTICE).toContain("derived");
    expect(WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_LABEL).toContain("filters");
    expect(WORK_PROGRESS_SESSIONS_FILTER_NO_MATCH_HINT).toContain(
      "Clear filters",
    );
  });

  it("exposes terminal helper copy without token values", () => {
    expect(WORK_PROGRESS_TERMINAL_TOKEN_HINT).toContain("MANDEV_AGENT_TOKEN");
    expect(WORK_PROGRESS_TERMINAL_TOKEN_HINT).not.toMatch(/sk-|Bearer /);
  });
});

describe("formatWorkProgressCleanDirtyLabel", () => {
  it("formats clean and dirty working tree labels", () => {
    expect(formatWorkProgressCleanDirtyLabel(true)).toBe("Clean working tree");
    expect(formatWorkProgressCleanDirtyLabel(false)).toBe(
      "Dirty working tree",
    );
  });
});

describe("formatWorkProgressTimestamp", () => {
  it("formats ISO timestamps", () => {
    const formatted = formatWorkProgressTimestamp("2026-06-08T10:00:00.000Z");
    expect(formatted).toMatch(/Jun|6/);
  });
});
