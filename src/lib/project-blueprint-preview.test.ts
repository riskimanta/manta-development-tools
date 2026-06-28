import { describe, expect, it } from "vitest";

import { buildBlueprintPreviewSummary } from "@/lib/project-blueprint-preview";
import {
  AUTOMATION_RULE_PACKS,
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
} from "@/lib/project-blueprint-types";

const baseInput = {
  projectType: "fullstack-app" as const,
  stackProfile: "nextjs-prisma-sqlite" as const,
  architectureStyle: "feature-based" as const,
  automationLevel: "safe-autopilot" as const,
  rulePacks: [
    "core-safe-change",
    "git-automation-guardrails",
    "cicd-pipeline-discipline",
  ] as const,
};

describe("buildBlueprintPreviewSummary", () => {
  it("returns labels and rule pack count", () => {
    const summary = buildBlueprintPreviewSummary({
      ...baseInput,
      rulePacks: [...baseInput.rulePacks],
    });

    expect(summary.projectTypeLabel).toBe(
      PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS[baseInput.projectType],
    );
    expect(summary.stackProfileLabel).toBe(
      PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[baseInput.stackProfile],
    );
    expect(summary.architectureStyleLabel).toBe(
      PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS[baseInput.architectureStyle],
    );
    expect(summary.automationLevelLabel).toBe(
      PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG[baseInput.automationLevel].label,
    );
    expect(summary.rulePackCount).toBe(3);
    expect(summary.automationPacks).toEqual([
      PROJECT_BLUEPRINT_RULE_PACK_LABELS["git-automation-guardrails"],
      PROJECT_BLUEPRINT_RULE_PACK_LABELS["cicd-pipeline-discipline"],
    ]);
  });

  it("warns when full autopilot is selected", () => {
    const summary = buildBlueprintPreviewSummary({
      ...baseInput,
      automationLevel: "full-autopilot",
      rulePacks: [...baseInput.rulePacks],
    });

    expect(summary.warnings.some((w) => w.includes("Full Autopilot"))).toBe(true);
  });

  it("warns when deployment automation guard is selected", () => {
    const summary = buildBlueprintPreviewSummary({
      ...baseInput,
      rulePacks: ["core-safe-change", "deployment-automation-guard"],
    });

    expect(summary.warnings.some((w) => w.includes("Deployment Automation Guard"))).toBe(
      true,
    );
  });

  it("lists all selected automation packs", () => {
    const automationPacks = AUTOMATION_RULE_PACKS.slice(0, 3);
    const summary = buildBlueprintPreviewSummary({
      ...baseInput,
      rulePacks: ["core-safe-change", ...automationPacks],
    });

    expect(summary.automationPacks).toHaveLength(3);
    for (const pack of automationPacks) {
      expect(summary.automationPacks).toContain(
        PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack],
      );
    }
  });
});
