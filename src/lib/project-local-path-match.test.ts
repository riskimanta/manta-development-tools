import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  findBestMatchingProject,
  isCwdWithinLocalPath,
  resolvePathForMatch,
  type ProjectLocalPathCandidate,
} from "@/lib/project-local-path-match";

const identityRealpath = (targetPath: string) => path.resolve(targetPath);

const projects: ProjectLocalPathCandidate[] = [
  {
    id: "proj-parent",
    name: "Parent",
    slug: "parent",
    localPath: "/workspace/parent",
  },
  {
    id: "proj-child",
    name: "Child",
    slug: "child",
    localPath: "/workspace/parent/child",
  },
  {
    id: "proj-other",
    name: "Other",
    slug: "other",
    localPath: "/workspace/other",
  },
];

describe("resolvePathForMatch", () => {
  it("normalizes relative paths against the current directory", () => {
    const resolved = resolvePathForMatch("./src", identityRealpath);
    expect(resolved).toBe(path.resolve("./src"));
  });

  it("returns empty string for blank input", () => {
    expect(resolvePathForMatch("   ", identityRealpath)).toBe("");
  });
});

describe("isCwdWithinLocalPath", () => {
  it("matches exact paths", () => {
    expect(
      isCwdWithinLocalPath("/workspace/parent", "/workspace/parent"),
    ).toBe(true);
  });

  it("matches cwd inside project localPath", () => {
    expect(
      isCwdWithinLocalPath(
        "/workspace/parent/child/src",
        "/workspace/parent/child",
      ),
    ).toBe(true);
  });

  it("rejects unrelated paths that only share a prefix", () => {
    expect(
      isCwdWithinLocalPath(
        "/workspace/parent-extra",
        "/workspace/parent",
      ),
    ).toBe(false);
  });
});

describe("findBestMatchingProject", () => {
  it("returns exact path match", () => {
    const match = findBestMatchingProject(
      "/workspace/other",
      projects,
      identityRealpath,
    );

    expect(match?.id).toBe("proj-other");
  });

  it("returns match when cwd is inside registered localPath", () => {
    const match = findBestMatchingProject(
      "/workspace/parent/child/src",
      projects,
      identityRealpath,
    );

    expect(match?.id).toBe("proj-child");
  });

  it("chooses the longest matching localPath when multiple projects match", () => {
    const match = findBestMatchingProject(
      "/workspace/parent/child",
      projects,
      identityRealpath,
    );

    expect(match?.id).toBe("proj-child");
  });

  it("returns null for unrelated cwd", () => {
    const match = findBestMatchingProject(
      "/tmp/unregistered",
      projects,
      identityRealpath,
    );

    expect(match).toBeNull();
  });
});
