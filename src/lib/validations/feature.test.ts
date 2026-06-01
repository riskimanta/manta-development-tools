import { describe, expect, it } from "vitest";

import { featureCreateSchema } from "@/lib/validations/feature";

const validFeature = {
  projectId: "proj_123",
  title: "Add Vitest",
  description: "Minimal test foundation",
  status: "draft" as const,
  priority: 10,
};

describe("featureCreateSchema", () => {
  it("accepts valid feature input", () => {
    const result = featureCreateSchema.safeParse(validFeature);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        projectId: "proj_123",
        title: "Add Vitest",
        description: "Minimal test foundation",
        status: "draft",
        priority: 10,
      });
    }
  });

  it("rejects missing title", () => {
    const result = featureCreateSchema.safeParse({
      ...validFeature,
      title: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toContain(
        "Title is required",
      );
    }
  });

  it("rejects invalid status", () => {
    const result = featureCreateSchema.safeParse({
      ...validFeature,
      status: "blocked",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes empty or null priority to null", () => {
    for (const priority of ["", null, undefined]) {
      const result = featureCreateSchema.safeParse({
        ...validFeature,
        priority,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBeNull();
      }
    }
  });

  it("coerces numeric priority from string", () => {
    const result = featureCreateSchema.safeParse({
      ...validFeature,
      priority: "42",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe(42);
    }
  });
});
