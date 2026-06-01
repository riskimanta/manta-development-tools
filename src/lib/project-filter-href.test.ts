import { describe, expect, it } from "vitest";

import { buildProjectFilterListHref } from "@/lib/project-filter-href";

describe("buildProjectFilterListHref", () => {
  it("builds /features href without priority param", () => {
    expect(
      buildProjectFilterListHref("features", {
        status: "ready",
        projectId: "p1",
        priority: "medium",
      }),
    ).toBe("/features?status=ready&projectId=p1");
  });

  it("builds /backlog href with priority param", () => {
    expect(
      buildProjectFilterListHref("backlog", {
        status: "draft",
        projectId: "p1",
        priority: "medium",
      }),
    ).toBe("/backlog?status=draft&projectId=p1&priority=medium");
  });

  it("returns bare paths when no filters", () => {
    expect(buildProjectFilterListHref("features")).toBe("/features");
    expect(buildProjectFilterListHref("backlog")).toBe("/backlog");
  });
});
