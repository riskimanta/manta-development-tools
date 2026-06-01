import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  MANDEV_ARCHITECTURE_RELATIVE,
  readArchitectureImportFromLocalPath,
  resolveArchitectureImportPath,
} from "@/lib/local-architecture-import";

describe("resolveArchitectureImportPath", () => {
  it("resolves .mandev/architecture.json under the local path", () => {
    const root = "/tmp/my-project";
    const resolved = resolveArchitectureImportPath(root);
    expect(resolved).toBe(
      path.resolve(root, MANDEV_ARCHITECTURE_RELATIVE),
    );
  });

  it("always targets .mandev/architecture.json under the resolved root", () => {
    const resolved = resolveArchitectureImportPath(
      "/tmp/project/../../../etc",
    );
    expect(resolved.endsWith(path.join(".mandev", "architecture.json"))).toBe(
      true,
    );
  });
});

describe("readArchitectureImportFromLocalPath", () => {
  const localPath = "/tmp/target-app";
  const importPath = path.resolve(localPath, MANDEV_ARCHITECTURE_RELATIVE);

  const validPayload = {
    summary: "Imported overview",
    mermaidSource: "flowchart TD\n  User --> UI",
    notes: "From Cursor audit",
  };

  it("reads and validates .mandev/architecture.json", async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify(validPayload));

    const result = await readArchitectureImportFromLocalPath(localPath, {
      readFile,
    });

    expect(readFile).toHaveBeenCalledWith(importPath);
    expect(result).toEqual({
      ok: true,
      data: {
        summary: expect.stringContaining("Imported overview"),
        mermaidSource: "flowchart TD\n  User --> UI",
      },
    });
  });

  it("handles missing file gracefully", async () => {
    const readFile = vi.fn().mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const result = await readArchitectureImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "FILE_MISSING",
      message:
        "Could not find `.mandev/architecture.json` at the configured local path. Create the file in your target project first, then try again.",
    });
  });

  it("returns friendly error for invalid JSON", async () => {
    const readFile = vi.fn().mockResolvedValue("{ not-json");

    const result = await readArchitectureImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "JSON_INVALID",
      message: "Architecture import file is not valid JSON",
    });
  });

  it("returns validation error when mermaidSource is missing", async () => {
    const readFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ summary: "Only summary" }));

    const result = await readArchitectureImportFromLocalPath(localPath, {
      readFile,
    });

    expect(result).toEqual({
      ok: false,
      code: "VALIDATION_FAILED",
      message: expect.any(String),
    });
  });

  it("only reads the fixed architecture import path", async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify(validPayload));

    await readArchitectureImportFromLocalPath(localPath, { readFile });

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0]?.[0]).toBe(importPath);
    expect(readFile.mock.calls[0]?.[0]).not.toContain(".env");
  });
});
