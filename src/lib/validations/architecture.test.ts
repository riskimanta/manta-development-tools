import { describe, expect, it } from "vitest";

import { architectureUpsertSchema } from "@/lib/validations/architecture";

const validInput = {
  projectId: "proj-1",
  summary: "Layered Next.js app",
  mermaidSource: "flowchart TD\n  A --> B",
};

describe("architectureUpsertSchema", () => {
  it("accepts valid architecture input", () => {
    const result = architectureUpsertSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("rejects empty Mermaid source", () => {
    const cases = ["", "   ", "\n\t"];
    for (const mermaidSource of cases) {
      const result = architectureUpsertSchema.safeParse({
        ...validInput,
        mermaidSource,
      });
      expect(result.success).toBe(false);
    }
  });

  it("normalizes empty summary to null", () => {
    const result = architectureUpsertSchema.safeParse({
      ...validInput,
      summary: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary).toBeNull();
    }
  });

  it("trims whitespace-only summary to null", () => {
    const result = architectureUpsertSchema.safeParse({
      ...validInput,
      summary: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary).toBeNull();
    }
  });

  it("rejects missing projectId", () => {
    const result = architectureUpsertSchema.safeParse({
      ...validInput,
      projectId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects overly long summary", () => {
    const result = architectureUpsertSchema.safeParse({
      ...validInput,
      summary: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects overly long Mermaid source", () => {
    const result = architectureUpsertSchema.safeParse({
      ...validInput,
      mermaidSource: "a".repeat(50001),
    });
    expect(result.success).toBe(false);
  });
});
