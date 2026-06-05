import { describe, expect, it } from "vitest";

import {
  buildRunProfileCdCommandCopy,
  buildRunProfileCommandCopy,
  getRunProfileCopyPreview,
  RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT,
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

describe("getRunProfileCopyPreview", () => {
  it("returns command-only and cd+command previews from the same helpers", () => {
    expect(
      getRunProfileCopyPreview({
        command: "  pnpm dev  ",
        workingDirectory: "/Users/dev/app",
      }),
    ).toEqual({
      commandOnly: "pnpm dev",
      cdCommand: {
        text: 'cd "/Users/dev/app" && pnpm dev',
        hasWorkingDirectory: true,
      },
    });
  });

  it("exposes the no-working-directory hint constant for UI copy", () => {
    expect(RUN_PROFILE_NO_WORKING_DIRECTORY_COPY_HINT).toBe(
      "No working directory set. Copy cd + command will copy the command only.",
    );

    expect(
      getRunProfileCopyPreview({
        command: "pnpm dev",
        workingDirectory: null,
      }).cdCommand,
    ).toEqual({
      text: "pnpm dev",
      hasWorkingDirectory: false,
    });
  });
});
