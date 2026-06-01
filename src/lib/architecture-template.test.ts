import { describe, expect, it } from "vitest";

import { buildDefaultArchitectureTemplate } from "@/lib/architecture-template";

describe("buildDefaultArchitectureTemplate", () => {
  it("includes the project name", () => {
    const source = buildDefaultArchitectureTemplate({ name: "ManDev" });
    expect(source).toContain("ManDev");
  });

  it("includes basic architecture nodes", () => {
    const source = buildDefaultArchitectureTemplate({ name: "Sample App" });

    expect(source).toContain("Frontend / UI Layer");
    expect(source).toContain("Actions / API Layer");
    expect(source).toContain("Service Layer");
    expect(source).toContain("Data Access Layer");
    expect(source).toContain("Database");
    expect(source).toContain("Auth / Session");
    expect(source).toContain("Validation");
  });

  it("adds repository context when repoUrl is provided", () => {
    const source = buildDefaultArchitectureTemplate({
      name: "ManDev",
      repoUrl: "https://github.com/example/mandev",
    });

    expect(source).toContain("Repository");
  });

  it("adds local workspace context when localPath is provided", () => {
    const source = buildDefaultArchitectureTemplate({
      name: "ManDev",
      localPath: "/Users/dev/mandev",
    });

    expect(source).toContain("Local workspace");
  });

  it("escapes double quotes in project names", () => {
    const source = buildDefaultArchitectureTemplate({
      name: 'App "Alpha"',
    });

    expect(source).toContain('App \\"Alpha\\"');
  });
});
