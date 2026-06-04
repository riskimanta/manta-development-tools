import { describe, expect, it } from "vitest";

import {
  normalizeRunProfilesImport,
  runProfilesImportFileSchema,
} from "@/lib/validations/run-profile-import";

const validImport = {
  profiles: [
    {
      name: "Dev Server",
      command: "pnpm dev",
      workingDirectory: ".",
      description: "Run the dev server",
      isDefault: true,
    },
    {
      name: "Tests",
      command: "pnpm test",
      isDefault: false,
    },
  ],
};

describe("runProfilesImportFileSchema", () => {
  it("accepts valid import JSON", () => {
    const result = runProfilesImportFileSchema.safeParse(validImport);
    expect(result.success).toBe(true);
  });

  it("rejects missing profiles array", () => {
    const result = runProfilesImportFileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty profiles array", () => {
    const result = runProfilesImportFileSchema.safeParse({ profiles: [] });
    expect(result.success).toBe(false);
  });

  it("rejects profile without name or command", () => {
    expect(
      runProfilesImportFileSchema.safeParse({
        profiles: [{ command: "pnpm dev" }],
      }).success,
    ).toBe(false);
    expect(
      runProfilesImportFileSchema.safeParse({
        profiles: [{ name: "Dev" }],
      }).success,
    ).toBe(false);
  });

  it("rejects more than one isDefault: true", () => {
    const result = runProfilesImportFileSchema.safeParse({
      profiles: [
        { name: "A", command: "a", isDefault: true },
        { name: "B", command: "b", isDefault: true },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.profiles?.[0]).toContain(
        "isDefault",
      );
    }
  });

  it("allows optional workingDirectory, description, and isDefault", () => {
    const result = runProfilesImportFileSchema.safeParse({
      profiles: [{ name: "Build", command: "pnpm build" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profiles[0]?.isDefault).toBe(false);
    }
  });
});

describe("normalizeRunProfilesImport", () => {
  it("normalizes trimmed profile fields", () => {
    const parsed = runProfilesImportFileSchema.parse({
      profiles: [
        {
          name: "  Dev  ",
          command: "  pnpm dev  ",
          workingDirectory: "src",
          description: "  Local  ",
          isDefault: true,
        },
      ],
    });

    expect(normalizeRunProfilesImport(parsed)).toEqual({
      profiles: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: "src",
          description: "Local",
          isDefault: true,
        },
      ],
    });
  });
});
