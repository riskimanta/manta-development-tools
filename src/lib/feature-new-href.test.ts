import { describe, expect, it } from "vitest";

import {
  buildFeatureNewHref,
  resolveDefaultFeatureProjectId,
} from "@/lib/feature-new-href";

describe("buildFeatureNewHref", () => {
  it("returns bare new feature path without params", () => {
    expect(buildFeatureNewHref()).toBe("/features/new");
  });

  it("includes projectId query param when provided", () => {
    expect(buildFeatureNewHref({ projectId: "proj-1" })).toBe(
      "/features/new?projectId=proj-1",
    );
  });
});

describe("resolveDefaultFeatureProjectId", () => {
  const ids = ["proj-a", "proj-b"] as const;

  it("returns undefined when requested id is missing", () => {
    expect(resolveDefaultFeatureProjectId(undefined, ids)).toBeUndefined();
    expect(resolveDefaultFeatureProjectId("", ids)).toBeUndefined();
  });

  it("returns requested id when it exists in project list", () => {
    expect(resolveDefaultFeatureProjectId("proj-b", ids)).toBe("proj-b");
  });

  it("returns undefined for unknown project ids", () => {
    expect(resolveDefaultFeatureProjectId("proj-unknown", ids)).toBeUndefined();
  });
});
