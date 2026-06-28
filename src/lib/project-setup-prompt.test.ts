import { describe, expect, it } from "vitest";

import { buildProjectSetupPrompt } from "@/lib/project-setup-prompt";

describe("buildProjectSetupPrompt", () => {
  it("includes all ManDev metadata files and safety instructions", () => {
    const prompt = buildProjectSetupPrompt();

    expect(prompt).toContain(".mandev/project.json");
    expect(prompt).toContain(".mandev/run-profiles.json");
    expect(prompt).toContain(".mandev/architecture.json");
    expect(prompt).toContain("Do not read secrets such as .env files");
    expect(prompt).toContain("Do not install packages");
    expect(prompt).toContain("Do not run destructive commands");
    expect(prompt).toContain("Use the current workspace root as the target project");
  });

  it("includes local path when provided", () => {
    const prompt = buildProjectSetupPrompt({
      localPath: "/Users/dev/my-app",
    });

    expect(prompt).toContain("/Users/dev/my-app");
    expect(prompt).not.toContain("Use the current workspace root as the target project");
  });

  it("includes run profiles and architecture format guidance", () => {
    const prompt = buildProjectSetupPrompt();

    expect(prompt).toContain('"profiles"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"mermaidSource"');
    expect(prompt).toContain("flowchart TD");
  });
});
