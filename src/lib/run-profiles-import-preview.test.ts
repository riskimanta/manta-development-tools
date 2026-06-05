import { describe, expect, it } from "vitest";

import { buildRunProfilesImportPreview } from "@/lib/run-profiles-import-preview";

const projectLocalPath = "/Users/dev/app";

const existingProfiles = [
  {
    name: "Dev",
    command: "pnpm dev",
    workingDirectory: "/Users/dev/app",
    description: "Dev server",
    isDefault: true,
  },
  {
    name: "Tests",
    command: "pnpm test",
    workingDirectory: "/Users/dev/app",
    description: null,
    isDefault: false,
  },
  {
    name: "Legacy",
    command: "npm start",
    workingDirectory: null,
    description: "Old script",
    isDefault: false,
  },
];

describe("buildRunProfilesImportPreview", () => {
  it("classifies profiles to create", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Build",
          command: "pnpm build",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.create).toEqual([
      {
        name: "Build",
        command: "pnpm build",
        workingDirectory: projectLocalPath,
        description: null,
        isDefault: false,
      },
    ]);
    expect(preview.update).toEqual([]);
    expect(preview.unchanged).toEqual([]);
    expect(preview.totalInFile).toBe(1);
  });

  it("classifies profiles to update when normalized fields differ", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Tests",
          command: "pnpm test:unit",
          workingDirectory: ".",
          description: "Unit tests",
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update).toEqual([
      {
        name: "Tests",
        command: "pnpm test:unit",
        workingDirectory: projectLocalPath,
        description: "Unit tests",
        isDefault: false,
        changes: [
          {
            field: "command",
            before: "pnpm test",
            after: "pnpm test:unit",
          },
          {
            field: "description",
            before: null,
            after: "Unit tests",
          },
        ],
      },
    ]);
    expect(preview.create).toEqual([]);
    expect(preview.unchanged).toEqual([]);
  });

  it("classifies profiles as unchanged when normalized values match", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.unchanged).toEqual([
      {
        name: "Dev",
        command: "pnpm dev",
        workingDirectory: projectLocalPath,
        description: "Dev server",
        isDefault: true,
      },
    ]);
    expect(preview.update).toEqual([]);
  });

  it("lists kept profiles not present in the import file", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.kept).toEqual([
      { name: "Tests", isDefault: false },
      { name: "Legacy", isDefault: false },
    ]);
  });

  it("reports default unchanged when imported default matches current default", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.currentDefaultName).toBe("Dev");
    expect(preview.nextDefaultName).toBe("Dev");
    expect(preview.defaultWillChange).toBe(false);
  });

  it("reports default changed when import assigns a new default", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Tests",
          command: "pnpm test",
          workingDirectory: null,
          description: null,
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.currentDefaultName).toBe("Dev");
    expect(preview.nextDefaultName).toBe("Tests");
    expect(preview.defaultWillChange).toBe(true);
  });

  it("clears default on kept profiles when import file declares a default", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Tests",
          command: "pnpm test",
          workingDirectory: null,
          description: null,
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.kept).toEqual([
      { name: "Dev", isDefault: true },
      { name: "Legacy", isDefault: false },
    ]);
    expect(preview.nextDefaultName).toBe("Tests");
  });

  it("resolves workingDirectory the same way as import", () => {
    const preview = buildRunProfilesImportPreview({
      existing: [],
      imported: [
        {
          name: "Relative",
          command: "pnpm dev",
          workingDirectory: "apps/web",
          description: null,
          isDefault: false,
        },
        {
          name: "Absolute",
          command: "pnpm start",
          workingDirectory: "/opt/run",
          description: null,
          isDefault: false,
        },
        {
          name: "Missing",
          command: "pnpm build",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.create.map((entry) => entry.name)).toEqual([
      "Relative",
      "Absolute",
      "Missing",
    ]);
    expect(preview.create[0]?.workingDirectory).toBe(
      "/Users/dev/app/apps/web",
    );
    expect(preview.create[1]?.workingDirectory).toBe("/opt/run");
    expect(preview.create[2]?.workingDirectory).toBe(projectLocalPath);
  });

  it("includes command diff when command changes", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Tests",
          command: "pnpm test:unit",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update).toHaveLength(1);
    expect(preview.update[0]?.changes).toEqual([
      {
        field: "command",
        before: "pnpm test",
        after: "pnpm test:unit",
      },
    ]);
  });

  it("includes resolved workingDirectory diff when working directory changes", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Legacy",
          command: "npm start",
          workingDirectory: "apps/web",
          description: "Old script",
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update).toHaveLength(1);
    expect(preview.update[0]?.changes).toEqual([
      {
        field: "workingDirectory",
        before: null,
        after: "/Users/dev/app/apps/web",
      },
    ]);
  });

  it("includes description diff when description changes", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Updated dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update).toHaveLength(1);
    expect(preview.update[0]?.changes).toEqual([
      {
        field: "description",
        before: "Dev server",
        after: "Updated dev server",
      },
    ]);
  });

  it("includes isDefault diff when default flag changes", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Tests",
          command: "pnpm test",
          workingDirectory: null,
          description: null,
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update).toHaveLength(1);
    expect(preview.update[0]?.changes).toEqual([
      {
        field: "isDefault",
        before: false,
        after: true,
      },
    ]);
  });

  it("treats empty descriptions as null in diffs", () => {
    const preview = buildRunProfilesImportPreview({
      existing: [
        {
          name: "Sparse",
          command: "pnpm dev",
          workingDirectory: projectLocalPath,
          description: "   ",
          isDefault: false,
        },
      ],
      imported: [
        {
          name: "Sparse",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Notes",
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.update[0]?.changes).toEqual([
      {
        field: "description",
        before: null,
        after: "Notes",
      },
    ]);
  });

  it("unchanged profiles have no changes array", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.unchanged).toHaveLength(1);
    expect(preview.unchanged[0]).not.toHaveProperty("changes");
    expect(preview.update).toEqual([]);
  });

  it("create and kept entries remain unchanged without field diffs", () => {
    const preview = buildRunProfilesImportPreview({
      existing: existingProfiles,
      imported: [
        {
          name: "Build",
          command: "pnpm build",
          workingDirectory: null,
          description: null,
          isDefault: false,
        },
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: "Dev server",
          isDefault: true,
        },
      ],
      projectLocalPath,
    });

    expect(preview.create).toHaveLength(1);
    expect(preview.create[0]).not.toHaveProperty("changes");
    expect(preview.kept).toEqual([
      { name: "Tests", isDefault: false },
      { name: "Legacy", isDefault: false },
    ]);
    expect(preview.kept[0]).not.toHaveProperty("changes");
  });

  it("matches existing profiles by trimmed name", () => {
    const preview = buildRunProfilesImportPreview({
      existing: [
        {
          name: "  Dev  ",
          command: "pnpm dev",
          workingDirectory: projectLocalPath,
          description: null,
          isDefault: false,
        },
      ],
      imported: [
        {
          name: "Dev",
          command: "pnpm dev",
          workingDirectory: ".",
          description: null,
          isDefault: false,
        },
      ],
      projectLocalPath,
    });

    expect(preview.create).toEqual([]);
    expect(preview.unchanged).toHaveLength(1);
  });
});
