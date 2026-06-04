import { describe, expect, it } from "vitest";

import {
  buildRunProfileCdCommandCopy,
  buildRunProfileCommandCopy,
} from "@/lib/run-profile-copy";

describe("buildRunProfileCommandCopy", () => {
  it("returns trimmed command", () => {
    expect(
      buildRunProfileCommandCopy({
        command: "  pnpm dev  ",
        workingDirectory: "/app",
      }),
    ).toBe("pnpm dev");
  });
});

describe("buildRunProfileCdCommandCopy", () => {
  it("builds cd and command when working directory is set", () => {
    expect(
      buildRunProfileCdCommandCopy({
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
      }),
    ).toEqual({
      text: 'cd "/Users/dev/app" && pnpm dev',
      hasWorkingDirectory: true,
    });
  });

  it("returns command only when working directory is missing", () => {
    expect(
      buildRunProfileCdCommandCopy({
        command: "pnpm dev",
        workingDirectory: null,
      }),
    ).toEqual({
      text: "pnpm dev",
      hasWorkingDirectory: false,
    });
  });

  it("treats blank working directory as missing", () => {
    expect(
      buildRunProfileCdCommandCopy({
        command: "docker compose up",
        workingDirectory: "   ",
      }),
    ).toEqual({
      text: "docker compose up",
      hasWorkingDirectory: false,
    });
  });
});
