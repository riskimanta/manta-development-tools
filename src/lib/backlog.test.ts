import { describe, expect, it } from "vitest";

import {
  buildBacklogListHref,
  FEATURE_PRIORITY_MEDIUM,
  getBacklogEmptyStateCopy,
  groupOtherBacklogByProject,
  isMandevProjectSlug,
  priorityBandToWhere,
  splitBacklogByMandev,
} from "@/lib/backlog";

describe("buildBacklogListHref", () => {
  it("returns /backlog with no params", () => {
    expect(buildBacklogListHref()).toBe("/backlog");
  });

  it("preserves status, projectId, and priority query params", () => {
    expect(
      buildBacklogListHref({
        status: "ready",
        projectId: "p1",
        priority: "medium",
      }),
    ).toBe("/backlog?status=ready&projectId=p1&priority=medium");
  });
});

describe("priorityBandToWhere", () => {
  it("maps medium band to 34–66", () => {
    expect(priorityBandToWhere("medium")).toEqual({ gte: 34, lte: 66 });
  });

  it("maps unset band to null priority", () => {
    expect(priorityBandToWhere("unset")).toEqual({ equals: null });
  });
});

describe("isMandevProjectSlug", () => {
  it("matches mandev slug only", () => {
    expect(isMandevProjectSlug("mandev")).toBe(true);
    expect(isMandevProjectSlug("ManDev")).toBe(false);
  });
});

describe("splitBacklogByMandev", () => {
  it("splits features by project slug", () => {
    const features = [
      {
        id: "1",
        project: { id: "a", name: "ManDev", slug: "mandev" },
      },
      {
        id: "2",
        project: { id: "b", name: "Client", slug: "client-app" },
      },
    ];
    expect(splitBacklogByMandev(features)).toEqual({
      mandev: [features[0]],
      other: [features[1]],
    });
  });
});

describe("groupOtherBacklogByProject", () => {
  it("groups non-mandev rows by project and sorts by name", () => {
    const features = [
      {
        id: "1",
        project: { id: "b", name: "Zeta", slug: "zeta" },
      },
      {
        id: "2",
        project: { id: "a", name: "Alpha", slug: "alpha" },
      },
      {
        id: "3",
        project: { id: "a", name: "Alpha", slug: "alpha" },
      },
    ];
    const grouped = groupOtherBacklogByProject(features);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.project.slug).toBe("alpha");
    expect(grouped[0]?.items).toHaveLength(2);
    expect(grouped[1]?.project.slug).toBe("zeta");
  });
});

describe("getBacklogEmptyStateCopy", () => {
  it("returns default backlog empty copy", () => {
    const copy = getBacklogEmptyStateCopy();
    expect(copy.title).toBe("No backlog items yet");
    expect(copy.actions.some((a) => a.href === "/features/new")).toBe(true);
  });
});

describe("FEATURE_PRIORITY_MEDIUM", () => {
  it("falls in the medium priority band", () => {
    const where = priorityBandToWhere("medium");
    expect(FEATURE_PRIORITY_MEDIUM).toBeGreaterThanOrEqual(where.gte ?? 0);
    expect(FEATURE_PRIORITY_MEDIUM).toBeLessThanOrEqual(where.lte ?? 100);
  });
});
