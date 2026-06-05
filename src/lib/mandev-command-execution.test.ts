import { afterEach, describe, expect, it } from "vitest";

import {
  MANDEV_ENABLE_COMMAND_EXECUTION_ENV,
  isCommandExecutionEnabled,
} from "./mandev-command-execution";

describe("isCommandExecutionEnabled", () => {
  const original = process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV];
    } else {
      process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV] = original;
    }
  });

  it("returns true only when env is exactly true", () => {
    process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV] = "true";
    expect(isCommandExecutionEnabled()).toBe(true);
  });

  it("returns false when env is unset", () => {
    delete process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV];
    expect(isCommandExecutionEnabled()).toBe(false);
  });

  it("returns false for other truthy-looking values", () => {
    process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV] = "TRUE";
    expect(isCommandExecutionEnabled()).toBe(false);

    process.env[MANDEV_ENABLE_COMMAND_EXECUTION_ENV] = "1";
    expect(isCommandExecutionEnabled()).toBe(false);
  });
});
