import { describe, expect, it } from "vitest";

import { resolveImportedRunProfileWorkingDirectory } from "@/lib/run-profile-working-directory";

describe("resolveImportedRunProfileWorkingDirectory", () => {
  it('maps "." to project local path', () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(".", "/Users/dev/app"),
    ).toBe("/Users/dev/app");
  });

  it("resolves relative paths against project local path", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory("apps/web", "/Users/dev/app"),
    ).toBe("/Users/dev/app/apps/web");
  });

  it("keeps absolute paths as-is", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(
        "/opt/run",
        "/Users/dev/app",
      ),
    ).toBe("/opt/run");
  });

  it("falls back to local path when working directory is missing", () => {
    expect(
      resolveImportedRunProfileWorkingDirectory(null, "/Users/dev/app"),
    ).toBe("/Users/dev/app");
  });
});
