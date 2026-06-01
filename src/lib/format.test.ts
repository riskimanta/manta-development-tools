import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { featureStatusLabel, formatRelativeTime } from "@/lib/format";

describe("featureStatusLabel", () => {
  it("maps known feature statuses to UI labels", () => {
    expect(featureStatusLabel("draft")).toBe("Draft");
    expect(featureStatusLabel("ready")).toBe("Ready");
    expect(featureStatusLabel("in_progress")).toBe("In progress");
    expect(featureStatusLabel("done")).toBe("Done");
  });

  it("returns unknown status strings unchanged", () => {
    expect(featureStatusLabel("archived")).toBe("archived");
  });
});

describe("formatRelativeTime", () => {
  const fixedNow = new Date("2026-05-31T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function ago(ms: number) {
    return new Date(fixedNow.getTime() - ms);
  }

  it('returns "just now" for dates within the last minute', () => {
    expect(formatRelativeTime(ago(0))).toBe("just now");
    expect(formatRelativeTime(ago(30_000))).toBe("just now");
    expect(formatRelativeTime(ago(59_999))).toBe("just now");
  });

  it("returns minutes ago for dates within the last hour", () => {
    expect(formatRelativeTime(ago(60_000))).toBe("1m ago");
    expect(formatRelativeTime(ago(5 * 60_000))).toBe("5m ago");
    expect(formatRelativeTime(ago(59 * 60_000))).toBe("59m ago");
  });

  it("returns hours ago for dates within the last day", () => {
    expect(formatRelativeTime(ago(60 * 60_000))).toBe("1h ago");
    expect(formatRelativeTime(ago(3 * 60 * 60_000))).toBe("3h ago");
    expect(formatRelativeTime(ago(23 * 60 * 60_000))).toBe("23h ago");
  });

  it("returns days ago for dates within the last week", () => {
    expect(formatRelativeTime(ago(24 * 60 * 60_000))).toBe("1d ago");
    expect(formatRelativeTime(ago(3 * 24 * 60 * 60_000))).toBe("3d ago");
    expect(formatRelativeTime(ago(6 * 24 * 60 * 60_000))).toBe("6d ago");
  });

  it("returns a formatted date for dates a week or older", () => {
    const date = ago(7 * 24 * 60 * 60_000);
    const expected = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(formatRelativeTime(date)).toBe(expected);
  });

  it("returns a formatted date for much older dates", () => {
    const date = new Date("2024-01-15T12:00:00.000Z");
    const expected = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(formatRelativeTime(date)).toBe(expected);
  });
});
