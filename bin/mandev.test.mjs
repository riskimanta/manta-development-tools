import { describe, expect, it } from "vitest";

import {
  DEFAULT_WATCH_INTERVAL_SECONDS,
  MIN_WATCH_INTERVAL_SECONDS,
  parseMandevArgv,
  parsePositiveInteger,
  resolveWatchIntervalSeconds,
} from "./mandev.mjs";

describe("parseMandevArgv", () => {
  it("parses track command with defaults", () => {
    const options = parseMandevArgv(["track"]);

    expect(options.command).toBe("track");
    expect(options.baseUrl).toBe("http://localhost:3000");
    expect(options.json).toBe(false);
    expect(options.help).toBe(false);
    expect(options.watch).toBe(false);
    expect(options.interval).toBe(DEFAULT_WATCH_INTERVAL_SECONDS);
    expect(options.minInterval).toBe(MIN_WATCH_INTERVAL_SECONDS);
  });

  it("parses cwd and note options", () => {
    const options = parseMandevArgv([
      "track",
      "--cwd",
      "/tmp/project",
      "--note",
      "CLI note",
    ]);

    expect(options.cwd).toBe("/tmp/project");
    expect(options.note).toBe("CLI note");
  });

  it("parses watch and interval options", () => {
    const options = parseMandevArgv([
      "track",
      "--watch",
      "--interval",
      "60",
      "--min-interval",
      "30",
    ]);

    expect(options.watch).toBe(true);
    expect(options.interval).toBe("60");
    expect(options.minInterval).toBe("30");
  });

  it("marks help when requested", () => {
    const options = parseMandevArgv(["track", "--help"]);

    expect(options.help).toBe(true);
  });

  it("returns help for empty argv", () => {
    const options = parseMandevArgv([]);

    expect(options.help).toBe(true);
    expect(options.command).toBeNull();
  });
});

describe("resolveWatchIntervalSeconds", () => {
  it("uses the default interval when not overridden", () => {
    expect(
      resolveWatchIntervalSeconds(
        DEFAULT_WATCH_INTERVAL_SECONDS,
        MIN_WATCH_INTERVAL_SECONDS,
      ),
    ).toEqual({
      intervalSeconds: DEFAULT_WATCH_INTERVAL_SECONDS,
      minIntervalSeconds: MIN_WATCH_INTERVAL_SECONDS,
    });
  });

  it("rejects intervals below the minimum guard", () => {
    expect(() =>
      resolveWatchIntervalSeconds(20, MIN_WATCH_INTERVAL_SECONDS),
    ).toThrow(/at least 30 seconds/);
  });

  it("rejects min interval below the global minimum", () => {
    expect(() => resolveWatchIntervalSeconds(60, 10)).toThrow(
      /at least 30 seconds/,
    );
  });
});

describe("parsePositiveInteger", () => {
  it("parses valid positive integers", () => {
    expect(parsePositiveInteger("60", "Interval")).toBe(60);
  });

  it("rejects invalid values", () => {
    expect(() => parsePositiveInteger("abc", "Interval")).toThrow(
      /positive integer/,
    );
  });
});
