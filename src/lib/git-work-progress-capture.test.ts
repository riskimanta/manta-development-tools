import { describe, expect, it, vi } from "vitest";

import {
  buildWorkProgressSummary,
  captureGitWorkProgressSnapshot,
  parseGitStatusShort,
  parseGitStatusShortLine,
} from "@/lib/git-work-progress-capture";

describe("parseGitStatusShortLine", () => {
  it("parses modified working-tree files", () => {
    expect(parseGitStatusShortLine(" M src/app/page.tsx")).toEqual({
      status: "M",
      path: "src/app/page.tsx",
    });
  });

  it("parses untracked files", () => {
    expect(parseGitStatusShortLine("?? RESULT.md")).toEqual({
      status: "??",
      path: "RESULT.md",
    });
  });

  it("parses staged and unstaged changes", () => {
    expect(parseGitStatusShortLine("MM package.json")).toEqual({
      status: "MM",
      path: "package.json",
    });
  });

  it("returns null for empty or branch header lines", () => {
    expect(parseGitStatusShortLine("")).toBeNull();
    expect(parseGitStatusShortLine("## main...origin/main")).toBeNull();
  });
});

describe("parseGitStatusShort", () => {
  it("parses multiple status lines", () => {
    expect(
      parseGitStatusShort([" M src/a.ts", "?? RESULT.md", "", "## ignored"].join("\n")),
    ).toEqual([
      { status: "M", path: "src/a.ts" },
      { status: "??", path: "RESULT.md" },
    ]);
  });
});

describe("buildWorkProgressSummary", () => {
  it("includes branch, commit, and changed file count", () => {
    expect(
      buildWorkProgressSummary({
        branch: "main",
        latestCommitHash: "1a97f41",
        latestCommitMessage: "feat: add run detail page",
        latestCommitAuthor: "Dev",
        latestCommitDate: "2026-06-07T10:00:00+07:00",
        changedFiles: [{ status: "M", path: "RESULT.md" }],
        gitStatusText: " M RESULT.md",
      }),
    ).toBe(
      "main @ 1a97f41: feat: add run detail page (1 changed file)",
    );
  });

  it("describes a clean working tree", () => {
    expect(
      buildWorkProgressSummary({
        branch: "main",
        latestCommitHash: "deeed9f",
        latestCommitMessage: "Merge pull request #12",
        latestCommitAuthor: "Dev",
        latestCommitDate: "2026-06-07T11:00:00+07:00",
        changedFiles: [],
        gitStatusText: "",
      }),
    ).toBe("main @ deeed9f: Merge pull request #12 (clean working tree)");
  });
});

describe("captureGitWorkProgressSnapshot", () => {
  it("captures branch, commit, and status from git commands", async () => {
    const execGit = vi.fn(async (_cwd: string, args: string[]) => {
      if (args.join(" ") === "rev-parse --git-dir") return ".git\n";
      if (args.join(" ") === "rev-parse --abbrev-ref HEAD") return "main\n";
      if (args.join(" ") === "rev-parse --short HEAD") return "1a97f41\n";
      if (args.join(" ") === "log -1 --pretty=format:%s") {
        return "feat: add run detail page";
      }
      if (args.join(" ") === "log -1 --pretty=format:%an") return "Dev User";
      if (args.join(" ") === "log -1 --pretty=format:%cI") {
        return "2026-06-07T10:00:00+07:00";
      }
      if (args.join(" ") === "status --short") return " M RESULT.md\n";
      throw new Error(`unexpected git args: ${args.join(" ")}`);
    });

    const result = await captureGitWorkProgressSnapshot("/Users/dev/mandev", {
      execGit,
      pathExists: () => true,
    });

    expect(result).toEqual({
      ok: true,
      snapshot: {
        branch: "main",
        latestCommitHash: "1a97f41",
        latestCommitMessage: "feat: add run detail page",
        latestCommitAuthor: "Dev User",
        latestCommitDate: "2026-06-07T03:00:00.000Z",
        changedFiles: [{ status: "M", path: "RESULT.md" }],
        gitStatusText: " M RESULT.md",
      },
    });
  });

  it("returns NOT_GIT_REPOSITORY when git dir is missing", async () => {
    const execGit = vi.fn(async (_cwd: string, args: string[]) => {
      if (args.join(" ") === "rev-parse --git-dir") {
        throw Object.assign(new Error("not a git repository"), { code: 128 });
      }
      throw new Error("should not continue");
    });

    const result = await captureGitWorkProgressSnapshot("/Users/dev/app", {
      execGit,
      pathExists: () => true,
    });

    expect(result).toEqual({
      ok: false,
      code: "NOT_GIT_REPOSITORY",
      message: "Local path is not a Git repository",
    });
  });

  it("returns PATH_UNSAFE for missing local path root", async () => {
    const result = await captureGitWorkProgressSnapshot("/missing/path", {
      execGit: vi.fn(),
      pathExists: () => false,
    });

    expect(result).toEqual({
      ok: false,
      code: "PATH_UNSAFE",
      message: "Local path does not exist",
    });
  });
});
