import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  MANDEV_RUN_PROFILES_RELATIVE,
  readRunProfilesImportFromLocalPath,
  resolveRunProfilesImportPath,
} from "@/lib/local-run-profiles-import";

describe("resolveRunProfilesImportPath", () => {
  it("resolves .mandev/run-profiles.json under the local path", () => {
    const root = "/tmp/my-project";
    const resolved = resolveRunProfilesImportPath(root);
    expect(resolved).toBe(
      path.resolve(root, MANDEV_RUN_PROFILES_RELATIVE),
    );
  });
});

describe("readRunProfilesImportFromLocalPath", () => {
  const localPath = "/tmp/target-app";
  const importPath = path.resolve(localPath, MANDEV_RUN_PROFILES_RELATIVE);

  const validPayload = {
    profiles: [
      {
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: ".",
        isDefault: true,
      },
    ],
  };

  it("reads and validates .mandev/run-profiles.json", async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify(validPayload));

    const result = await readRunProfilesImportFromLocalPath(localPath, {
      readFile,
    });

    expect(readFile).toHaveBeenCalledWith(importPath);
    expect(result).toEqual({
      ok: true,
      data: {
        profiles: [
          {
            name: "Dev",
            command: "pnpm dev",
            workingDirectory: ".",
            description: null,
            isDefault: true,
          },
        ],
      },
    });
  });

  it("handles missing file gracefully", async () => {
    const readFile = vi.fn().mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const result = await readRunProfilesImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "FILE_MISSING",
      message:
        "Could not find .mandev/run-profiles.json at the configured local path. Create the file in your target project first, then try again.",
    });
  });

  it("returns friendly error for invalid JSON", async () => {
    const readFile = vi.fn().mockResolvedValue("{ not-json");

    const result = await readRunProfilesImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "JSON_INVALID",
      message: "Run profiles import file is not valid JSON",
    });
  });

  it("returns validation error when profiles array is empty", async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ profiles: [] }));

    const result = await readRunProfilesImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      message: expect.any(String),
    });
  });
});
