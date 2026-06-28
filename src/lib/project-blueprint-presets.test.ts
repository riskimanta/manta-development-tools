import { describe, expect, it } from "vitest";

import {
  applyBlueprintPreset,
  BLUEPRINT_PRESET_IDS,
  BLUEPRINT_PRESETS,
  deploymentReadyWarning,
} from "@/lib/project-blueprint-presets";
import { getDefaultRulePacksForStack } from "@/lib/project-blueprint-types";

const STACK = "nextjs-prisma-sqlite" as const;

describe("project-blueprint-presets", () => {
  it("defines all five presets", () => {
    expect(BLUEPRINT_PRESET_IDS).toEqual([
      "balanced-recommended",
      "strict-automation",
      "cicd-ready",
      "deployment-ready",
      "manual-control",
    ]);
    expect(BLUEPRINT_PRESETS).toHaveLength(5);
    for (const id of BLUEPRINT_PRESET_IDS) {
      const preset = BLUEPRINT_PRESETS.find((p) => p.id === id);
      expect(preset?.label).toBeTruthy();
    }
  });

  it("balanced / recommended uses safe-autopilot and stack defaults", () => {
    const result = applyBlueprintPreset("balanced-recommended", STACK);
    expect(result.automationLevel).toBe("safe-autopilot");
    expect(result.rulePacks).toEqual(getDefaultRulePacksForStack(STACK));
  });

  it("manual control uses manual-assisted without automation packs", () => {
    const result = applyBlueprintPreset("manual-control", STACK);
    expect(result.automationLevel).toBe("manual-assisted");
    expect(result.rulePacks).not.toContain("git-automation-guardrails");
    expect(result.rulePacks).not.toContain("cicd-pipeline-discipline");
    expect(result.rulePacks).not.toContain("deployment-automation-guard");
    expect(result.rulePacks).toContain("core-safe-change");
    expect(result.rulePacks).toContain("testing-validation");
    expect(result.rulePacks).toContain("documentation-discipline");
    expect(result.rulePacks).toContain("nextjs-app-router-safety");
    expect(result.rulePacks).toContain("database-migration-safety");
  });

  it("deployment ready enables deployment, rollback, env secret, smoke test, and CI/CD", () => {
    const result = applyBlueprintPreset("deployment-ready", STACK);
    expect(result.automationLevel).toBe("safe-autopilot");
    expect(result.rulePacks).toContain("deployment-automation-guard");
    expect(result.rulePacks).toContain("rollback-failure-protocol");
    expect(result.rulePacks).toContain("environment-secret-safety");
    expect(result.rulePacks).toContain("smoke-test-health-check");
    expect(result.rulePacks).toContain("cicd-pipeline-discipline");
    expect(result.warnings).toContain(deploymentReadyWarning);
  });

  it("strict automation includes PR review and dependency update safety", () => {
    const result = applyBlueprintPreset("strict-automation", STACK);
    expect(result.automationLevel).toBe("safe-autopilot");
    expect(result.rulePacks).toContain("pr-review-self-checklist");
    expect(result.rulePacks).toContain("dependency-update-safety");
    expect(result.rulePacks).not.toContain("deployment-automation-guard");
    expect(result.rulePacks).not.toContain("rollback-failure-protocol");
  });

  it("no preset sets full-autopilot", () => {
    for (const id of BLUEPRINT_PRESET_IDS) {
      const result = applyBlueprintPreset(id, STACK);
      expect(result.automationLevel).not.toBe("full-autopilot");
    }
  });
});
