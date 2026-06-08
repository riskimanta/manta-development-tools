import { describe, expect, it } from "vitest";

import {
  formatSessionDurationMs,
  formatWorkProgressTimestamp,
} from "@/lib/work-progress-session-ui";

describe("formatSessionDurationMs", () => {
  it("formats seconds, minutes, hours, and days", () => {
    expect(formatSessionDurationMs(45_000)).toBe("45s");
    expect(formatSessionDurationMs(5 * 60_000)).toBe("5m");
    expect(formatSessionDurationMs(80 * 60_000)).toBe("1h 20m");
    expect(formatSessionDurationMs(26 * 60 * 60_000)).toBe("1d 2h");
  });
});

describe("formatWorkProgressTimestamp", () => {
  it("formats ISO timestamps", () => {
    const formatted = formatWorkProgressTimestamp("2026-06-08T10:00:00.000Z");
    expect(formatted).toMatch(/Jun|6/);
  });
});
