import { describe, expect, it } from "vitest";

import {
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
} from "@/lib/project-blueprint-types";
import { buildProjectBlueprintPrompt } from "@/lib/project-blueprint-prompt";

const baseInput = {
  projectType: "fullstack-app" as const,
  stackProfile: "nextjs-prisma-sqlite" as const,
  architectureStyle: "local-first-tool" as const,
  rulePacks: [
    "core-safe-change",
    "ai-coding-guardrails",
    "testing-validation",
    "documentation-discipline",
    "nextjs-app-router-safety",
    "frontend-ui-consistency",
    "database-migration-safety",
  ] as const,
  customNotes: "Prefer pnpm and Vitest.",
};

describe("buildProjectBlueprintPrompt", () => {
  it("includes selected blueprint options and metadata files", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      localPath: "/Users/dev/new-app",
      rulePacks: [...baseInput.rulePacks],
    });

    expect(prompt).toContain(
      PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS[baseInput.projectType],
    );
    expect(prompt).toContain(
      PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[baseInput.stackProfile],
    );
    expect(prompt).toContain(
      PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS[baseInput.architectureStyle],
    );
    for (const pack of baseInput.rulePacks) {
      expect(prompt).toContain(PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]);
    }
    expect(prompt).toContain("Prefer pnpm and Vitest.");
    expect(prompt).toContain("/Users/dev/new-app");

    expect(prompt).toContain(".mandev/project.json");
    expect(prompt).toContain(".mandev/run-profiles.json");
    expect(prompt).toContain(".mandev/architecture.json");
    expect(prompt).toContain(".mandev/blueprint.json");
    expect(prompt).toContain(".mandev/onboarding.md");
    expect(prompt).toContain(".cursor/rules");
    expect(prompt).toContain("README.md");
    expect(prompt).toContain("RESULT.md");
  });

  it("includes safety instructions", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: [...baseInput.rulePacks],
    });

    expect(prompt).toContain(".env");
    expect(prompt).toContain("Do not install packages");
    expect(prompt).toContain("Do not run destructive commands");
    expect(prompt).toContain("Do not read secrets");
  });

  it("works without a local path", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: [...baseInput.rulePacks],
    });

    expect(prompt).toContain("Use the current workspace root as the target project");
    expect(prompt).not.toContain("/Users/dev/new-app");
  });

  it("includes Next.js-specific guidance for Next.js stacks", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      stackProfile: "nextjs-typescript-tailwind",
      rulePacks: [
        "core-safe-change",
        "nextjs-app-router-safety",
        "frontend-ui-consistency",
      ],
    });

    expect(prompt).toContain("pnpm dev");
    expect(prompt).toContain("nextjs-app-router-safety.mdc");
    expect(prompt).toContain("App Router");
  });

  it("includes Spring Boot backend guidance", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      stackProfile: "spring-boot-api",
      rulePacks: ["core-safe-change", "enterprise-backend", "database-migration-safety"],
    });

    expect(prompt).toContain("./mvnw spring-boot:run");
    expect(prompt).toContain("enterprise-backend-discipline.mdc");
    expect(prompt).toContain("Spring Boot");
  });

  it("includes database migration safety guidance for database stacks", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      stackProfile: "nextjs-prisma-postgresql",
      rulePacks: ["core-safe-change", "database-migration-safety"],
    });

    expect(prompt).toContain("database-migration-safety.mdc");
    expect(prompt).toContain("Prisma");
    expect(prompt).toContain("migration");
  });

  it("includes documentation stack run profile hints", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      stackProfile: "documentation-markdown",
      rulePacks: ["core-safe-change", "documentation-discipline"],
    });

    expect(prompt).toContain("Preview Docs");
    expect(prompt).toContain("README.md or docs index");
  });
});
