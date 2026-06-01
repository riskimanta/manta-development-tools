import { describe, expect, it } from "vitest";

import {
  buildFeatureCursorPrompt,
  type FeatureCursorPromptInput,
} from "@/lib/cursor-prompt";

function makeInput(
  overrides: Partial<{
    project: Partial<FeatureCursorPromptInput["project"]>;
    feature: Partial<FeatureCursorPromptInput["feature"]>;
  }> = {},
): FeatureCursorPromptInput {
  return {
    project: {
      name: "ManDev",
      slug: "mandev",
      repoUrl: "https://github.com/example/mandev",
      localPath: "/Users/dev/mandev",
      ...overrides.project,
    },
    feature: {
      title: "Add automated tests",
      status: "in_progress",
      priority: 5,
      description: "Vitest for validation and prompt builder",
      ...overrides.feature,
    },
  };
}

describe("buildFeatureCursorPrompt", () => {
  it("includes project name and feature title", () => {
    const prompt = buildFeatureCursorPrompt(makeInput());
    expect(prompt).toContain("ManDev project: ManDev");
    expect(prompt).toContain("Title: Add automated tests");
  });

  it("includes repo URL and local path or fallbacks", () => {
    const withPaths = buildFeatureCursorPrompt(makeInput());
    expect(withPaths).toContain(
      "Repository URL: https://github.com/example/mandev",
    );
    expect(withPaths).toContain("Local path: /Users/dev/mandev");

    const withoutPaths = buildFeatureCursorPrompt(
      makeInput({
        project: { repoUrl: null, localPath: null },
      }),
    );
    expect(withoutPaths).toContain("Repository URL: Not provided");
    expect(withoutPaths).toContain("Local path: Not provided");
  });

  it("includes verification commands", () => {
    const prompt = buildFeatureCursorPrompt(makeInput());
    expect(prompt).toContain("pnpm typecheck");
    expect(prompt).toContain("pnpm lint");
  });

  it("does not embed secrets or environment variable references in the template", () => {
    const prompt = buildFeatureCursorPrompt(makeInput());
    expect(prompt).not.toMatch(/process\.env/);
    expect(prompt).not.toContain("MANDEV_SESSION");
    expect(prompt).not.toMatch(/DATABASE_URL=/);
    expect(prompt).not.toMatch(/API_KEY=/);
  });
});
