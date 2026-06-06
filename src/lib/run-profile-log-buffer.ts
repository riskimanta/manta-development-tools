export const RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS = 64 * 1024;

export type RunProfileLogSnapshot = {
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
};

export type RunProfileLogBufferOptions = {
  maxCharsPerStream?: number;
};

function appendBoundedStream(
  current: string,
  wasTruncated: boolean,
  chunk: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  if (chunk.length === 0) {
    return { text: current, truncated: wasTruncated };
  }

  const combined = current + chunk;
  if (combined.length <= maxChars) {
    return { text: combined, truncated: wasTruncated };
  }

  return {
    text: combined.slice(-maxChars),
    truncated: true,
  };
}

export class RunProfileLogBuffer {
  private readonly maxCharsPerStream: number;
  private stdout = "";
  private stderr = "";
  private stdoutTruncated = false;
  private stderrTruncated = false;

  constructor(options: RunProfileLogBufferOptions = {}) {
    this.maxCharsPerStream =
      options.maxCharsPerStream ?? RUN_PROFILE_LOG_BUFFER_DEFAULT_MAX_CHARS;
  }

  appendStdout(chunk: string): void {
    if (typeof chunk !== "string" || chunk.length === 0) {
      return;
    }

    const next = appendBoundedStream(
      this.stdout,
      this.stdoutTruncated,
      chunk,
      this.maxCharsPerStream,
    );
    this.stdout = next.text;
    this.stdoutTruncated = next.truncated;
  }

  appendStderr(chunk: string): void {
    if (typeof chunk !== "string" || chunk.length === 0) {
      return;
    }

    const next = appendBoundedStream(
      this.stderr,
      this.stderrTruncated,
      chunk,
      this.maxCharsPerStream,
    );
    this.stderr = next.text;
    this.stderrTruncated = next.truncated;
  }

  snapshot(): RunProfileLogSnapshot {
    return {
      stdout: this.stdout,
      stderr: this.stderr,
      stdoutTruncated: this.stdoutTruncated,
      stderrTruncated: this.stderrTruncated,
    };
  }

  clear(): void {
    this.stdout = "";
    this.stderr = "";
    this.stdoutTruncated = false;
    this.stderrTruncated = false;
  }
}
