import { describe, expect, it } from "vitest";

import { parseMandevArgv } from "./mandev.mjs";

describe("parseMandevArgv", () => {
  it("parses track command with defaults", () => {
    const options = parseMandevArgv(["track"]);

    expect(options.command).toBe("track");
    expect(options.baseUrl).toBe("http://localhost:3000");
    expect(options.json).toBe(false);
    expect(options.help).toBe(false);
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
