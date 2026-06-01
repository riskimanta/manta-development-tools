import { describe, expect, it } from "vitest";

import {
  architectureImportFileSchema,
  buildImportedSummary,
  normalizeArchitectureImport,
} from "@/lib/validations/architecture-import";

const validImport = {
  summary: "Layered Next.js app",
  mermaidSource: "flowchart TD\n  User --> UI",
};

describe("architectureImportFileSchema", () => {
  it("accepts valid import JSON", () => {
    const result = architectureImportFileSchema.safeParse(validImport);
    expect(result.success).toBe(true);
  });

  it("rejects missing mermaidSource", () => {
    const cases = [{ mermaidSource: "" }, { mermaidSource: "   " }, {}];
    for (const payload of cases) {
      const result = architectureImportFileSchema.safeParse(payload);
      expect(result.success).toBe(false);
    }
  });

  it("accepts import with only mermaidSource", () => {
    const result = architectureImportFileSchema.safeParse({
      mermaidSource: "flowchart TD\n  A --> B",
    });
    expect(result.success).toBe(true);
  });

  it("allows notes without summary because notes merge into saved summary", () => {
    const result = architectureImportFileSchema.safeParse({
      mermaidSource: "flowchart TD\n  A --> B",
      notes: "Assumptions about auth",
    });
    expect(result.success).toBe(true);
  });

  it("allows detailSections without summary because sections merge into saved summary", () => {
    const result = architectureImportFileSchema.safeParse({
      mermaidSource: "flowchart TD\n  A --> B",
      detailSections: [{ title: "Auth Flow", content: "JWT in cookie" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts notes and detailSections when summary is present", () => {
    const result = architectureImportFileSchema.safeParse({
      summary: "Overview",
      mermaidSource: "flowchart TD\n  A --> B",
      notes: "Inspected src/app",
      detailSections: [
        { title: "Auth Flow", content: "JWT in cookie" },
        { title: "Data Flow", content: "Prisma via services" },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("buildImportedSummary", () => {
  it("returns summary only when no notes or sections", () => {
    expect(
      buildImportedSummary({
        summary: "Core layers",
        notes: undefined,
        detailSections: undefined,
      }),
    ).toBe("Core layers");
  });

  it("merges notes and detailSections into markdown-style summary", () => {
    const merged = buildImportedSummary({
      summary: "Overview",
      notes: "Assumptions listed here",
      detailSections: [
        { title: "Auth Flow", content: "JWT in cookie" },
        { title: "Data Flow", content: "Prisma via services" },
      ],
    });

    expect(merged).toContain("Overview");
    expect(merged).toContain("## Notes\n\nAssumptions listed here");
    expect(merged).toContain("## Auth Flow\n\nJWT in cookie");
    expect(merged).toContain("## Data Flow\n\nPrisma via services");
  });

  it("builds summary from notes and sections when summary field is omitted", () => {
    const merged = buildImportedSummary({
      summary: undefined,
      notes: "Only notes",
      detailSections: [{ title: "API", content: "Server Actions" }],
    });
    expect(merged).toContain("## Notes");
    expect(merged).toContain("## API");
  });
});

describe("normalizeArchitectureImport", () => {
  it("returns normalized summary and mermaidSource", () => {
    const parsed = architectureImportFileSchema.parse({
      summary: "Overview",
      mermaidSource: "  flowchart TD\n  A --> B  ",
      notes: "Checked routes",
    });

    expect(normalizeArchitectureImport(parsed)).toEqual({
      summary: buildImportedSummary(parsed),
      mermaidSource: "flowchart TD\n  A --> B",
    });
  });
});
