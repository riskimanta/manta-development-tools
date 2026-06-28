import { describe, expect, it } from "vitest";

import {
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
} from "@/lib/project-blueprint-types";
import { buildProjectBlueprintPrompt } from "@/lib/project-blueprint-prompt";

const baseInput = {
  projectType: "fullstack-app" as const,
  stackProfile: "nextjs-prisma-sqlite" as const,
  architectureStyle: "local-first-tool" as const,
  automationLevel: "safe-autopilot" as const,
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

  it("includes automation level in the prompt", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: [...baseInput.rulePacks],
    });

    const config =
      PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG[baseInput.automationLevel];

    expect(prompt).toContain(config.label);
    expect(prompt).toContain("`safe-autopilot`");
    expect(prompt).toContain("## Automation level policy");
    expect(prompt).toContain(config.safetyPolicyText);
    expect(prompt).toContain('"automationLevel": "safe-autopilot"');
  });

  it("includes RESULT.md workflow discipline when selected", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: ["core-safe-change", "result-md-workflow-discipline"],
    });

    expect(prompt).toContain("## Selected rule pack policies");
    expect(prompt).toContain("RESULT.md Workflow Discipline");
    expect(prompt).toContain("Every task overwrites `RESULT.md`");
    expect(prompt).toContain("No appending endless logs");
    expect(prompt).toContain("git status");
    expect(prompt).toContain("Do not claim done unless RESULT.md is updated");
  });

  it("includes auto error recovery loop when selected", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: ["core-safe-change", "auto-error-recovery-loop"],
    });

    expect(prompt).toContain("Auto Error Recovery Loop");
    expect(prompt).toContain("run lint/typecheck/test/build");
    expect(prompt).toContain("Limit recovery loops");
    expect(prompt).toContain("Never disable lint/type rules");
  });

  it("includes git automation guardrails when selected", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: ["core-safe-change", "git-automation-guardrails"],
    });

    expect(prompt).toContain("Git Automation Guardrails");
    expect(prompt).toContain("Never use `git add .`");
    expect(prompt).toContain("Never use `git commit -am`");
    expect(prompt).toContain("Create feature/fix/chore/docs branches");
  });

  it("includes CI/CD and deployment policies when selected", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: [
        "core-safe-change",
        "cicd-pipeline-discipline",
        "deployment-automation-guard",
      ],
    });

    expect(prompt).toContain("CI/CD Pipeline Discipline");
    expect(prompt).toContain("install, lint, typecheck, test, and build");
    expect(prompt).toContain("Deployment Automation Guard");
    expect(prompt).toContain("Deploy only from main/release branches");
    expect(prompt).toContain("Never print secrets");
  });

  it("excludes unselected optional pack policies", () => {
    const prompt = buildProjectBlueprintPrompt({
      ...baseInput,
      rulePacks: ["core-safe-change", "cicd-pipeline-discipline"],
    });

    expect(prompt).not.toContain("### Deployment Automation Guard");
    expect(prompt).not.toContain("### Rollback & Failure Protocol");
    expect(prompt).not.toContain("### PR Review Self-Checklist");
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
