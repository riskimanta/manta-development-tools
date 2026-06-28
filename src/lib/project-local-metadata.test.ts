import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  detectProjectMetadataFromLocalPath,
  generateSlugFromName,
  humanizeFolderName,
  MANDEV_PROJECT_RELATIVE,
  normalizeRepositoryUrl,
  resolveMandevProjectJsonPath,
} from "@/lib/project-local-metadata";

describe("generateSlugFromName", () => {
  it("normalizes spaces and underscores to hyphens", () => {
    expect(generateSlugFromName("Manta Development Tools")).toBe(
      "manta-development-tools",
    );
    expect(generateSlugFromName("my_app_name")).toBe("my-app-name");
  });

  it("removes unsafe characters and collapses hyphens", () => {
    expect(generateSlugFromName("  Hello--World!!  ")).toBe("hello-world");
    expect(generateSlugFromName("@scope/my-package")).toBe("scope-my-package");
  });
});

describe("humanizeFolderName", () => {
  it("turns hyphenated folder names into title case", () => {
    expect(humanizeFolderName("manta-development-tools")).toBe(
      "Manta Development Tools",
    );
  });
});

describe("normalizeRepositoryUrl", () => {
  it("normalizes ssh and https git remotes", () => {
    expect(
      normalizeRepositoryUrl("git@github.com:riskimanta/manta-development-tools.git"),
    ).toBe("https://github.com/riskimanta/manta-development-tools");
    expect(
      normalizeRepositoryUrl(
        "https://github.com/riskimanta/manta-development-tools.git",
      ),
    ).toBe("https://github.com/riskimanta/manta-development-tools");
  });

  it("strips git+ prefix from package.json repository values", () => {
    expect(
      normalizeRepositoryUrl(
        "git+https://github.com/example/repo.git",
      ),
    ).toBe("https://github.com/example/repo");
  });
});

function missingFileError(): NodeJS.ErrnoException {
  return Object.assign(new Error("missing"), { code: "ENOENT" });
}

function mockReadFileForPaths(
  files: Record<string, string>,
): (filePath: string) => Promise<string> {
  return vi.fn(async (filePath: string) => {
    if (filePath in files) {
      return files[filePath];
    }
    throw missingFileError();
  }) as (filePath: string) => Promise<string>;
}

describe("detectProjectMetadataFromLocalPath", () => {
  const localPath = "/Users/dev/manta-development-tools";
  const root = path.resolve(localPath);
  const mandevProjectPath = resolveMandevProjectJsonPath(root);
  const packageJsonPath = path.resolve(root, "package.json");

  it("returns an error when the local path does not exist", async () => {
    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => false,
      readFile: vi.fn(),
      execGit: vi.fn(),
    });

    expect(result).toEqual({
      ok: false,
      message: "Local path does not exist.",
    });
  });

  it("reads metadata from package.json and git remote", async () => {
    const readFile = mockReadFileForPaths({
      [packageJsonPath]: JSON.stringify({
        name: "manta-development-tools",
        description: "Local-first project tracker",
        repository: {
          type: "git",
          url: "git+https://github.com/riskimanta/manta-development-tools.git",
        },
      }),
    });
    const execGit = vi.fn();

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(readFile).toHaveBeenCalledWith(mandevProjectPath);
    expect(readFile).toHaveBeenCalledWith(packageJsonPath);
    expect(execGit).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      name: "manta-development-tools",
      slug: "manta-development-tools",
      description: "Local-first project tracker",
      repositoryUrl: "https://github.com/riskimanta/manta-development-tools",
      localPath: root,
      warnings: [],
    });
  });

  it("prefers .mandev/project.json over package.json", async () => {
    const readFile = mockReadFileForPaths({
      [mandevProjectPath]: JSON.stringify({
        name: "ManDev Project",
        slug: "mandev-project",
        description: "From ManDev metadata",
        repositoryUrl: "https://github.com/example/mandev-project",
        notes: "Next.js app with Prisma",
      }),
      [packageJsonPath]: JSON.stringify({
        name: "package-json-name",
        description: "From package.json",
        repository: {
          type: "git",
          url: "git+https://github.com/example/package-json.git",
        },
      }),
    });
    const execGit = vi.fn();

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(execGit).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      name: "ManDev Project",
      slug: "mandev-project",
      description: "From ManDev metadata",
      repositoryUrl: "https://github.com/example/mandev-project",
      localPath: root,
      warnings: ["ManDev notes: Next.js app with Prisma"],
    });
  });

  it("warns and falls back when .mandev/project.json is invalid", async () => {
    const readFile = mockReadFileForPaths({
      [mandevProjectPath]: "{ not valid json",
      [packageJsonPath]: JSON.stringify({
        name: "fallback-name",
        description: "Fallback description",
      }),
    });
    const execGit = vi.fn();

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(result).toEqual({
      ok: true,
      name: "fallback-name",
      slug: "fallback-name",
      description: "Fallback description",
      repositoryUrl: undefined,
      localPath: root,
      warnings: [
        ".mandev/project.json could not be parsed, falling back to other sources.",
        "Unable to read git remote.",
      ],
    });
  });

  it("keeps existing behavior when .mandev/project.json is missing", async () => {
    const readFile = mockReadFileForPaths({
      [packageJsonPath]: JSON.stringify({
        name: "manta-development-tools",
        description: "Local-first project tracker",
      }),
    });
    const execGit = vi
      .fn()
      .mockResolvedValue("git@github.com:riskimanta/manta-development-tools.git");

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(result).toEqual({
      ok: true,
      name: "manta-development-tools",
      slug: "manta-development-tools",
      description: "Local-first project tracker",
      repositoryUrl: "https://github.com/riskimanta/manta-development-tools",
      localPath: root,
      warnings: [],
    });
    expect(execGit).toHaveBeenCalledWith(root, ["remote", "get-url", "origin"]);
  });

  it("falls back to folder name when package.json is missing", async () => {
    const readFile = vi.fn().mockRejectedValue(missingFileError());
    const execGit = vi
      .fn()
      .mockResolvedValue("git@github.com:riskimanta/manta-development-tools.git");

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(result).toEqual({
      ok: true,
      name: "Manta Development Tools",
      slug: "manta-development-tools",
      description: undefined,
      repositoryUrl: "https://github.com/riskimanta/manta-development-tools",
      localPath: root,
      warnings: ["package.json was not found, using folder name only."],
    });
    expect(execGit).toHaveBeenCalledWith(root, ["remote", "get-url", "origin"]);
  });

  it("warns when git remote cannot be read", async () => {
    const readFile = vi.fn().mockRejectedValue(missingFileError());
    const execGit = vi.fn().mockRejectedValue(new Error("not a git repo"));

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.repositoryUrl).toBeUndefined();
      expect(result.warnings).toEqual([
        "package.json was not found, using folder name only.",
        "Unable to read git remote.",
      ]);
    }
  });

  it("normalizes slug and repository URL from .mandev/project.json", async () => {
    const readFile = mockReadFileForPaths({
      [mandevProjectPath]: JSON.stringify({
        name: "Example Project",
        slug: "Example_Project",
        repositoryUrl: "git@github.com:example/example-project.git",
      }),
    });

    const result = await detectProjectMetadataFromLocalPath(localPath, {
      pathExists: () => true,
      readFile,
      execGit: vi.fn(),
    });

    expect(result).toEqual({
      ok: true,
      name: "Example Project",
      slug: "example-project",
      description: undefined,
      repositoryUrl: "https://github.com/example/example-project",
      localPath: root,
      warnings: ["package.json was not found, using folder name only."],
    });
  });
});

describe("MANDEV_PROJECT_RELATIVE", () => {
  it("points to .mandev/project.json", () => {
    expect(MANDEV_PROJECT_RELATIVE).toBe(
      path.join(".mandev", "project.json"),
    );
  });
});
