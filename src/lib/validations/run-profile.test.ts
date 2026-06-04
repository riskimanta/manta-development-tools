import { describe, expect, it } from "vitest";

import {
  runProfileCreateSchema,
  runProfileUpdateSchema,
} from "@/lib/validations/run-profile";

const validProfile = {
  projectId: "proj_123",
  name: "Dev server",
  command: "pnpm dev",
  workingDirectory: "/Users/dev/app",
  description: "Next.js dev server",
  isDefault: true,
};

describe("runProfileCreateSchema", () => {
  it("accepts valid run profile input", () => {
    const result = runProfileCreateSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        projectId: "proj_123",
        name: "Dev server",
        command: "pnpm dev",
        workingDirectory: "/Users/dev/app",
        description: "Next.js dev server",
        isDefault: true,
      });
    }
  });

  it("rejects missing name", () => {
    const result = runProfileCreateSchema.safeParse({
      ...validProfile,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        "Name is required",
      );
    }
  });

  it("rejects missing command", () => {
    const result = runProfileCreateSchema.safeParse({
      ...validProfile,
      command: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.command).toContain(
        "Command is required",
      );
    }
  });

  it("normalizes empty working directory and description to null", () => {
    const result = runProfileCreateSchema.safeParse({
      ...validProfile,
      workingDirectory: "",
      description: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workingDirectory).toBeNull();
      expect(result.data.description).toBeNull();
    }
  });

  it("parses checkbox isDefault from form values", () => {
    const on = runProfileCreateSchema.safeParse({
      ...validProfile,
      isDefault: "on",
    });
    expect(on.success).toBe(true);
    if (on.success) {
      expect(on.data.isDefault).toBe(true);
    }

    const off = runProfileCreateSchema.safeParse({
      ...validProfile,
      isDefault: null,
    });
    expect(off.success).toBe(true);
    if (off.success) {
      expect(off.data.isDefault).toBe(false);
    }
  });
});

describe("runProfileUpdateSchema", () => {
  it("requires id", () => {
    const result = runProfileUpdateSchema.safeParse(validProfile);
    expect(result.success).toBe(false);
  });
});
