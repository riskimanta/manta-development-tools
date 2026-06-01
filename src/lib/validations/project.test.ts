import { describe, expect, it } from "vitest";

import { projectCreateSchema } from "@/lib/validations/project";

const validProject = {
  name: "ManDev",
  slug: "mandev",
  description: "Internal tools",
  repoUrl: "https://github.com/example/mandev",
  localPath: "/Users/dev/mandev",
};

describe("projectCreateSchema", () => {
  it("accepts valid project input", () => {
    const result = projectCreateSchema.safeParse(validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "ManDev",
        slug: "mandev",
        description: "Internal tools",
        repoUrl: "https://github.com/example/mandev",
        localPath: "/Users/dev/mandev",
      });
    }
  });

  it("rejects invalid slug", () => {
    const cases = ["My Project", "UPPER", "bad_slug", "a--b", ""];
    for (const slug of cases) {
      const result = projectCreateSchema.safeParse({ ...validProject, slug });
      expect(result.success).toBe(false);
    }
  });

  it("rejects missing name", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toContain(
        "Name is required",
      );
    }
  });

  it("normalizes empty optional repoUrl and localPath to null", () => {
    const result = projectCreateSchema.safeParse({
      name: "ManDev",
      slug: "mandev",
      description: "",
      repoUrl: "",
      localPath: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.repoUrl).toBeNull();
      expect(result.data.localPath).toBeNull();
      expect(result.data.description).toBeNull();
    }
  });

  it("trims localPath", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      localPath: "  /tmp/repo  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.localPath).toBe("/tmp/repo");
    }
  });

  it("rejects invalid repoUrl", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      repoUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
