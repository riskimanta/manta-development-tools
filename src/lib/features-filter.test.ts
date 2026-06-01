import { describe, expect, it } from "vitest";

import {
  buildFeaturesListHref,
  getFeatureEmptyStateCopy,
} from "./features-filter";

describe("buildFeaturesListHref", () => {
  it("returns base path with no filters", () => {
    expect(buildFeaturesListHref()).toBe("/features");
    expect(buildFeaturesListHref({})).toBe("/features");
  });

  it("includes status only", () => {
    expect(buildFeaturesListHref({ status: "draft" })).toBe(
      "/features?status=draft",
    );
  });

  it("includes projectId only", () => {
    expect(buildFeaturesListHref({ projectId: "proj-1" })).toBe(
      "/features?projectId=proj-1",
    );
  });

  it("preserves both status and projectId", () => {
    expect(
      buildFeaturesListHref({ status: "in_progress", projectId: "proj-2" }),
    ).toBe("/features?status=in_progress&projectId=proj-2");
  });
});

describe("getFeatureEmptyStateCopy", () => {
  it("returns create CTA when no filters are active", () => {
    const copy = getFeatureEmptyStateCopy();
    expect(copy.title).toBe("No features yet");
    expect(copy.actions).toEqual([
      { label: "New feature", href: "/features/new" },
    ]);
  });

  it("returns clear status action when only status is filtered", () => {
    const copy = getFeatureEmptyStateCopy({
      status: "draft",
      statusLabel: "Draft",
    });
    expect(copy.title).toBe("No Draft features");
    expect(copy.actions).toEqual([
      {
        label: "Clear status filter",
        href: "/features",
        variant: "outline",
      },
    ]);
  });

  it("returns project create and clear actions when only project is filtered", () => {
    const copy = getFeatureEmptyStateCopy({
      projectId: "proj-1",
      projectName: "ManDev",
    });
    expect(copy.title).toBe("No features in ManDev");
    expect(copy.actions).toEqual([
      {
        label: "New feature",
        href: "/features/new?projectId=proj-1",
      },
      {
        label: "Clear project filter",
        href: "/features",
        variant: "outline",
      },
    ]);
  });

  it("returns clear filters and project-scoped create when both filters are active", () => {
    const copy = getFeatureEmptyStateCopy({
      status: "ready",
      statusLabel: "Ready",
      projectId: "proj-2",
      projectName: "API",
    });
    expect(copy.title).toBe("No matching features");
    expect(copy.description).toContain("Ready");
    expect(copy.description).toContain("API");
    expect(copy.actions).toEqual([
      { label: "Clear filters", href: "/features", variant: "outline" },
      {
        label: "New feature",
        href: "/features/new?projectId=proj-2",
      },
    ]);
  });

  it("falls back to generic project label when name is missing", () => {
    const copy = getFeatureEmptyStateCopy({ projectId: "proj-x" });
    expect(copy.title).toBe("No features in this project");
  });
});
