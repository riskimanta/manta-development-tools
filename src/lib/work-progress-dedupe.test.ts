import { describe, expect, it } from "vitest";

import { isSameWorkProgressSnapshot } from "@/lib/work-progress-dedupe";

const baseState = {
  branch: "main",
  latestCommitHash: "abc1234",
  gitStatusText: " M RESULT.md",
  changedFilesJson: JSON.stringify([{ status: "M", path: "RESULT.md" }]),
};

describe("isSameWorkProgressSnapshot", () => {
  it("returns false when latest entry is missing", () => {
    expect(isSameWorkProgressSnapshot(baseState, null)).toBe(false);
  });

  it("returns true when branch, commit, status, and changed files match", () => {
    expect(isSameWorkProgressSnapshot(baseState, { ...baseState })).toBe(true);
  });

  it("returns false when git status changed", () => {
    expect(
      isSameWorkProgressSnapshot(baseState, {
        ...baseState,
        gitStatusText: "?? temp.txt",
        changedFilesJson: JSON.stringify([
          { status: "??", path: "temp.txt" },
        ]),
      }),
    ).toBe(false);
  });

  it("returns false when commit changed", () => {
    expect(
      isSameWorkProgressSnapshot(baseState, {
        ...baseState,
        latestCommitHash: "def5678",
      }),
    ).toBe(false);
  });

  it("returns false when branch changed", () => {
    expect(
      isSameWorkProgressSnapshot(baseState, {
        ...baseState,
        branch: "feat/other",
      }),
    ).toBe(false);
  });
});
