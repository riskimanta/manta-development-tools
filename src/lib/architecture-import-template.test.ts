import { describe, expect, it } from "vitest";

import { buildArchitectureImportCursorPrompt } from "@/lib/architecture-import-template";

describe("buildArchitectureImportCursorPrompt", () => {
  it("includes core output requirements and file path", () => {
    const prompt = buildArchitectureImportCursorPrompt({
      name: "Payments API",
    });

    expect(prompt).toContain("You are inside the target project codebase");
    expect(prompt).toContain(".mandev/architecture.json");
    expect(prompt).toContain('"summary": string');
    expect(prompt).toContain('"mermaidSource": string');
    expect(prompt).toContain("flowchart TD");
    expect(prompt).toContain("Do not use spaces in node IDs");
    expect(prompt).toContain("git add .mandev/architecture.json");
    expect(prompt).toContain('git commit -m "Add ManDev architecture file"');
    expect(prompt).toContain("Read architecture from local path");
  });

  it("includes local path and repo URL when provided", () => {
    const prompt = buildArchitectureImportCursorPrompt({
      name: "Payments API",
      localPath: "/Users/dev/payments-api",
      repoUrl: "https://github.com/acme/payments-api",
    });

    expect(prompt).toContain("Payments API");
    expect(prompt).toContain("/Users/dev/payments-api");
    expect(prompt).toContain("https://github.com/acme/payments-api");
  });

  it("omits optional context lines when path and repo are empty", () => {
    const prompt = buildArchitectureImportCursorPrompt({
      name: "Solo App",
      localPath: "  ",
      repoUrl: null,
    });

    expect(prompt).toContain("ManDev project name: Solo App");
    expect(prompt).not.toContain("Local path:");
    expect(prompt).not.toContain("Repository URL:");
  });
});
