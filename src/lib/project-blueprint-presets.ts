import {
  AUTOMATION_RULE_PACKS,
  DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
  getDefaultRulePacksForStack,
  getManualControlRulePacks,
  type ProjectBlueprintAutomationLevel,
  type ProjectBlueprintRulePack,
  type ProjectBlueprintStackProfile,
} from "@/lib/project-blueprint-types";

export type BlueprintPresetId =
  | "balanced-recommended"
  | "strict-automation"
  | "cicd-ready"
  | "deployment-ready"
  | "manual-control";

export const BLUEPRINT_PRESET_IDS: BlueprintPresetId[] = [
  "balanced-recommended",
  "strict-automation",
  "cicd-ready",
  "deployment-ready",
  "manual-control",
];

export type BlueprintPreset = {
  id: BlueprintPresetId;
  label: string;
  description: string;
};

export const BLUEPRINT_PRESETS: BlueprintPreset[] = [
  {
    id: "balanced-recommended",
    label: "Balanced / Recommended",
    description: "Safe Autopilot with recommended default rule packs for most projects.",
  },
  {
    id: "strict-automation",
    label: "Strict Automation",
    description:
      "Safe Autopilot with most automation discipline packs, including PR and dependency safety.",
  },
  {
    id: "cicd-ready",
    label: "CI/CD Ready",
    description: "Safe Autopilot with CI/CD, git, branch, environment, and smoke test packs.",
  },
  {
    id: "deployment-ready",
    label: "Deployment Ready",
    description:
      "Safe Autopilot with deployment, rollback, CI/CD, and safety packs for release workflows.",
  },
  {
    id: "manual-control",
    label: "Manual Control",
    description:
      "Manual Assisted with core safety and testing rules only — no automation workflow packs.",
  },
];

export const deploymentReadyWarning =
  "Deployment credentials and platform setup must still be configured manually in your target project.";

export type ApplyBlueprintPresetResult = {
  automationLevel: ProjectBlueprintAutomationLevel;
  rulePacks: ProjectBlueprintRulePack[];
  warnings?: string[];
};

function mergeRulePacks(
  ...packLists: ProjectBlueprintRulePack[][]
): ProjectBlueprintRulePack[] {
  const merged = new Set<ProjectBlueprintRulePack>();
  for (const list of packLists) {
    for (const pack of list) {
      merged.add(pack);
    }
  }
  return Array.from(merged);
}

function getStrictAutomationRulePacks(
  stackProfile: ProjectBlueprintStackProfile,
): ProjectBlueprintRulePack[] {
  const defaults = getDefaultRulePacksForStack(stackProfile);
  const strictAutomation = AUTOMATION_RULE_PACKS.filter(
    (pack) =>
      pack !== "deployment-automation-guard" && pack !== "rollback-failure-protocol",
  );
  return mergeRulePacks(defaults, strictAutomation);
}

function getCicdReadyRulePacks(
  stackProfile: ProjectBlueprintStackProfile,
): ProjectBlueprintRulePack[] {
  const defaults = getDefaultRulePacksForStack(stackProfile);
  return mergeRulePacks(defaults, [
    "cicd-pipeline-discipline",
    "git-automation-guardrails",
    "branch-release-policy",
    "environment-secret-safety",
    "smoke-test-health-check",
  ]);
}

function getDeploymentReadyRulePacks(
  stackProfile: ProjectBlueprintStackProfile,
): ProjectBlueprintRulePack[] {
  return mergeRulePacks(getCicdReadyRulePacks(stackProfile), [
    "deployment-automation-guard",
    "rollback-failure-protocol",
  ]);
}

export function applyBlueprintPreset(
  presetId: BlueprintPresetId,
  stackProfile: ProjectBlueprintStackProfile,
): ApplyBlueprintPresetResult {
  switch (presetId) {
    case "balanced-recommended":
      return {
        automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
        rulePacks: getDefaultRulePacksForStack(stackProfile),
      };
    case "strict-automation":
      return {
        automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
        rulePacks: getStrictAutomationRulePacks(stackProfile),
      };
    case "cicd-ready":
      return {
        automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
        rulePacks: getCicdReadyRulePacks(stackProfile),
      };
    case "deployment-ready":
      return {
        automationLevel: DEFAULT_PROJECT_BLUEPRINT_AUTOMATION_LEVEL,
        rulePacks: getDeploymentReadyRulePacks(stackProfile),
        warnings: [deploymentReadyWarning],
      };
    case "manual-control":
      return {
        automationLevel: "manual-assisted",
        rulePacks: getManualControlRulePacks(stackProfile),
      };
  }
}
