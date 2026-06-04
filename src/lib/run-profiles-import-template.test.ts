import { describe, expect, it } from "vitest";

import { buildRunProfilesImportCursorPrompt } from "@/lib/run-profiles-import-template";

describe("buildRunProfilesImportCursorPrompt", () => {
  it("includes core output requirements and file path", () => {
    const prompt = buildRunProfilesImportCursorPrompt({
      name: "Payments API",
    });

    expect(prompt).toContain("You are inside the target project codebase");
    expect(prompt).toContain(".mandev/run-profiles.json");
    expect(prompt).toContain("package.json");
    expect(prompt).toContain("docker-compose.yml");
    expect(prompt).toContain("README.md");
    expect(prompt).toContain(".env.example");
    expect(prompt).toContain("Do not invent commands");
    expect(prompt).toContain("valid JSON only");
    expect(prompt).toContain("Create the `.mandev` folder");
    expect(prompt).toContain("Read run profiles from local path");
  });

  it("includes local path and repo URL when provided", () => {
    const prompt = buildRunProfilesImportCursorPrompt({
      name: "Payments API",
      localPath: "/Users/dev/payments-api",
      repoUrl: "https://github.com/acme/payments-api",
    });

    expect(prompt).toContain("Payments API");
    expect(prompt).toContain("/Users/dev/payments-api");
    expect(prompt).toContain("https://github.com/acme/payments-api");
  });
});
