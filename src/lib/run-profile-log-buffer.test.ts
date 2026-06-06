import { describe, expect, it } from "vitest";

import {
  RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS,
  RunProfileLogBuffer,
} from "./run-profile-log-buffer";

describe("RunProfileLogBuffer", () => {
  it("returns empty snapshot for a new buffer", () => {
    const buffer = new RunProfileLogBuffer();

    expect(buffer.snapshot()).toEqual({
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
    });
  });

  it("appends stdout", () => {
    const buffer = new RunProfileLogBuffer();
    buffer.appendStdout("hello stdout");

    expect(buffer.snapshot().stdout).toBe("hello stdout");
    expect(buffer.snapshot().stderr).toBe("");
    expect(buffer.snapshot().stdoutTruncated).toBe(false);
  });

  it("appends stderr", () => {
    const buffer = new RunProfileLogBuffer();
    buffer.appendStderr("hello stderr");

    expect(buffer.snapshot().stderr).toBe("hello stderr");
    expect(buffer.snapshot().stdout).toBe("");
    expect(buffer.snapshot().stderrTruncated).toBe(false);
  });

  it("preserves order across multiple appends on each stream", () => {
    const buffer = new RunProfileLogBuffer();
    buffer.appendStdout("a");
    buffer.appendStdout("b");
    buffer.appendStdout("c");
    buffer.appendStderr("1");
    buffer.appendStderr("2");

    expect(buffer.snapshot().stdout).toBe("abc");
    expect(buffer.snapshot().stderr).toBe("12");
  });

  it("preserves newlines across appends", () => {
    const buffer = new RunProfileLogBuffer();
    buffer.appendStdout("line1\n");
    buffer.appendStdout("line2\n");

    expect(buffer.snapshot().stdout).toBe("line1\nline2\n");
  });

  it("truncates older stdout when over the character limit", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 10 });
    buffer.appendStdout("0123456789");
    expect(buffer.snapshot().stdoutTruncated).toBe(false);

    buffer.appendStdout("abc");

    const snap = buffer.snapshot();
    expect(snap.stdout).toBe("3456789abc");
    expect(snap.stdout.length).toBe(10);
    expect(snap.stdoutTruncated).toBe(true);
    expect(snap.stderrTruncated).toBe(false);
  });

  it("truncates older stderr when over the character limit", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 8 });
    buffer.appendStderr("12345678");
    buffer.appendStderr("zz");

    const snap = buffer.snapshot();
    expect(snap.stderr).toBe("345678zz");
    expect(snap.stderr.length).toBe(8);
    expect(snap.stderrTruncated).toBe(true);
    expect(snap.stdoutTruncated).toBe(false);
  });

  it("trims one huge chunk to the most recent content", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 5 });
    buffer.appendStdout("0123456789");

    const snap = buffer.snapshot();
    expect(snap.stdout).toBe("56789");
    expect(snap.stdout.length).toBe(5);
    expect(snap.stdoutTruncated).toBe(true);
  });

  it("clear resets content and truncation flags", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 4 });
    buffer.appendStdout("12345");
    buffer.appendStderr("67890");

    buffer.clear();

    expect(buffer.snapshot()).toEqual({
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
    });
  });

  it("ignores empty string chunks", () => {
    const buffer = new RunProfileLogBuffer();
    buffer.appendStdout("");
    buffer.appendStderr("");

    expect(buffer.snapshot()).toEqual({
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
    });
  });

  it("ignores non-string chunks", () => {
    const buffer = new RunProfileLogBuffer();
    // @ts-expect-error — runtime guard for malformed callers
    buffer.appendStdout(null);
    // @ts-expect-error — runtime guard for malformed callers
    buffer.appendStderr(undefined);

    expect(buffer.snapshot()).toEqual({
      stdout: "",
      stderr: "",
      stdoutTruncated: false,
      stderrTruncated: false,
    });
  });

  it("uses the default max chars per stream constant", () => {
    expect(RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS).toBe(64 * 1024);

    const buffer = new RunProfileLogBuffer();
    const chunk = "x".repeat(RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS + 100);
    buffer.appendStdout(chunk);

    const snap = buffer.snapshot();
    expect(snap.stdout.length).toBe(RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS);
    expect(snap.stdoutTruncated).toBe(true);
  });

  it("keeps truncation flag true after further appends within limit", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 5 });
    buffer.appendStdout("123456");
    buffer.appendStdout("7");

    expect(buffer.snapshot().stdoutTruncated).toBe(true);
  });

  it("isolates stdout and stderr truncation state", () => {
    const buffer = new RunProfileLogBuffer({ maxCharsPerStream: 4 });
    buffer.appendStdout("12345");
    buffer.appendStderr("ab");

    const snap = buffer.snapshot();
    expect(snap.stdoutTruncated).toBe(true);
    expect(snap.stderrTruncated).toBe(false);
  });
});
