import { describe, expect, it } from "vitest";

import {
  AUTOMATION_RULE_PACKS,
  clearOptionalAutomationPacks,
  DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
  getAllAutomationRulePacks,
  getDefaultRulePacksForStack,
  getRecommendedRulePacks,
  getResetBlueprintDefaults,
  OPTIONAL_AUTOMATION_RULE_PACKS,
  PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG,
  PROJECT_BLUEPRINT_AUTOMATION_LEVELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_RULE_PACKS,
  type ProjectBlueprintRulePack,
  RULE_PACK_GROUPS,
  RULE_PACK_CURSOR_RULE_FILES,
} from "@/lib/project-blueprint-types";

const EXPECTED_AUTOMATION_DEFAULTS = [
  "core-safe-change",
  "ai-coding-guardrails",
  "testing-validation",
  "documentation-discipline",
  "result-md-workflow-discipline",
  "auto-error-recovery-loop",
  "git-automation-guardrails",
  "cicd-pipeline-discipline",
  "environment-secret-safety",
  "smoke-test-health-check",
  "branch-release-policy",
] as const;

const OPTIONAL_AUTOMATION_PACKS = [
  "deployment-automation-guard",
  "rollback-failure-protocol",
  "rule-skill-sync-automation",
  "dependency-update-safety",
  "pr-review-self-checklist",
] as const;

describe("project-blueprint-types", () => {
  it("includes all 12 automation rule packs with labels and cursor rule files", () => {
    expect(AUTOMATION_RULE_PACKS).toHaveLength(12);

    for (const pack of AUTOMATION_RULE_PACKS) {
      expect(PROJECT_BLUEPRINT_RULE_PACKS).toContain(pack);
      expect(PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]).toBeTruthy();
      expect(RULE_PACK_CURSOR_RULE_FILES[pack]).toMatch(/\.mdc$/);
    }
  });

  it("defaults automation level to safe-autopilot", () => {
    expect(DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL).toBe("safe-autopilot");
  });

  it("defines automation level labels and descriptions for all levels", () => {
    expect(PROJECT_BLUEPRINT_AUTOMATION_LEVELS).toEqual([
      "manual-assisted",
      "safe-autopilot",
      "full-autopilot",
    ]);

    for (const level of PROJECT_BLUEPRINT_AUTOMATION_LEVELS) {
      const config = PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG[level];
      expect(config.label).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.guidanceText).toBeTruthy();
      expect(config.safetyPolicyText).toBeTruthy();
    }
  });

  it("includes recommended automation defaults for nextjs-prisma-sqlite", () => {
    const defaults = getDefaultRulePacksForStack("nextjs-prisma-sqlite");

    for (const pack of EXPECTED_AUTOMATION_DEFAULTS) {
      expect(defaults).toContain(pack);
    }

    expect(defaults).toContain("nextjs-app-router-safety");
    expect(defaults).toContain("frontend-ui-consistency");
    expect(defaults).toContain("database-migration-safety");
  });

  it("excludes optional automation packs from defaults", () => {
    const defaults = getDefaultRulePacksForStack("nextjs-prisma-sqlite");

    for (const pack of OPTIONAL_AUTOMATION_PACKS) {
      expect(defaults).not.toContain(pack);
    }

    expect(defaults).not.toContain("local-first-tooling");
    expect(defaults).not.toContain("enterprise-backend");
  });

  it("adds enterprise-backend for Spring Boot stacks", () => {
    const defaults = getDefaultRulePacksForStack("spring-boot-api");

    expect(defaults).toContain("enterprise-backend");
    expect(defaults).toContain("database-migration-safety");
  });

  it("groups all 21 rule packs exactly once", () => {
    const grouped = RULE_PACK_GROUPS.flatMap((group) => group.packs);
    expect(grouped).toHaveLength(21);
    expect(new Set(grouped).size).toBe(21);
    for (const pack of PROJECT_BLUEPRINT_RULE_PACKS) {
      expect(grouped).toContain(pack);
    }
  });

  it("exposes optional automation rule packs", () => {
    expect(OPTIONAL_AUTOMATION_RULE_PACKS).toEqual(OPTIONAL_AUTOMATION_PACKS);
  });

  it("getRecommendedRulePacks matches stack defaults", () => {
    expect(getRecommendedRulePacks("nextjs-prisma-sqlite")).toEqual(
      getDefaultRulePacksForStack("nextjs-prisma-sqlite"),
    );
  });

  it("getAllAutomationRulePacks returns all automation packs", () => {
    expect(getAllAutomationRulePacks()).toEqual(AUTOMATION_RULE_PACKS);
  });

  it("getResetBlueprintDefaults resets to safe-autopilot and stack defaults", () => {
    const reset = getResetBlueprintDefaults("nextjs-prisma-sqlite");
    expect(reset.automationLevel).toBe("safe-autopilot");
    expect(reset.rulePacks).toEqual(getDefaultRulePacksForStack("nextjs-prisma-sqlite"));
  });

  it("clearOptionalAutomationPacks removes optional packs only", () => {
    const withOptional: ProjectBlueprintRulePack[] = [
      ...getDefaultRulePacksForStack("nextjs-prisma-sqlite"),
      "deployment-automation-guard",
      "pr-review-self-checklist",
    ];
    const cleared = clearOptionalAutomationPacks(withOptional);

    for (const pack of OPTIONAL_AUTOMATION_PACKS) {
      expect(cleared).not.toContain(pack);
    }
    expect(cleared).toContain("core-safe-change");
    expect(cleared).toContain("cicd-pipeline-discipline");
  });
});
