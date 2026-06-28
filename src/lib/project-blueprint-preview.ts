import {
  AUTOMATION_RULE_PACKS,
  PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS,
  PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG,
  PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS,
  PROJECT_BLUEPRINT_RULE_PACK_LABELS,
  PROJECT_BLUEPRINT_STACK_PROFILE_LABELS,
  type ProjectBlueprintInput,
} from "@/lib/project-blueprint-types";
import { deploymentReadyWarning } from "@/lib/project-blueprint-presets";

export type BlueprintPreviewSummary = {
  projectTypeLabel: string;
  stackProfileLabel: string;
  architectureStyleLabel: string;
  automationLevelLabel: string;
  rulePackCount: number;
  automationPacks: string[];
  warnings: string[];
};

export function buildBlueprintPreviewSummary(
  input: ProjectBlueprintInput,
): BlueprintPreviewSummary {
  const {
    projectType,
    stackProfile,
    architectureStyle,
    automationLevel,
    rulePacks,
  } = input;

  const warnings: string[] = [];

  if (automationLevel === "full-autopilot") {
    warnings.push(
      "Full Autopilot is advanced. Ensure strong CI, secret safety, smoke test, and rollback policies are in place before using it in production.",
    );
  }

  if (rulePacks.includes("deployment-automation-guard")) {
    warnings.push(
      `Deployment Automation Guard is enabled. ${deploymentReadyWarning}`,
    );
  }

  const automationPacks = rulePacks
    .filter((pack) => AUTOMATION_RULE_PACKS.includes(pack))
    .map((pack) => PROJECT_BLUEPRINT_RULE_PACK_LABELS[pack]);

  return {
    projectTypeLabel: PROJECT_BLUEPRINT_PROJECT_TYPE_LABELS[projectType],
    stackProfileLabel: PROJECT_BLUEPRINT_STACK_PROFILE_LABELS[stackProfile],
    architectureStyleLabel:
      PROJECT_BLUEPRINT_ARCHITECTURE_STYLE_LABELS[architectureStyle],
    automationLevelLabel:
      PROJECT_BLUEPRINT_AUTOMATION_LEVEL_CONFIG[automationLevel].label,
    rulePackCount: rulePacks.length,
    automationPacks,
    warnings,
  };
}
